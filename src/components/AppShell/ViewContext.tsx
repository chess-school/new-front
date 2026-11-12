import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { NavMode, NavUser } from './navigation';

/**
 * Эффективный «вид» интерфейса: режим сайдбара (learn/coach) + админская симуляция роли.
 * ТОЛЬКО отрисовка/навигация — права на сервере реальные (роут-гарды сперва проверяют настоящую роль).
 * Поднят в контекст, чтобы и сайдбар, и RoleRoute, и кнопки на страницах судили об одном «виде».
 */
export type RoleView = 'real' | 'admin' | 'coach' | 'student' | 'guest';
export type EffRole = 'admin' | 'coach' | 'student' | 'guest';

interface ViewValue {
  mode: NavMode;                 // эффективный режим (coach принудительно → learn, если роль не coach)
  setMode: (m: NavMode) => void;
  roleView: RoleView;
  setRoleView: (r: RoleView) => void;
  realIsAdmin: boolean;          // настоящий ADMIN — только ему доступен селектор ролей
  coachCapable: boolean;         // эффективная роль умеет вести (для тумблера)
  effUser: NavUser | null;       // для visibleNav
  effAuth: boolean;
  effRole: EffRole;
  canViewCoach: boolean;         // показывать coach-UI (кнопки/роуты): coach-роль И режим coach
  canViewAdmin: boolean;         // показывать admin-UI
  isSimulating: boolean;         // ADMIN смотрит как другая роль
}

const ViewContext = createContext<ViewValue | null>(null);

export const useView = (): ViewValue => {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error('useView must be used within ViewProvider');
  return ctx;
};

export const ViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const realRoles = (user?.roles ?? []).map((r) => String(r).toUpperCase());
  const realIsAdmin = realRoles.includes('ADMIN');

  const [mode, setModeState] = useState<NavMode>(() => {
    try { const s = localStorage.getItem('debiut.navMode'); if (s === 'coach' || s === 'learn') return s; } catch { /* ignore */ }
    return 'coach';
  });
  const [roleView, setRoleViewState] = useState<RoleView>(() => {
    try { return realIsAdmin ? ((localStorage.getItem('debiut.roleView') as RoleView) || 'real') : 'real'; } catch { return 'real'; }
  });
  const setMode = (m: NavMode) => { setModeState(m); try { localStorage.setItem('debiut.navMode', m); } catch { /* ignore */ } };
  const setRoleView = (r: RoleView) => { setRoleViewState(r); try { localStorage.setItem('debiut.roleView', r); } catch { /* ignore */ } };

  const isSimulating = realIsAdmin && roleView !== 'real';
  const effUser: NavUser | null = !isSimulating
    ? (user as NavUser | null)
    : roleView === 'guest' ? null : { roles: [roleView === 'student' ? 'USER' : roleView === 'coach' ? 'COACH' : 'ADMIN'] };
  const effAuth = isSimulating ? roleView !== 'guest' : isAuthenticated;

  const effRoles = (effUser?.roles ?? []).map((r) => String(r).toUpperCase());
  const effRole: EffRole = !effAuth ? 'guest'
    : effRoles.includes('ADMIN') ? 'admin'
      : effRoles.includes('COACH') ? 'coach'
        : 'student';

  const coachCapable = effRole === 'admin' || effRole === 'coach';
  // effMode — ПРОИЗВОДНЫЙ (не coach-роль → learn). НЕ мутируем сохранённый mode: при загрузке auth
  // user ещё null → coachCapable false, и клампящий setState навсегда сбивал бы выбор coach на learn.
  const effMode: NavMode = coachCapable ? mode : 'learn';

  const value: ViewValue = {
    mode: effMode, setMode, roleView, setRoleView, realIsAdmin, coachCapable,
    effUser, effAuth, effRole,
    canViewCoach: coachCapable && effMode === 'coach',
    canViewAdmin: effRole === 'admin' && effMode === 'coach',
    isSimulating,
  };
  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
};
