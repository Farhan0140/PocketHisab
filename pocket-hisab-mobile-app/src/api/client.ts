/**
 * A single fetch wrapper every API call in the app goes through. Handles:
 *   - Building the full URL against env.apiBaseUrl
 *   - Attaching `Authorization: Bearer <idToken>` from the signed-in
 *     Firebase user (getIdToken() auto-refreshes the token if it's close to
 *     expiring — we never manage refresh manually)
 *   - Unwrapping the backend's { success, data, error, meta } envelope
 *   - Throwing a typed ApiError on failure, so callers/react-query can
 *     branch on `.status` (e.g. 401 -> sign the user out)
 */

import { auth } from '../auth/firebase';
import { env } from '../config/env';
import type { ApiEnvelope, PaginationMeta } from '../types/api';

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface ApiResult<T> {
  data: T;
  meta: PaginationMeta | Record<string, unknown> | null;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(env.apiBaseUrl.replace(/\/$/, '') + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Fetches a fresh (auto-refreshed-if-needed) Firebase ID token for the signed-in user, or null. */
async function getAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const authHeader = await getAuthHeader();

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // A thrown fetch (not an HTTP error status) means no network reached the
    // server at all — surface a consistent message rather than the raw
    // platform-specific TypeError text.
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }

  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !json || !json.success) {
    const message = json?.error?.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, json?.error?.details);
  }

  return { data: json.data, meta: json.meta as PaginationMeta | Record<string, unknown> | null };
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
