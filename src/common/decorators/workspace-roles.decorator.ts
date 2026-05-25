import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';

export const WORKSPACE_ROLES_KEY = 'workspace_roles';

export const WorkspaceRoles = (...roles: WorkspaceRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(WORKSPACE_ROLES_KEY, roles);