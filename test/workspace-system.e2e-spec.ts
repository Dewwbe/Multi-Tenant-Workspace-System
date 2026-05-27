import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

interface WorkspaceResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface WorkspacesListResponse {
  success: boolean;
  message: string;
  data: WorkspaceResponse['data'][];
}

interface MemberResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    workspaceId: string;
    userId: string;
    role: string;
    createdAt: string;
  };
}

interface NoteResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    content: string;
    workspaceId: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface NotesListResponse {
  success: boolean;
  message: string;
  data: NoteResponse['data'][];
}

jest.setTimeout(30000);

describe('Multi-Tenant Workspace System E2E', () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;

  let ownerToken: string;
  let memberToken: string;
  let viewerToken: string;
  let outsiderToken: string;

  let workspaceId: string;
  let outsiderWorkspaceId: string;
  let noteId: string;
  let memberNoteId: string;
  let memberMembershipId: string;

  const unique = Date.now();

  const ownerEmail = `owner${unique}@example.com`;
  const memberEmail = `member${unique}@example.com`;
  const viewerEmail = `viewer${unique}@example.com`;
  const outsiderEmail = `outsider${unique}@example.com`;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL?.includes('workspace_test_db')) {
      throw new Error(
        'E2E tests must use workspace_test_db. Check .env.test and test:e2e script.',
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = app.get<PrismaService>(PrismaService);

    await app.init();

    httpServer = app.getHttpServer() as Server;

    await prisma.note.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.note.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();

    await app.close();
  });

  it('registers owner user', async () => {
    const response = await request(httpServer)
      .post('/auth/register')
      .send({
        name: 'Owner User',
        email: ownerEmail,
        password: 'password123',
      })
      .expect(201);

    const body = response.body as AuthResponse;

    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.user.email).toBe(ownerEmail);
    expect(body.data.user).not.toHaveProperty('password');

    ownerToken = body.data.accessToken;
  });

  it('logs in owner user', async () => {
    const response = await request(httpServer)
      .post('/auth/login')
      .send({
        email: ownerEmail,
        password: 'password123',
      })
      .expect(201);

    const body = response.body as AuthResponse;

    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
  });

  it('blocks protected route without token', async () => {
    await request(httpServer).get('/workspaces').expect(401);
  });

  it('creates workspace and owner membership', async () => {
    const response = await request(httpServer)
      .post('/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Test Workspace',
        slug: `test-workspace-${unique}`,
      })
      .expect(201);

    const body = response.body as WorkspaceResponse;

    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();

    workspaceId = body.data.id;

    const ownerMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        role: 'OWNER',
      },
    });

    expect(ownerMembership).toBeTruthy();
  });

  it('returns only user workspaces', async () => {
    const response = await request(httpServer)
      .get('/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const body = response.body as WorkspacesListResponse;

    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]?.id).toBe(workspaceId);
  });

  it('registers member, viewer, and outsider users', async () => {
    const users = [
      { name: 'Member User', email: memberEmail },
      { name: 'Viewer User', email: viewerEmail },
      { name: 'Outsider User', email: outsiderEmail },
    ];

    for (const user of users) {
      await request(httpServer)
        .post('/auth/register')
        .send({
          name: user.name,
          email: user.email,
          password: 'password123',
        })
        .expect(201);
    }

    const memberLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: memberEmail,
        password: 'password123',
      })
      .expect(201);

    const viewerLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: viewerEmail,
        password: 'password123',
      })
      .expect(201);

    const outsiderLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: outsiderEmail,
        password: 'password123',
      })
      .expect(201);

    memberToken = (memberLogin.body as AuthResponse).data.accessToken;
    viewerToken = (viewerLogin.body as AuthResponse).data.accessToken;
    outsiderToken = (outsiderLogin.body as AuthResponse).data.accessToken;
  });

  it('outsider creates own workspace for tenant isolation testing', async () => {
    const response = await request(httpServer)
      .post('/workspaces')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        name: 'Outsider Workspace',
        slug: `outsider-workspace-${unique}`,
      })
      .expect(201);

    const body = response.body as WorkspaceResponse;

    outsiderWorkspaceId = body.data.id;

    expect(outsiderWorkspaceId).toBeDefined();
  });

  it('owner adds member to workspace', async () => {
    const response = await request(httpServer)
      .post(`/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: memberEmail,
        role: 'MEMBER',
      })
      .expect(201);

    const body = response.body as MemberResponse;

    expect(body.success).toBe(true);
    expect(body.data.role).toBe('MEMBER');

    memberMembershipId = body.data.id;
  });

  it('owner adds viewer to workspace', async () => {
    const response = await request(httpServer)
      .post(`/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: viewerEmail,
        role: 'VIEWER',
      })
      .expect(201);

    const body = response.body as MemberResponse;

    expect(body.success).toBe(true);
    expect(body.data.role).toBe('VIEWER');
  });

  it('prevents duplicate membership', async () => {
    await request(httpServer)
      .post(`/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: memberEmail,
        role: 'MEMBER',
      })
      .expect(409);
  });

  it('member cannot add another member', async () => {
    await request(httpServer)
      .post(`/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        email: outsiderEmail,
        role: 'MEMBER',
      })
      .expect(403);
  });

  it('owner creates note', async () => {
    const response = await request(httpServer)
      .post(`/workspaces/${workspaceId}/notes`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Owner Note',
        content: 'Created by owner',
      })
      .expect(201);

    const body = response.body as NoteResponse;

    expect(body.success).toBe(true);
    expect(body.data.workspaceId).toBe(workspaceId);

    noteId = body.data.id;
  });

  it('member creates note', async () => {
    const response = await request(httpServer)
      .post(`/workspaces/${workspaceId}/notes`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Member Note',
        content: 'Created by member',
      })
      .expect(201);

    const body = response.body as NoteResponse;

    expect(body.success).toBe(true);
    expect(body.data.workspaceId).toBe(workspaceId);

    memberNoteId = body.data.id;
  });

  it('viewer cannot create note', async () => {
    await request(httpServer)
      .post(`/workspaces/${workspaceId}/notes`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        title: 'Viewer Note',
        content: 'Viewer should not create this',
      })
      .expect(403);
  });

  it('workspace member can read workspace notes', async () => {
    const response = await request(httpServer)
      .get(`/workspaces/${workspaceId}/notes`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);

    const body = response.body as NotesListResponse;

    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((note) => note.workspaceId === workspaceId)).toBe(
      true,
    );
  });

  it('outsider cannot read workspace notes', async () => {
    await request(httpServer)
      .get(`/workspaces/${workspaceId}/notes`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });

  it('owner updates note', async () => {
    const response = await request(httpServer)
      .patch(`/notes/${noteId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Updated Owner Note',
        content: 'Updated by owner',
      })
      .expect(200);

    const body = response.body as NoteResponse;

    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Updated Owner Note');
  });

  it('owner changes member role to admin', async () => {
    const response = await request(httpServer)
      .patch(`/members/${memberMembershipId}/role`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        role: 'ADMIN',
      })
      .expect(200);

    const body = response.body as MemberResponse;

    expect(body.success).toBe(true);
    expect(body.data.role).toBe('ADMIN');
  });

  it('admin cannot add another admin', async () => {
    await request(httpServer)
      .post(`/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        email: outsiderEmail,
        role: 'ADMIN',
      })
      .expect(403);
  });

  it('outsider cannot infer another tenant member exists', async () => {
    await request(httpServer)
      .patch(`/members/${memberMembershipId}/role`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        role: 'MEMBER',
      })
      .expect(404);
  });

  it('outsider cannot infer another tenant note exists', async () => {
    await request(httpServer)
      .patch(`/notes/${noteId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        title: 'Trying to infer note existence',
      })
      .expect(404);
  });

  it('downgraded note creator cannot update own note as viewer', async () => {
    await request(httpServer)
      .patch(`/members/${memberMembershipId}/role`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        role: 'VIEWER',
      })
      .expect(200);

    await request(httpServer)
      .patch(`/notes/${memberNoteId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Viewer should not update own old note',
      })
      .expect(403);
  });

  it('member cannot delete workspace', async () => {
    await request(httpServer)
      .delete(`/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('owner deletes note', async () => {
    await request(httpServer)
      .delete(`/notes/${noteId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
  });
});
