import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    enum: WorkspaceRole,
    example: WorkspaceRole.MEMBER,
  })
  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole;
}