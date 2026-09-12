export const ROLES = {
  banned: -1,
  user: 0,
  tester: 1,
  moderator: 2,
  support: 3,
  finance: 3,
  developer: 3,
  admin: 4,
  founder: 999,
} as const;

export type Role = keyof typeof ROLES;

export function hasRole(userRole: string, minRole: Role): boolean {
  const userRank = ROLES[userRole as Role] ?? 0;
  const minRank = ROLES[minRole] ?? 0;
  return userRank >= minRank;
}

export function isProtected(userRole: string): boolean {
  return userRole === "founder";
}

export function isStaff(userRole: string): boolean {
  return hasRole(userRole, "moderator");
}

export function isAdmin(userRole: string): boolean {
  return hasRole(userRole, "admin");
}
