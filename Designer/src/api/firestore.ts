import { apiRequest } from './http/client';

export async function queryCollection<T>(args: {
  collection: string;
  where?: { field: string; op?: string; value: unknown }[];
  orderBy?: { field: string; direction?: 'asc' | 'desc' };
  limit?: number;
}) {
  return apiRequest<{ items: T[] }>('POST', '/api/firestore/query', args);
}

export async function setDocument<T>(path: string, data: Partial<T>, merge = true) {
  return apiRequest<{ item: T }>('POST', '/api/firestore/doc', { path, data, merge });
}

export async function patchDocument<T>(path: string, data: Partial<T>) {
  return apiRequest<{ item: T }>('PATCH', '/api/firestore/doc', { path, data });
}

export async function deleteDocument(path: string) {
  return apiRequest<{ ok: boolean }>('DELETE', '/api/firestore/doc', { path });
}
