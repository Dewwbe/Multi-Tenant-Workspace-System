import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WorkspaceRoles } from '../common/decorators/workspace-roles.decorator';
import { apiResponse } from '../common/dto/api-response.dto';
import { WorkspaceRolesGuard } from '../common/guards/workspace-roles.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MembersService } from './members.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ApiResponse } from '../common/dto/api-response.dto';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { MemberSummary } from './members.service';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post('workspaces/:id/members')
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @UseGuards(WorkspaceRolesGuard)
  async addMember(
    @Param('id') workspaceId: string,
    @Body() dto: AddMemberDto,
  ): Promise<ApiResponse<MemberSummary>> {
    const member = await this.membersService.addMember(workspaceId, dto);
    return apiResponse('Member added successfully', member);
  }

  @Patch('members/:id/role')
  async updateRole(
    @CurrentUser() user: AuthUser,
    @Param('id') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<ApiResponse<MemberSummary>> {
    const member = await this.membersService.updateRole(user.id, memberId, dto);
    return apiResponse('Member role updated successfully', member);
  }

  @Delete('members/:id')
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') memberId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await this.membersService.removeMember(user.id, memberId);
    return apiResponse('Member removed successfully', { id: memberId });
  }
}
