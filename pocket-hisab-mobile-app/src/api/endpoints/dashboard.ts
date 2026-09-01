import { apiClient } from '../client';
import type { DashboardSummary, RecentActivityItem } from '../../types/api';

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
  getRecentActivity: (limit = 10) =>
    apiClient.get<RecentActivityItem[]>('/dashboard/recent-activity', { limit }),
};
