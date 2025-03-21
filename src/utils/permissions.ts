// src/utils/permissions.ts
export const PERMISSIONS = {
  MANAGE_TEAM: "manage_team",
  CREATE_PROJECT: "create_project",
  DELETE_PROJECT: "delete_project",
  EDIT_TASK: "edit_task",
  // Add more as needed
};

export const ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MEMBER]: [PERMISSIONS.CREATE_PROJECT, PERMISSIONS.EDIT_TASK],
  [ROLES.VIEWER]: [],
};

export function hasPermission(userRole: string, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}
