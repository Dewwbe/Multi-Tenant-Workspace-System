import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'EFutures Workspace' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'efutures-workspace' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug!: string;
}
