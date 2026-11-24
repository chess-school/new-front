// Зеркало бэкенда v2/utils/clubPermissions.js — клубные роли и их права на фронте
// (видимость пунктов навигации и действий на экране «Участники»).
import type { ClubRole } from './clubsApi';

export type ClubCap =
  | 'billing' | 'deleteClub' | 'manageRoles' | 'manageMembers'
  | 'manageSite' | 'manageLeads' | 'teach' | 'schedule';

const ROLE_RANK: Record<ClubRole, number> = {
  owner: 5, admin: 4, manager: 3, trainer: 2, student: 1, parent: 1,
};

const CAPS: Record<ClubRole, ClubCap[]> = {
  owner: ['billing', 'deleteClub', 'manageRoles', 'manageMembers', 'manageSite', 'manageLeads', 'teach', 'schedule'],
  admin: ['manageRoles', 'manageMembers', 'manageSite', 'manageLeads', 'teach', 'schedule'],
  manager: ['manageMembers', 'manageLeads', 'manageSite', 'schedule'],
  trainer: ['teach', 'schedule'],
  student: [],
  parent: [],
};

/** Роли, доступные для назначения (owner назначается только передачей владения). */
export const ASSIGNABLE_ROLES: ClubRole[] = ['admin', 'manager', 'trainer', 'student', 'parent'];

/** Все роли, которые видит пользователь в UI как «штат клуба» (есть доступ к кабинету). */
export const STAFF_ROLES: ClubRole[] = ['owner', 'admin', 'manager', 'trainer'];

export const rankOf = (role: ClubRole | null | undefined): number => (role ? ROLE_RANK[role] ?? 0 : 0);

export const can = (role: ClubRole | null | undefined, cap: ClubCap): boolean =>
  !!(role && CAPS[role]?.includes(cap));

export const isStaff = (role: ClubRole | null | undefined): boolean =>
  !!role && STAFF_ROLES.includes(role);

/** Может ли actor управлять участником с ролью target (менять роль/удалять). */
export const canManageMember = (actor: ClubRole | null | undefined, target: ClubRole): boolean =>
  can(actor, 'manageMembers') && rankOf(actor) > rankOf(target);

/** Может ли actor назначить роль newRole. */
export const canAssignRole = (actor: ClubRole | null | undefined, newRole: ClubRole): boolean =>
  can(actor, 'manageRoles') && newRole !== 'owner' && rankOf(actor) > rankOf(newRole);

/** Человекочитаемые подписи ролей (ключи i18n задаются на экране). */
export const ROLE_LABEL: Record<ClubRole, string> = {
  owner: 'Owner', admin: 'Admin', manager: 'Manager', trainer: 'Trainer', student: 'Student', parent: 'Parent',
};
