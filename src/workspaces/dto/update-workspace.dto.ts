import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: 'Updated EFutures Workspace' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  name?: string;
}
