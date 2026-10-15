import { apiClient } from './client';

type ApiEnvelope<T> = { success: boolean; data: T };

export type DashboardCount = { count: number };

export type DashboardStats = {
  totals: {
    members: number;
    approved: number;
    pending: number;
    this_month: number;
    tournament_registrations: number;
    registered_players: number;
    active_tournaments: number;
  };
  /** Last 12 months, oldest first; `month` is YYYY-MM. */
  monthlyRegistrations: (DashboardCount & { month: string })[];
  membersByVibhaag: (DashboardCount & { vibhaag: string })[];
  /** Latest 12 non-archived tournaments. */
  registrationsByTournament: (DashboardCount & { event_id: number; title: string; category_name: string | null })[];
  playersByVibhaag: (DashboardCount & { vibhaag: string })[];
  /** Every tournament, active ones first, latest first. */
  tournamentsByVibhaag: {
    event_id: number;
    title: string;
    category_name: string | null;
    is_archived: boolean;
    byVibhaag: (DashboardCount & { vibhaag: string })[];
  }[];
};

export const dashboardApi = {
  stats: () => apiClient.get<ApiEnvelope<DashboardStats>>('/dashboard/stats'),
};
