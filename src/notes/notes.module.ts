import { Module } from '@nestjs/common';
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard';
import { WorkspaceRolesGuard } from '../common/guards/workspace-roles.guard';
import { MembersModule } from '../members/members.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [MembersModule],
  controllers: [NotesController],
  providers: [NotesService, WorkspaceMemberGuard, WorkspaceRolesGuard],
})
export class NotesModule {}