import { apiRequest } from './http/client';

export type SketchfabSearchResult = {
  uid: string;
  name: string;
  thumbnailUrl: string | null;
  viewerUrl: string;
  authorName: string | null;
};

export type SketchfabSearchResponse = {
  results: SketchfabSearchResult[];
  nextCursor: string | null;
};

export type SketchfabImportResponse = {
  publicUrl: string;
  path: string;
  objectName: string;
};

export async function searchSketchfabModels(q: string, cursor?: string) {
  const params = new URLSearchParams({ q });
  if (cursor) params.set('cursor', cursor);
  return apiRequest<SketchfabSearchResponse>(
    'GET',
    `/api/sketchfab/search?${params.toString()}`,
  );
}

export async function importSketchfabModel(modelUid: string, objectName: string) {
  return apiRequest<SketchfabImportResponse>('POST', '/api/sketchfab/import', {
    modelUid,
    objectName,
  });
}

export function sanitizeAssetName(raw: string) {
  return raw
    .trim()
    .replace(/\.glb$/i, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

export function sketchfabEmbedUrl(uid: string) {
  return `https://sketchfab.com/models/${encodeURIComponent(uid)}/embed?autostart=0&ui_controls=1&ui_infos=0`;
}
