import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Note, WorkspaceRole } from '@prisma/client';
import { MembersService } from '../members/members.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

export type NoteSummary = Note;

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membersService: MembersService,
  ) {}

  async create(userId: string, workspaceId: string, dto: CreateNoteDto): Promise<NoteSummary> {
    return this.prisma.note.create({
      data: {
        title: dto.title,
        content: dto.content,
        workspaceId,
        createdBy: userId,
      },
    });
  }

  async findWorkspaceNotes(workspaceId: string): Promise<NoteSummary[]> {
    return this.prisma.note.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, noteId: string, dto: UpdateNoteDto): Promise<NoteSummary> {
    const note = await this.findNoteOrThrow(noteId);

    await this.ensureCanModifyNote(userId, note);

    return this.prisma.note.update({
      where: { id: noteId },
      data: dto,
    });
  }

  async remove(userId: string, noteId: string): Promise<void> {
    const note = await this.findNoteOrThrow(noteId);

    await this.ensureCanModifyNote(userId, note);

    await this.prisma.note.delete({
      where: { id: noteId },
    });
  }

  private async findNoteOrThrow(noteId: string): Promise<Note> {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  private async ensureCanModifyNote(userId: string, note: Note): Promise<void> {
    const membership = await this.membersService.getMembershipOrThrow(userId, note.workspaceId);

    const isCreator = note.createdBy === userId;
    const isAdminOrOwner =
      membership.role === WorkspaceRole.ADMIN || membership.role === WorkspaceRole.OWNER;

    if (!isCreator && !isAdminOrOwner) {
      throw new ForbiddenException('You do not have permission to modify this note');
    }
  }
}