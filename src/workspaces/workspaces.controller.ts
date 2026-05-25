import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WorkspaceRoles } from '../common/decorators/workspace-roles.decorator';
import { apiResponse } from '../common/dto/api-response.dto';
import { WorkspaceRolesGuard } from '../common/guards/workspace-roles.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';

import type { ApiResponse } from '../common/dto/api-response.dto';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { WorkspaceSummary } from './workspaces.service';
@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateWorkspaceDto,
  ): Promise<ApiResponse<WorkspaceSummary>> {
    const workspace = await this.workspacesService.create(user.id, dto);
    return apiResponse('Workspace created successfully', workspace);
  }

  @Get()
  async findMine(@CurrentUser() user: AuthUser): Promise<ApiResponse<WorkspaceSummary[]>> {
    const workspaces = await this.workspacesService.findUserWorkspaces(user.id);
    return apiResponse('Workspaces fetched successfully', workspaces);
  }

  @Patch(':id')
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @UseGuards(WorkspaceRolesGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ): Promise<ApiResponse<WorkspaceSummary>> {
    const workspace = await this.workspacesService.update(id, dto);
    return apiResponse('Workspace updated successfully', workspace);
  }

  @Delete(':id')
  @WorkspaceRoles(WorkspaceRole.OWNER)
  @UseGuards(WorkspaceRolesGuard)
  async remove(@Param('id') id: string): Promise<ApiResponse<{ id: string }>> {
    await this.workspacesService.remove(id);
    return apiResponse('Workspace deleted successfully', { id });
  }
}