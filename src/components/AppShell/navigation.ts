// Меню платформы: какие разделы видит пользователь в зависимости от роли.
// Должно совпадать с охраной роутов в App.tsx: PrivateRoute — нужен вход, RoleRoute — COACH/ADMIN.
// Роли с бэкенда — USER, COACH, ADMIN; ученик — это вошедший USER.

export type NavAudience = 'guest' | 'student' | 'coach';
export type NavIcon =
  | 'home' | 'about' | 'coaches' | 'achievements'
  | 'play' | 'books' | 'puzzles' | 'rating' | 'survival' | 'analysis' | 'database'
  | 'schedule' | 'inbox' | 'profile'
  | 'students' | 'review' | 'digitizer' | 'courseBuilder';

export interface NavItem {
  key: string;
  /** Ключ i18n подписи */
  labelKey: string;
  /** Подпись по умолчанию, если ключа нет в переводе */
  fallback: string;
  to: string;
  icon: NavIcon;
  /** Кому виден: guest — все, student — после входа, coach — COACH/ADMIN */
  audience: NavAudience;
  /** Активен ли пункт для текущего адреса (по умолчанию — совпадение пути или его префикс) */
  isActive?: (pathname: string, search: string, hash: string) => boolean;
}

export interface NavGroup {
  key: string;
  labelKey: string;
  fallback: string;
  items: NavItem[];
}

const startsWith = (prefix: string) => (pathname: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'training',
    labelKey: 'nav.groups.training',
    fallback: 'Training',
    items: [
      { key: 'play', labelKey: 'nav.play', fallback: 'Play online', to: '/play', icon: 'play', audience: 'student' },
      { key: 'books', labelKey: 'nav.books', fallback: 'Books & courses', to: '/books', icon: 'books', audience: 'student' },
      { key: 'puzzles', labelKey: 'nav.puzzles', fallback: 'Puzzles', to: '/puzzles', icon: 'puzzles', audience: 'guest' },
      { key: 'rating', labelKey: 'nav.rating', fallback: 'Rating climb', to: '/rating', icon: 'rating', audience: 'guest' },
      { key: 'survival', labelKey: 'nav.survival', fallback: 'Survival', to: '/survival', icon: 'survival', audience: 'guest' },
      { key: 'analysis', labelKey: 'nav.analysis', fallback: 'Analysis', to: '/analysis', icon: 'analysis', audience: 'guest' },
      { key: 'database', labelKey: 'nav.database', fallback: 'Games database', to: '/book', icon: 'database', audience: 'guest' },
    ],
  },
  {
    key: 'my',
    labelKey: 'nav.groups.my',
    fallback: 'My learning',
    items: [
      { key: 'schedule', labelKey: 'nav.schedule', fallback: 'Schedule & homework', to: '/students-shedule', icon: 'schedule', audience: 'student' },
      {
        key: 'inbox', labelKey: 'nav.inbox', fallback: 'Inbox', to: '/inbox', icon: 'inbox', audience: 'student',
        isActive: (pathname, search) => pathname === '/inbox' && !/[?&]tab=homework\b/.test(search),
      },
      { key: 'profile', labelKey: 'nav.profile', fallback: 'Profile', to: '/profile', icon: 'profile', audience: 'student', isActive: startsWith('/profile') },
    ],
  },
  {
    key: 'coach',
    labelKey: 'nav.groups.coach',
    fallback: 'Coaching',
    items: [
      { key: 'students', labelKey: 'nav.students', fallback: 'My students', to: '/students', icon: 'students', audience: 'coach' },
      {
        key: 'review', labelKey: 'nav.review', fallback: 'Review work', to: '/inbox?tab=homework', icon: 'review', audience: 'coach',
        isActive: (pathname, search) => pathname === '/inbox' && /[?&]tab=homework\b/.test(search),
      },
      {
        key: 'digitizer', labelKey: 'nav.digitizer', fallback: 'PDF digitizer', to: '/digitizer', icon: 'digitizer', audience: 'coach',
        isActive: (pathname, _search, hash) => pathname === '/digitizer' && hash !== '#library',
      },
      {
        // Редактор книги — /digitizer/books/:id/edit; список книг для редактирования — на странице оцифровщика
        key: 'courseBuilder', labelKey: 'nav.courseBuilder', fallback: 'Course builder', to: '/digitizer#library', icon: 'courseBuilder', audience: 'coach',
        isActive: (pathname, _search, hash) => pathname.startsWith('/digitizer/books/') || (pathname === '/digitizer' && hash === '#library'),
      },
    ],
  },
  {
    key: 'school',
    labelKey: 'nav.groups.school',
    fallback: 'School',
    items: [
      { key: 'home', labelKey: 'navbar.home', fallback: 'Home', to: '/', icon: 'home', audience: 'guest', isActive: (pathname) => pathname === '/' },
      { key: 'about', labelKey: 'navbar.aboutUs', fallback: 'About us', to: '/about', icon: 'about', audience: 'guest' },
      { key: 'coaches', labelKey: 'navbar.coaches', fallback: 'Coaches', to: '/coaches', icon: 'coaches', audience: 'guest' },
      { key: 'achievements', labelKey: 'navbar.achievements', fallback: 'Achievements', to: '/achievements', icon: 'achievements', audience: 'guest' },
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
  return result;
};

/** Группы меню с пунктами, доступными пользователю; пустые группы отброшены */
export const visibleNav = (user: NavUser | null | undefined, isAuthenticated: boolean): NavGroup[] => {
  const audiences = audiencesOf(user, isAuthenticated);
  return NAV_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((item) => audiences.has(item.audience)) }))
    .filter((group) => group.items.length > 0);
};

export const isItemActive = (item: NavItem, pathname: string, search = '', hash = ''): boolean => {
  if (item.isActive) return item.isActive(pathname, search, hash);
  const path = item.to.split(/[?#]/)[0];
  return path === '/' ? pathname === '/' : startsWith(path)(pathname);
};
