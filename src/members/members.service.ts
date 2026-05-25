import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceMember, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

export type MemberSummary = WorkspaceMember;

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async addMember(workspaceId: string, dto: AddMemberDto): Promise<MemberSummary> {
    if (dto.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Owner role cannot be assigned here');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this workspace');
    }

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: dto.role ?? WorkspaceRole.MEMBER,
      },
    });
  }

  async updateRole(
    actorUserId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<MemberSummary> {
    if (dto.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Owner role cannot be assigned from this endpoint');
    }

    const targetMember = await this.findMemberOrThrow(memberId);

    await this.requireRole(actorUserId, targetMember.workspaceId, [WorkspaceRole.OWNER]);

    if (targetMember.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Owner role cannot be changed');
    }

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: dto.role },
    });
  }

  async removeMember(actorUserId: string, memberId: string): Promise<void> {
    const targetMember = await this.findMemberOrThrow(memberId);
    const actorMember = await this.getMembershipOrThrow(actorUserId, targetMember.workspaceId);

    if (targetMember.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Owner cannot be removed');
    }

    const actorIsOwner = actorMember.role === WorkspaceRole.OWNER;
    const actorIsAdmin = actorMember.role === WorkspaceRole.ADMIN;

    const targetIsLowerRole =
      targetMember.role === WorkspaceRole.MEMBER || targetMember.role === WorkspaceRole.VIEWER;

    if (!actorIsOwner && !(actorIsAdmin && targetIsLowerRole)) {
      throw new ForbiddenException('You do not have permission to remove this member');
    }

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });
  }

  async getMembershipOrThrow(userId: string, workspaceId: string): Promise<WorkspaceMember> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return membership;
  }

  async requireRole(
    userId: string,
    workspaceId: string,
    allowedRoles: WorkspaceRole[],
  ): Promise<WorkspaceMember> {
    const membership = await this.getMembershipOrThrow(userId, workspaceId);

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission for this action');
    }

    return membership;
  }

  private async findMemberOrThrow(memberId: string): Promise<WorkspaceMember> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }
}