export const ROLE_PRIORITY: { [key: string]: number } = {
  admin: 4,
  coach: 3,
  student: 2,
  user: 1,
};

export const getPrimaryRole = (roles: string[] = []): string => {
  if (roles.length === 0) return 'user';
  return [...roles].sort((a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0))[0];
};