import type { ExportedNodes } from '../components/logic_designer/node_exporter';

/** Key-value pair for JsonUtility-compatible payload */
export type KeyVal = { key: string; value: string };

export type InputFromEntry = { key: string; nodeId: string; outputName: string };

export type NodeEntry = {
  id: string;
  name: string;
  controls: KeyVal[];
  execOutputs: KeyVal[];
  inputValues: KeyVal[];
  inputsFrom: InputFromEntry[];
};

export type SceneLogicPayload = { nodes: NodeEntry[] };

function toKeyVal(obj: Record<string, string> | undefined): KeyVal[] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([key, value]) => ({ key, value: String(value ?? '') }));
}

function toInputFrom(obj: Record<string, { nodeId: string; outputName: string }> | undefined): InputFromEntry[] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([key, v]) => ({
    key,
    nodeId: v?.nodeId ?? '',
    outputName: v?.outputName ?? '',
  }));
}

/** Build payload for Unity JsonUtility (array of nodes, no root Dictionary). */
export function buildSceneLogicPayload(sceneLogic: ExportedNodes): SceneLogicPayload {
  const nodes: NodeEntry[] = [];
  for (const [id, node] of Object.entries(sceneLogic)) {
    nodes.push({
      id,
      name: node.name ?? '',
      controls: toKeyVal(node.controls),
      execOutputs: toKeyVal(node.execOutputs),
      inputValues: toKeyVal(node.inputValues),
      inputsFrom: toInputFrom(node.inputsFrom),
    });
  }
  return { nodes };
}
