export enum DatabaseRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export function canDeleteDatabase(role: DatabaseRole): boolean {
  return role === DatabaseRole.OWNER;
}

export function canModifySchema(role: DatabaseRole): boolean {
  return role === DatabaseRole.OWNER;
}

export function canEditData(role: DatabaseRole): boolean {
  return role === DatabaseRole.OWNER || role === DatabaseRole.EDITOR;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canViewData(role: DatabaseRole): boolean {
  return true;
}

export function canManagePermissions(role: DatabaseRole): boolean {
  return role === DatabaseRole.OWNER;
}

export function canChangeOwner(role: DatabaseRole): boolean {
  return role === DatabaseRole.OWNER;
}
