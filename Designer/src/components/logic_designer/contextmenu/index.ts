import { NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { ContextMenuPlugin } from 'rete-context-menu-plugin';
import { Schemes, AreaExtra, BaseNode } from '../base_types';
import { Item } from 'rete-context-menu-plugin/_types/types';
import {
  ApplyForceOnObjectNode,
  CompareNode,
  EvalNode,
  EvalStringNode,
  GetTimeSinceLastLoopNode,
  GetElapsedTimeNode,
  GetPositionNode,
  GetRotationNode,
  GetScaleNode,
  GetSpeedNode,
  GetVariableNode,
  GotoSceneNode,
  SceneLoadNode,
  SceneLoopNode,
  SetBouncinessNode,
  SetDynamicFrictionNode,
  SetMassNode,
  SetObjectDescriptionNode,
  SetPositionNode,
  SetRotationNode,
  SetScaleNode,
  SetStaticFrictionNode,
  SetVariableNode,
  SetVisibleNode,
  ShowMessageNode,
  SetColorNode,
  GetDistanceBetweenNode,
  SetColorRGBNode,
} from '../nodes';
import { setSelectedConnectionId } from '../connection_selection';

type ContextTarget = {
  kind: 'connection' | 'node';
  id: string;
};

function resolveContextTarget(
  context: unknown,
  editor: NodeEditor<Schemes>,
): ContextTarget | null {
  if (typeof context !== 'object' || context === null || !('id' in context)) {
    return null;
  }

  const id = String((context as { id: unknown }).id);
  if (!id) return null;

  const isConnection = editor.getConnections().some(c => c.id === id);
  if (isConnection) {
    return { kind: 'connection', id };
  }

  const isNode = !!editor.getNode(id);
  if (isNode) {
    return { kind: 'node', id };
  }

  return null;
}

export const contextMenu = new ContextMenuPlugin<Schemes>({
  items: function (context, plugin) {
    const area = plugin.parentScope<AreaPlugin<Schemes, AreaExtra>>(AreaPlugin);
    const editor = area.parentScope<NodeEditor<Schemes>>(NodeEditor);

    function CreateItemFromNode(node: BaseNode) {
      return {
        label: node.label,
        key: node.label,
        handler: async () => {
          await editor.addNode(node);
          const pointer = area.area.pointer;
          area.nodeViews.get(node.id)?.translate(pointer.x, pointer.y);
        },
      };
    }

    if (context === 'root') {
      return {
        searchBar: true,
        list: [
          CreateItemFromNode(new SceneLoadNode()),
          CreateItemFromNode(new SceneLoopNode()),
          CreateItemFromNode(new GotoSceneNode()),
          {
            label: 'Get Properties',
            key: 'getproperties',
            handler: () => {},
            subitems: [
              CreateItemFromNode(new GetPositionNode()),
              CreateItemFromNode(new GetRotationNode()),
              CreateItemFromNode(new GetScaleNode()),
              CreateItemFromNode(new GetSpeedNode()),
            ],
          },
          {
            label: 'Set Properties',
            key: 'setproperties',
            handler: () => {},
            subitems: [
              CreateItemFromNode(new SetPositionNode()),
              CreateItemFromNode(new SetRotationNode()),
              CreateItemFromNode(new SetScaleNode()),
              CreateItemFromNode(new SetBouncinessNode()),
              CreateItemFromNode(new SetStaticFrictionNode()),
              CreateItemFromNode(new SetDynamicFrictionNode()),
              CreateItemFromNode(new SetMassNode()),
              CreateItemFromNode(new SetColorNode()),
              CreateItemFromNode(new SetColorRGBNode()),
            ],
          },
          {
            label: 'UI',
            key: 'ui',
            handler: () => {},
            subitems: [
              CreateItemFromNode(new ShowMessageNode()),
              CreateItemFromNode(new SetObjectDescriptionNode()),
            ],
          },
          {
            label: 'Flow Control',
            key: 'flowcontrol',
            handler: () => {},
            subitems: [
              CreateItemFromNode(new EvalNode()),
              CreateItemFromNode(new EvalStringNode()),
              CreateItemFromNode(new CompareNode()),
              CreateItemFromNode(new GetElapsedTimeNode()),
              CreateItemFromNode(new GetTimeSinceLastLoopNode()),
              CreateItemFromNode(new GotoSceneNode()),
            ],
          },
          {
            label: 'Actions',
            key: 'actions',
            handler: () => {},
            subitems: [
              CreateItemFromNode(new SetVisibleNode()),
              CreateItemFromNode(new ApplyForceOnObjectNode()),
            ],
          },
          {
            label: 'Variables',
            key: 'variables',
            handler: () => {},
            subitems: [
              CreateItemFromNode(new GetVariableNode()),
              CreateItemFromNode(new SetVariableNode()),
            ],
          },
          {
            label: 'Msic',
            key: 'misc',
            handler: () => {},
            subitems: [CreateItemFromNode(new GetDistanceBetweenNode())],
          },
        ],
      };
    }

    const contextTarget = resolveContextTarget(context, editor);

    if (contextTarget?.kind === 'connection') {
      const deleteConnectionItem: Item = {
        label: 'Delete Connection',
        key: 'delete-connection',
        async handler() {
          const connectionId = contextTarget.id;
          const exists = editor.getConnections().some(c => c.id === connectionId);
          if (!exists) {
            setSelectedConnectionId(null);
            return;
          }

          try {
            await editor.removeConnection(connectionId);
          } catch (error) {
            console.warn(
              `[LogicContextMenu] Failed to remove connection '${connectionId}'.`,
              error,
            );
          } finally {
            setSelectedConnectionId(null);
          }
        },
      };

      return {
        searchBar: false,
        list: [deleteConnectionItem],
      };
    }

    if (contextTarget?.kind !== 'node') {
      return {
        searchBar: false,
        list: [],
      };
    }

    const deleteItem: Item = {
      label: 'Delete',
      key: 'delete',
      async handler() {
        const nodeId = contextTarget.id;
        const nodeExists = !!editor.getNode(nodeId);
        if (!nodeExists) return;

        const connections = editor
          .getConnections()
          .filter((c: { source: any; target: any }) => {
            return c.source === nodeId || c.target === nodeId;
          });

        for (const connection of connections) {
          const connectionExists = editor
            .getConnections()
            .some(c => c.id === connection.id);
          if (!connectionExists) continue;

          try {
            await editor.removeConnection(connection.id);
          } catch (error) {
            console.warn(
              `[LogicContextMenu] Failed to remove connection '${connection.id}' while deleting node '${nodeId}'.`,
              error,
            );
          }
        }

        const nodeStillExists = !!editor.getNode(nodeId);
        if (!nodeStillExists) return;

        try {
          await editor.removeNode(nodeId);
        } catch (error) {
          console.warn(
            `[LogicContextMenu] Failed to remove node '${nodeId}'.`,
            error,
          );
        }
      },
    };

    return {
      searchBar: false,
      list: [deleteItem],
    };
  },
});
