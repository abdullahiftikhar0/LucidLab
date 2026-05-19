import { apiRequest } from './http/client';
import { ExportedNodes } from '../components/logic_designer/node_exporter';

export type AiAssistantChatResponse =
  | { type: 'chat'; message: string; model?: string }
  | { type: 'logic'; message: string; sceneLogic: ExportedNodes; model?: string };

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

export async function sendAiAssistantMessage(payload: {
  messages: { role: 'user' | 'assistant'; content: string }[];
  currentSceneLogic?: unknown;
  objects: { objectName: string; objectType: string }[];
}) {
  return apiRequest<AiAssistantChatResponse>('POST', '/api/ai/assistant', payload);
}
