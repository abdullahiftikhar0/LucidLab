import { apiRequest } from './http/client';

type Ref = { path: string };
type WhereClause = { field: string; op?: string; value: unknown };
type QueryRef = { path: string; where: WhereClause[] };
type Op = { __op: 'arrayUnion' | 'arrayRemove' | 'increment' | 'serverTimestamp'; values?: unknown[]; value?: number };

function isOp(value: unknown): value is Op {
  return typeof value === 'object' && value !== null && '__op' in (value as Record<string, unknown>);
}

function normalizeSegments(segments: unknown[]): string[] {
  return segments.filter((segment) => typeof segment === 'string' && segment.length > 0) as string[];
}

export function doc(...segments: unknown[]): Ref {
  return { path: normalizeSegments(segments).join('/') };
}

export function collection(...segments: unknown[]): Ref {
  return { path: normalizeSegments(segments).join('/') };
}

export function where(field: string, op: string, value: unknown): WhereClause {
  return { field, op, value };
}

export function query(ref: Ref, ...clauses: WhereClause[]): QueryRef {
  return { path: ref.path, where: clauses };
}

function toDocSnap(item: any) {
  return {
    id: item?.id,
    exists: () => Boolean(item),
    data: () => item,
  };
}

export async function getDoc(ref: Ref) {
  const response = await apiRequest<{ exists: boolean; item: any }>('POST', '/api/firestore/get-doc', {
    path: ref.path,
  });
  return toDocSnap(response.item);
}

export async function getDocs(refOrQuery: Ref | QueryRef) {
  const collectionPath = refOrQuery.path;
  const where = 'where' in refOrQuery ? refOrQuery.where : [];
  const response = await apiRequest<{ items: any[] }>('POST', '/api/firestore/query', {
    collectionPath,
    where,
  });
  const docs = (response.items ?? []).map((item) => ({
    id: item.id,
    data: () => item,
    exists: () => true,
  }));
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: (cb: (doc: { id: any; data: () => any; exists: () => true }) => void) => {
      docs.forEach(cb);
    },
  };
}

function normalizeOps(data: Record<string, unknown>, existing: Record<string, unknown>) {
  const next: Record<string, unknown> = { ...existing };
  for (const [key, value] of Object.entries(data || {})) {
    if (!isOp(value)) {
      next[key] = value;
      continue;
    }
    if (value.__op === 'serverTimestamp') {
      next[key] = new Date().toISOString();
    } else if (value.__op === 'increment') {
      const base = Number(next[key] ?? 0);
      next[key] = base + Number(value.value ?? 0);
    } else if (value.__op === 'arrayUnion') {
      const current = Array.isArray(next[key]) ? [...next[key] as unknown[]] : [];
      for (const item of value.values ?? []) {
        if (!current.includes(item)) current.push(item);
      }
      next[key] = current;
    } else if (value.__op === 'arrayRemove') {
      const current = Array.isArray(next[key]) ? [...next[key] as unknown[]] : [];
      next[key] = current.filter((item) => !(value.values ?? []).includes(item));
    }
  }
  return next;
}

export async function setDoc(ref: Ref, data: Record<string, unknown>, options?: { merge?: boolean }) {
  await apiRequest('POST', '/api/firestore/doc', {
    path: ref.path,
    data,
    merge: Boolean(options?.merge),
  });
}

export async function updateDoc(ref: Ref, data: Record<string, unknown>) {
  const current = await getDoc(ref);
  const existing = current.exists() ? current.data() : {};
  const merged = normalizeOps(data, existing || {});
  await apiRequest('POST', '/api/firestore/doc', {
    path: ref.path,
    data: merged,
    merge: true,
  });
}

export async function deleteDoc(ref: Ref) {
  await apiRequest('DELETE', '/api/firestore/doc', { path: ref.path });
}

export async function addDoc(ref: Ref, data: Record<string, unknown>) {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  const fullPath = `${ref.path}/${id}`;
  await apiRequest('POST', '/api/firestore/doc', {
    path: fullPath,
    data,
    merge: false,
  });
  return { id, path: fullPath };
}

export function serverTimestamp(): Op {
  return { __op: 'serverTimestamp' };
}

export function arrayUnion(...values: unknown[]): Op {
  return { __op: 'arrayUnion', values };
}

export function arrayRemove(...values: unknown[]): Op {
  return { __op: 'arrayRemove', values };
}

export function increment(value: number): Op {
  return { __op: 'increment', value };
}
