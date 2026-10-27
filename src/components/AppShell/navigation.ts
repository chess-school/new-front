// Меню платформы: какие разделы видит пользователь в зависимости от роли.
// Должно совпадать с охраной роутов в App.tsx: PrivateRoute — нужен вход, RoleRoute — COACH/ADMIN.
// Роли с бэкенда — USER, COACH, ADMIN; ученик — это вошедший USER.

export type NavAudience = 'guest' | 'student' | 'coach' | 'admin';
export type NavIcon =
  | 'home' | 'about' | 'coaches' | 'achievements'
  | 'play' | 'books' | 'puzzles' | 'rating' | 'survival' | 'blindfold' | 'analysis' | 'database'
  | 'schedule' | 'classroom' | 'inbox' | 'profile' | 'games'
  | 'students' | 'groups' | 'review' | 'digitizer' | 'courseBuilder' | 'console' | 'coachApps' | 'public' | 'settings';

/** Режим сайдбара: ученический (learn) или преподавательский (coach) — переключается тумблером */
export type NavMode = 'learn' | 'coach';

export interface NavItem {
  key: string;
  /** Ключ i18n подписи */
  labelKey: string;
  /** Подпись по умолчанию, если ключа нет в переводе */
  fallback: string;
  to: string;
  icon: NavIcon;
  /** Кому виден: guest — все, student — после входа, coach — COACH/ADMIN, admin — только ADMIN */
  audience: NavAudience;
  /** Активен ли пункт для текущего адреса (по умолчанию — совпадение пути или его префикс) */
  isActive?: (pathname: string, search: string, hash: string) => boolean;
  /** Внешняя ссылка — открывается в новой вкладке, со значком ↗ */
  external?: boolean;
  /** Ключ счётчика-бейджа (количество подтягивается из данных; пока опционально) */
  badge?: string;
}

export interface NavGroup {
  key: string;
  labelKey: string;
  fallback: string;
  items: NavItem[];
  /** Режим, в котором видна группа. Без mode — видна всегда. */
  mode?: NavMode;
}

const startsWith = (prefix: string) => (pathname: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const NAV_GROUPS: NavGroup[] = [
  // ─────────────── Режим LEARN (ученик) ───────────────
  {
    key: 'training',
    labelKey: 'nav.groups.training',
    fallback: 'Training',
    mode: 'learn',
    items: [
      { key: 'play', labelKey: 'nav.play', fallback: 'Play online', to: '/play', icon: 'play', audience: 'student' },
      { key: 'books', labelKey: 'nav.books', fallback: 'Books & courses', to: '/books', icon: 'books', audience: 'student' },
      { key: 'puzzles', labelKey: 'nav.puzzles', fallback: 'Puzzles', to: '/puzzles', icon: 'puzzles', audience: 'guest' },
      { key: 'rating', labelKey: 'nav.rating', fallback: 'Rating climb', to: '/rating', icon: 'rating', audience: 'guest' },
      { key: 'survival', labelKey: 'nav.survival', fallback: 'Survival', to: '/survival', icon: 'survival', audience: 'guest' },
      { key: 'blindfold', labelKey: 'nav.blindfold', fallback: 'Blindfold memory', to: '/blindfold', icon: 'blindfold', audience: 'guest' },
      { key: 'analysis', labelKey: 'nav.analysis', fallback: 'Analysis', to: '/analysis', icon: 'analysis', audience: 'guest' },
      { key: 'database', labelKey: 'nav.database', fallback: 'Games database', to: '/book', icon: 'database', audience: 'guest' },
    ],
  },
  {
    key: 'my',
    labelKey: 'nav.groups.my',
    fallback: 'My learning',
    mode: 'learn',
    items: [
      { key: 'myClasses', labelKey: 'nav.myClasses', fallback: 'My classes', to: '/my-classes', icon: 'classroom', audience: 'student', isActive: startsWith('/my-classes') },
      { key: 'schedule', labelKey: 'nav.schedule', fallback: 'Schedule & homework', to: '/students-shedule', icon: 'schedule', audience: 'student' },
      { key: 'myGames', labelKey: 'nav.myGames', fallback: 'My games', to: '/my-games', icon: 'games', audience: 'student' },
      {
        key: 'inbox', labelKey: 'nav.inbox', fallback: 'Inbox', to: '/inbox', icon: 'inbox', audience: 'student',
        isActive: (pathname, search) => pathname === '/inbox' && !/[?&]tab=homework\b/.test(search),
      },
      { key: 'profile', labelKey: 'nav.profile', fallback: 'Profile', to: '/profile', icon: 'profile', audience: 'student', isActive: startsWith('/profile') },
    ],
  },
  {
    key: 'school',
    labelKey: 'nav.groups.school',
    fallback: 'School',
    mode: 'learn',
    items: [
      { key: 'home', labelKey: 'navbar.home', fallback: 'Home', to: '/', icon: 'home', audience: 'guest', isActive: (pathname) => pathname === '/' },
      { key: 'about', labelKey: 'navbar.aboutUs', fallback: 'About us', to: '/about', icon: 'about', audience: 'guest' },
      { key: 'coaches', labelKey: 'navbar.coaches', fallback: 'Coaches', to: '/coaches', icon: 'coaches', audience: 'guest' },
      { key: 'achievements', labelKey: 'navbar.achievements', fallback: 'Achievements', to: '/achievements', icon: 'achievements', audience: 'guest' },
    ],
  },
  // ─────────────── Режим COACH (тренер/админ) ───────────────
  {
    key: 'consoleTop',
    labelKey: '', fallback: '', // без заголовка секции — отдельный верхний пункт
    mode: 'coach',
    items: [
      { key: 'clubConsole', labelKey: 'nav.clubConsole', fallback: 'Club console', to: '/club', icon: 'console', audience: 'coach', isActive: (pathname) => pathname === '/club' },
    ],
  },
  {
    key: 'people',
    labelKey: 'nav.groups.people',
    fallback: 'People',
    mode: 'coach',
    items: [
      { key: 'students', labelKey: 'nav.students', fallback: 'Students', to: '/students', icon: 'students', audience: 'coach' },
      { key: 'groups', labelKey: 'nav.groups.list', fallback: 'Groups', to: '/groups', icon: 'groups', audience: 'coach', isActive: startsWith('/groups') },
      { key: 'coachApplications', labelKey: 'nav.coachApplications', fallback: 'Coach applications', to: '/coach-applications', icon: 'coachApps', audience: 'admin', badge: 'coachApplications' },
    ],
  },
  {
    key: 'teaching',
    labelKey: 'nav.groups.teaching',
    fallback: 'Teaching',
    mode: 'coach',
    items: [
      {
        key: 'review', labelKey: 'nav.review', fallback: 'Review work', to: '/inbox?tab=homework', icon: 'review', audience: 'coach', badge: 'review',
        isActive: (pathname, search) => pathname === '/inbox' && /[?&]tab=homework\b/.test(search),
      },
      {
        // Редактор книги — /digitizer/books/:id/edit; список книг для редактирования — на странице оцифровщика
        key: 'courseBuilder', labelKey: 'nav.courseBuilder', fallback: 'Course builder', to: '/digitizer#library', icon: 'courseBuilder', audience: 'coach',
        isActive: (pathname, _search, hash) => pathname.startsWith('/digitizer/books/') || (pathname === '/digitizer' && hash === '#library'),
      },
      {
        key: 'digitizer', labelKey: 'nav.digitizer', fallback: 'PDF digitizer', to: '/digitizer', icon: 'digitizer', audience: 'coach',
        isActive: (pathname, _search, hash) => pathname === '/digitizer' && hash !== '#library',
      },
    ],
  },
  {
    key: 'club',
    labelKey: 'nav.groups.club',
    fallback: 'Club',
    mode: 'coach',
    items: [
      { key: 'clubSettings', labelKey: 'nav.clubSettings', fallback: 'Club settings', to: '/club/settings', icon: 'settings', audience: 'coach', isActive: startsWith('/club/settings') },
      { key: 'publicClub', labelKey: 'nav.publicClub', fallback: 'Public club page', to: '/', icon: 'public', audience: 'coach', external: true },
    ],
  },
];

export interface NavUser {
  roles?: string[];
}

/** Аудитории, доступные пользователю: гость < ученик < тренер/админ */
export const audiencesOf = (user: NavUser | null | undefined, isAuthenticated: boolean): Set<NavAudience> => {
  const result = new Set<NavAudience>(['guest']);
  if (!isAuthenticated || !user) return result;
  result.add('student');
  const roles = (user.roles ?? []).map((r) => r.toUpperCase());
  if (roles.includes('COACH') || roles.includes('ADMIN')) result.add('coach');
  if (roles.includes('ADMIN')) result.add('admin');
  return result;
};

/** Может ли пользователь вести (видит режим Coach) */
export const canCoach = (user: NavUser | null | undefined, isAuthenticated: boolean): boolean =>
  audiencesOf(user, isAuthenticated).has('coach');

/** Группы меню, доступные пользователю в выбранном режиме; пустые группы отброшены.
 *  mode не задан — вернуть все группы (обратная совместимость). */
export const visibleNav = (user: NavUser | null | undefined, isAuthenticated: boolean, mode?: NavMode): NavGroup[] => {
  const audiences = audiencesOf(user, isAuthenticated);
  return NAV_GROUPS
    .filter((group) => !mode || !group.mode || group.mode === mode)
    .map((group) => ({ ...group, items: group.items.filter((item) => audiences.has(item.audience)) }))
    .filter((group) => group.items.length > 0);
};

export const isItemActive = (item: NavItem, pathname: string, search = '', hash = ''): boolean => {
  if (item.isActive) return item.isActive(pathname, search, hash);
  const path = item.to.split(/[?#]/)[0];
  return path === '/' ? pathname === '/' : startsWith(path)(pathname);
};
