import { ExportedNodes } from '../../components/logic_designer/node_exporter';

export interface SceneMarker {
  id: string;
  name: string;
  imageUrl: string;
}

export type AiChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  appliedLogic?: boolean;
};

export interface SceneObjectState {
  objectName: string;
  objectType: string;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  hasGravity: boolean;
  isGrabbable: boolean;
  showDesc: boolean;
  markerId?: string;
}

export interface SceneState {
  name: string;
  index: number;
  description: string;
  sceneLogic?: ExportedNodes;
  markers?: SceneMarker[];
  aiChat?: AiChatMessage[];
}

export interface ExperimentState {
  name: string;
  title?: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
}
