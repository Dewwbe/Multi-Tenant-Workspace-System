import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'Updated Workspace Note' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated note content.' })
  @IsString()
  @IsOptional()
  content?: string;
}
