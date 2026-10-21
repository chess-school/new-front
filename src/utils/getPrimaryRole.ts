export const ROLE_PRIORITY: { [key: string]: number } = {
  admin: 4,
  coach: 3,
  student: 2,
  user: 1,
};

// Роли приходят с бэкенда заглавными (ADMIN, COACH, USER) — сравниваем без учёта регистра,
// а возвращаем роль в исходном виде
export const getPrimaryRole = (roles: string[] = []): string => {
  if (roles.length === 0) return 'user';
  const priority = (role: string) => ROLE_PRIORITY[role.toLowerCase()] || 0;
  return [...roles].sort((a, b) => priority(b) - priority(a))[0];
};
