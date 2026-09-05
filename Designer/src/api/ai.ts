import { apiRequest } from './http/client';

export async function generateSceneLogic(payload: {
  prompt: string;
  currentSceneLogic?: unknown;
  objects: { objectName: string; objectType: string }[];
}) {
  return apiRequest<{ sceneLogic: any; model?: string }>(
    'POST',
    '/api/ai/scene-logic',
    payload,
  );
}
