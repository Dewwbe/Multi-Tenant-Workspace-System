import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Workspace, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

export type WorkspaceSummary = Workspace;

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateWorkspaceDto): Promise<WorkspaceSummary> {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Workspace slug already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          ownerId,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: ownerId,
          role: WorkspaceRole.OWNER,
        },
      });

      return workspace;
    });
  }

  async findUserWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((membership) => membership.workspace);
  }

  async update(id: string, dto: UpdateWorkspaceDto): Promise<WorkspaceSummary> {
    await this.ensureWorkspaceExists(id);

    return this.prisma.workspace.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.ensureWorkspaceExists(id);

    await this.prisma.workspace.delete({
      where: { id },
    });
  }

  private async ensureWorkspaceExists(id: string): Promise<void> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
  }
}