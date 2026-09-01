import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/endpoints/dashboard';

export const dashboardKeys = {
  summary: ['dashboard', 'summary'] as const,
  recentActivity: (limit: number) => ['dashboard', 'recent-activity', limit] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: async () => (await dashboardApi.getSummary()).data,
  });
}

export function useRecentActivity(limit = 6) {
  return useQuery({
    queryKey: dashboardKeys.recentActivity(limit),
    queryFn: async () => (await dashboardApi.getRecentActivity(limit)).data,
  });
}
