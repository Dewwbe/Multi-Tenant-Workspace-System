import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'First Workspace Note' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'This note belongs only to this workspace.' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
