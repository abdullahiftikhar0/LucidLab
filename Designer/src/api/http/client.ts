import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

function getApiBaseUrl() {
  const rawBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();
  if (!rawBaseUrl) {
    return '';
  }
  return rawBaseUrl.replace(/\/$/, '');
}

function resolveApiPath(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function buildHeaders(extra?: Record<string, string>) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra ?? {}),
  };
  const app = getApp();
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(resolveApiPath(path), {
    method,
    headers: await buildHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}
