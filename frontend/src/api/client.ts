import { useQuery, useQueries } from '@tanstack/react-query';
import type { IterationMetrics, IterationSummary, OdReading } from '@/types';

const BASE = '/api';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export function useIterations() {
  return useQuery({
    queryKey: ['iterations'],
    queryFn: () => fetchJson<IterationSummary[]>(`${BASE}/iterations`),
  });
}

export function useIteration(iterationId: string) {
  return useQuery({
    queryKey: ['iteration', iterationId],
    queryFn: () => fetchJson<IterationMetrics>(`${BASE}/iterations/${iterationId}`),
    enabled: !!iterationId,
  });
}

/** Fetch several iterations in parallel (e.g. Compare page). Order matches `iterationIds`. */
export function useIterationsBatch(iterationIds: string[]) {
  return useQueries({
    queries: iterationIds.map((id) => ({
      queryKey: ['iteration', id] as const,
      queryFn: () => fetchJson<IterationMetrics>(`${BASE}/iterations/${id}`),
      enabled: !!id,
    })),
  });
}

export function useWellTimeseries(iterationId: string, well: string | null) {
  return useQuery({
    queryKey: ['timeseries', iterationId, well],
    queryFn: () => fetchJson<OdReading[]>(`${BASE}/iterations/${iterationId}/wells/${well}/timeseries`),
    enabled: !!iterationId && !!well,
  });
}
