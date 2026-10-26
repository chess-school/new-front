import { create } from 'zustand';
import { fetchMyClubs, MyClubEntry } from './clubsApi';

const STORAGE = 'debiut.activeClub';

const readActive = (): string | null => {
  try { return localStorage.getItem(STORAGE); } catch { return null; }
};
const writeActive = (id: string | null) => {
  try { if (id) localStorage.setItem(STORAGE, id); else localStorage.removeItem(STORAGE); } catch { /* ignore */ }
};

interface ClubState {
  clubs: MyClubEntry[];
  activeClubId: string | null;
  loaded: boolean;
  loading: boolean;
  load: (force?: boolean) => Promise<void>;
  setActive: (id: string) => void;
  activeEntry: () => MyClubEntry | null;
  reset: () => void;
}

/** Состояние активного клуба (мульти-арендность). activeClubId синхронизирован с localStorage,
 *  откуда axios берёт заголовок X-Club-Id. Смена клуба перезагружает страницу, чтобы данные
 *  перезапросились уже в контексте нового клуба. */
export const useClubStore = create<ClubState>((set, get) => ({
  clubs: [],
  activeClubId: readActive(),
  loaded: false,
  loading: false,
  load: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;
    set({ loading: true });
    try {
      const clubs = await fetchMyClubs();
      let activeClubId = get().activeClubId;
      if (!activeClubId || !clubs.some((c) => c.club._id === activeClubId)) {
        activeClubId = clubs[0]?.club._id ?? null;
        writeActive(activeClubId);
      }
      set({ clubs, activeClubId, loaded: true, loading: false });
    } catch {
      set({ loaded: true, loading: false });
    }
  },
  setActive: (id) => {
    if (id === get().activeClubId) return;
    writeActive(id);
    set({ activeClubId: id });
    // Перезапрашиваем всё приложение в контексте нового клуба
    try { window.location.reload(); } catch { /* ignore */ }
  },
  activeEntry: () => {
    const s = get();
    return s.clubs.find((c) => c.club._id === s.activeClubId) ?? null;
  },
  reset: () => {
    writeActive(null);
    set({ clubs: [], activeClubId: null, loaded: false, loading: false });
  },
}));
