import {
  Body,
  Controller,
  Delete,
  Get,
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
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard';
import { WorkspaceRolesGuard } from '../common/guards/workspace-roles.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ApiResponse } from '../common/dto/api-response.dto';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { NoteSummary } from './notes.service';

@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('workspaces/:id/notes')
  @WorkspaceRoles(
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
  )
  @UseGuards(WorkspaceRolesGuard)
  async create(
    @CurrentUser() user: AuthUser,
    @Param('id') workspaceId: string,
    @Body() dto: CreateNoteDto,
  ): Promise<ApiResponse<NoteSummary>> {
    const note = await this.notesService.create(user.id, workspaceId, dto);
    return apiResponse('Note created successfully', note);
  }

  @Get('workspaces/:id/notes')
  @UseGuards(WorkspaceMemberGuard)
  async findWorkspaceNotes(
    @Param('id') workspaceId: string,
  ): Promise<ApiResponse<NoteSummary[]>> {
    const notes = await this.notesService.findWorkspaceNotes(workspaceId);
    return apiResponse('Notes fetched successfully', notes);
  }

  @Patch('notes/:id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') noteId: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<ApiResponse<NoteSummary>> {
    const note = await this.notesService.update(user.id, noteId, dto);
    return apiResponse('Note updated successfully', note);
  }

  @Delete('notes/:id')
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') noteId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await this.notesService.remove(user.id, noteId);
    return apiResponse('Note deleted successfully', { id: noteId });
  }
}
