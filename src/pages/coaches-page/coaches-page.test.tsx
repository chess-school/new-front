import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AuthContext } from '@/context/AuthContext';
import type { CoachDto } from '@/api/coaches';

vi.mock('@/api/coaches', () => ({
  getCoaches: vi.fn(),
  getSentCoachRequests: vi.fn(),
  sendCoachRequest: vi.fn(),
  getMyCoachProfile: vi.fn(),
  updateMyCoachProfile: vi.fn(),
}));
import * as api from '@/api/coaches';
import { CoachesPage } from './coaches-page';

const coach = (id: string, firstName: string, extra: Partial<CoachDto> = {}): CoachDto => ({
  _id: id,
  user: { _id: `u-${id}`, uuid: `uuid-${id}`, firstName, lastName: 'Coach', avatarUrl: null },
  headline: `${firstName} headline`,
  bio: `${firstName} bio`,
  specializations: ['Endgames', 'Tactics'],
  fideProfile: { title: 'IM', rating: { standard: 2450 } },
  platformRating: { average: 4.8, count: 12 },
  ...extra,
});
const page = (data: CoachDto[], totalPages = 1, currentPage = 1) => ({ data, pagination: { currentPage, totalPages, totalCoaches: data.length } });

const renderPage = (user: { _id: string; roles: string[] } | null) => render(
  <AuthContext.Provider value={{
    user: user ? { ...user, uuid: 'me', firstName: 'Me', lastName: 'User', email: 'me@x', createdAt: '' } as never : null,
    loading: false, isAuthenticated: !!user, login: async () => ({} as never), logout: () => {}, refetchUser: async () => {},
  }}>
    <MemoryRouter><CoachesPage /></MemoryRouter>
  </AuthContext.Provider>,
);

beforeAll(async () => {
  await i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { translation: {} } }, interpolation: { escapeValue: false } });
});
beforeEach(() => {
  vi.mocked(api.getSentCoachRequests).mockResolvedValue([]);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('страница «Тренеры»', () => {
  it('регрессия: ответ { data, pagination } рисуется карточками (раньше — падение coaches.filter)', async () => {
    vi.mocked(api.getCoaches).mockResolvedValue(page([coach('a', 'Anna'), coach('b', 'Boris', { fideProfile: null, platformRating: { average: 0, count: 0 } })]));
    renderPage(null);
    const cards = await screen.findAllByTestId('coach-card');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('IM')).toBeTruthy();
    expect(within(cards[0]).getByText(/FIDE 2450/)).toBeTruthy();
    expect(within(cards[1]).queryByText(/FIDE/)).toBeNull(); // без рейтинга — без строки рейтинга
    expect(api.getSentCoachRequests).not.toHaveBeenCalled(); // гость — без своих заявок
  });

  it('поиск — на сервере с задержкой; «Показать ещё» дозагружает страницу', async () => {
    vi.mocked(api.getCoaches)
      .mockResolvedValueOnce(page([coach('a', 'Anna')], 2, 1))
      .mockResolvedValueOnce(page([coach('b', 'Boris')], 2, 2))
      .mockResolvedValue(page([coach('b', 'Boris')]));
    renderPage(null);
    await screen.findByText('Anna Coach');
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    await screen.findByText('Boris Coach');
    expect(screen.getAllByTestId('coach-card')).toHaveLength(2);
    expect(api.getCoaches).toHaveBeenLastCalledWith({ page: 2, limit: 12, q: '' });

    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), { target: { value: 'bor' } });
    await waitFor(() => expect(api.getCoaches).toHaveBeenLastCalledWith({ page: 1, limit: 12, q: 'bor' }));
    await waitFor(() => expect(screen.getAllByTestId('coach-card')).toHaveLength(1));
  });

  it('ошибка загрузки — сообщение и «Повторить»', async () => {
    vi.mocked(api.getCoaches).mockRejectedValueOnce(new Error('down')).mockResolvedValue(page([coach('a', 'Anna')]));
    renderPage(null);
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Anna Coach')).toBeTruthy();
  });

  it('гость: в профиле — предложение войти вместо формы', async () => {
    vi.mocked(api.getCoaches).mockResolvedValue(page([coach('a', 'Anna')]));
    renderPage(null);
    fireEvent.click(await screen.findByText('Anna Coach'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Log in to send a request/)).toBeTruthy();
    expect(within(dialog).queryByRole('button', { name: 'coaches.sendRequest' })).toBeNull();
  });

  it('ученик: заявка уходит с уровнем и целями; карточка показывает «отправлена»; ошибка сервера — понятным текстом', async () => {
    vi.mocked(api.getCoaches).mockResolvedValue(page([coach('a', 'Anna'), coach('b', 'Boris')]));
    vi.mocked(api.sendCoachRequest).mockResolvedValueOnce({} as never);
    renderPage({ _id: 'student', roles: ['USER'] });
    fireEvent.click(await screen.findByText('Anna Coach'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'coaches.goals' }), { target: { value: '  2000 by summer ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'coaches.sendRequest' }));
    await within(dialog).findByText(/Request sent/);
    expect(api.sendCoachRequest).toHaveBeenCalledWith('a', { experience: 'Intermediate', goals: '2000 by summer' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'coaches.close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(within(screen.getAllByTestId('coach-card')[0]).getByText(/Request sent/)).toBeTruthy();

    vi.mocked(api.sendCoachRequest).mockRejectedValueOnce({ response: { data: { code: 'ALREADY_STUDENT' } } });
    fireEvent.click(screen.getByText('Boris Coach'));
    const second = await screen.findByRole('dialog');
    fireEvent.click(within(second).getByRole('button', { name: 'coaches.sendRequest' }));
    expect(await within(second).findByText('coachesPage.errors.alreadyStudent')).toBeTruthy();
  });

  it('статусы моих заявок: последняя по тренеру; после отказа — снова «Подробнее»; своя карточка — «это вы»', async () => {
    vi.mocked(api.getCoaches).mockResolvedValue(page([coach('a', 'Anna'), coach('b', 'Boris'), coach('me', 'Self', { user: { _id: 'coach-me', uuid: 'x', firstName: 'Self', lastName: 'Coach' } })]));
    vi.mocked(api.getSentCoachRequests).mockResolvedValue([
      { _id: 'r3', status: 'rejected', coach: { _id: 'b', user: {} }, createdAt: '2026-10-03' },
      { _id: 'r2', status: 'approved', coach: { _id: 'a', user: {} }, createdAt: '2026-10-02' },
      { _id: 'r1', status: 'pending', coach: { _id: 'b', user: {} }, createdAt: '2026-10-01' },
    ] as never);
    renderPage({ _id: 'coach-me', roles: ['USER', 'COACH'] });
    const cards = await screen.findAllByTestId('coach-card');
    await waitFor(() => expect(within(cards[0]).getByText('Your coach')).toBeTruthy());
    expect(within(cards[1]).getByRole('button', { name: 'coaches.viewProfile' })).toBeTruthy();
    expect(within(cards[2]).getByText('This is your profile')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'My coach profile' })).toBeTruthy();
  });
});
