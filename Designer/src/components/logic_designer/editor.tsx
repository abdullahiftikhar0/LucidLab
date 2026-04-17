import { debounce } from 'debounce';
import { createRoot } from 'react-dom/client';
import { NodeEditor } from 'rete';
import { AreaExtensions,AreaPlugin } from 'rete-area-plugin';

import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { Presets, ReactRenderPlugin } from 'rete-react-render-plugin';
import { AreaExtra, BaseNode, Schemes } from './base_types';
import { CustomNode } from './components/CustomNode';
import { ExecSocket } from './components/ExecSocket';
import { BaseCustomControl } from './controls/BaseCustomControl';
import { ComboBoxControl, ComboBoxControlImpl } from './controls/ComboBoxControl';

import { addCustomBackground } from './components/Background';
import { InputBoxControl, InputBoxControlImpl } from './controls/InputBoxControl';
import { ExportedNodes, getSceneJSON, importIntoEditor } from './node_exporter';
import { execSocket, numberOrStringSocket } from './sockets';
import { ExecConnectionComponent } from './components/ExecConnection';
import { DataSocket } from './components/DataSocket';
import { DataConnectionComponent } from './components/DataConnection';
import { contextMenu } from './contextmenu';
import { CompareNode } from './nodes';
import {
  getSelectedConnectionId,
  setSelectedConnectionId,
} from './connection_selection';

export async function createEditor(container: HTMLElement) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactRenderPlugin<Schemes, AreaExtra>({ createRoot });

  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl(),
  });

  render.addPreset(
    Presets.classic.setup({
      customize: {
        node(context) {
          return CustomNode;
        },
        connection(context) {
          const source = editor.getNode(context.payload.source);
          const target = editor.getNode(context.payload.target);

          const output = source && source.outputs[context.payload.sourceOutput];
          const input = target && target.inputs[context.payload.targetInput];

          const sourceSocket = output?.socket;
          const targetStocket = input?.socket;

          if (
            sourceSocket?.name == execSocket.name ||
            targetStocket?.name == execSocket.name
          ) {
            return ExecConnectionComponent;
          }

          return DataConnectionComponent;
        },
        socket(context) {
          if (context.payload.name == execSocket.name) {
            return ExecSocket;
          }
          return DataSocket;
        },
        control(data) {
          if (data.payload instanceof ComboBoxControl) {
            return ComboBoxControlImpl;
          }
          if (data.payload instanceof InputBoxControl) {
            return InputBoxControlImpl;
          }

          return Presets.classic.Control;
        },
      },
    }),
  );

  connection.addPreset(ConnectionPresets.classic.setup());
  render.addPreset(
    Presets.contextMenu.setup({
      delay: 0,
    }),
  );

  editor.use(area);
  area.use(connection);
  area.use(render);
  area.use(contextMenu);

  addCustomBackground(area);

  AreaExtensions.simpleNodesOrder(area);
  AreaExtensions.showInputControl(area);

  let onChangeCallback: ((nodes: ExportedNodes) => void) | undefined;

  const emitSceneStateChange = () => {
    if (!onChangeCallback) return;
    onChangeCallback(
      getSceneJSON(editor.getNodes(), editor.getConnections(), area.nodeViews),
    );
  };

  const bindControlChangeHandlers = (node: BaseNode | undefined) => {
    if (!node) return;

    Object.values(node.controls).forEach(control => {
      if (control instanceof BaseCustomControl) {
        control.onValueChange = emitSceneStateChange;
      }
    });

    Object.values(node.inputs).forEach(input => {
      if (input?.control instanceof BaseCustomControl) {
        input.control.onValueChange = emitSceneStateChange;
      }
    });
  };

  area.addPipe(context => {
    if (context.type === 'pointerdown') {
      const mouseButton = context.data.event.button;
      if (mouseButton === 0) {
        const target = context.data.event.target as Node | null;
        let clickedConnectionId: string | null = null;

        if (target) {
          area.connectionViews.forEach((connectionView, connectionId) => {
            if (clickedConnectionId) return;
            if (connectionView?.element?.contains(target)) {
              clickedConnectionId = connectionId;
            }
          });
        }

        const prevSelected = getSelectedConnectionId();
        if (clickedConnectionId) {
          if (prevSelected && prevSelected !== clickedConnectionId) {
            area.update('connection', prevSelected);
          }
          if (prevSelected !== clickedConnectionId) {
            setSelectedConnectionId(clickedConnectionId);
            area.update('connection', clickedConnectionId);
          }
        } else if (prevSelected) {
          setSelectedConnectionId(null);
          area.update('connection', prevSelected);
        }
      }
    }

    if (context.type === 'contextmenu') {
      const menuContext = context.data.context as any;
      const isConnectionContext =
        menuContext &&
        typeof menuContext === 'object' &&
        'id' in menuContext &&
        'source' in menuContext &&
        'target' in menuContext;

      const prevSelected = getSelectedConnectionId();

      if (isConnectionContext) {
        const nextSelected = String(menuContext.id);
        if (prevSelected && prevSelected !== nextSelected) {
          area.update('connection', prevSelected);
        }
        setSelectedConnectionId(nextSelected);
        area.update('connection', nextSelected);
      } else if (prevSelected) {
        setSelectedConnectionId(null);
        area.update('connection', prevSelected);
      }
    }

    if (context.type === 'connectioncreate') {
      const { sourceOutput, targetInput } = context.data;
      const source = editor.getNode(context.data.source);
      const sourceSocket = source.outputs[sourceOutput]?.socket;
      const target = editor.getNode(context.data.target);
      const targetSocket = target.inputs[targetInput]?.socket;

      if (target instanceof CompareNode) {
        if (targetSocket?.name == 'exec') return context;
        const conns = editor
          .getConnections()
          .filter(con => con.target == target.id && con.targetInput != 'exec');
        for (let conn of conns) {
          if (conn.targetInput == targetInput) {
            conn.source = context.data.source;
            conn.sourceOutput = context.data.sourceOutput;
          }
        }
        if (conns.length != 2) conns.push(context.data);

        if (conns.length == 2) {
          // ensure both connections are connected to the same socket.
          if (
            editor.getNode(conns[0].source).outputs[conns[0].sourceOutput]?.socket !=
            editor.getNode(conns[1].source).outputs[conns[1].sourceOutput]?.socket
          ) {
            return;
          }
        }

        return context;
      }

      if (sourceSocket == numberOrStringSocket || targetSocket == numberOrStringSocket)
        return context;

      if (sourceSocket != targetSocket) return;
    }

    if (
      onChangeCallback &&
      (context.type == 'connectioncreated' ||
        context.type == 'connectionremoved' ||
        context.type == 'nodecreated' ||
        context.type == 'noderemoved' ||
        context.type == 'nodetranslated')
    ) {
      emitSceneStateChange();
    }

    if (context.type === 'nodecreated') {
      bindControlChangeHandlers(editor.getNode(context.data.id));
    }

    if (context.type === 'connectionremoved') {
      const removedId = (context.data as any)?.id;
      const selectedId = getSelectedConnectionId();
      if (selectedId && removedId === selectedId) {
        setSelectedConnectionId(null);
      }
    }

    return context;
  });

  setTimeout(() => {
    AreaExtensions.zoomAt(area, editor.getNodes());
  }, 10);
  return {
    onSceneStateChange(callback: (nodes: ExportedNodes) => void) {
      onChangeCallback = debounce(callback, 500);
      editor.getNodes().forEach(node => bindControlChangeHandlers(node));
    },
    async importSceneState(nodes: ExportedNodes) {
      await editor.clear();
      await importIntoEditor(editor, area, nodes);
      editor.getNodes().forEach(node => bindControlChangeHandlers(node));
    },
    destroy: () => area.destroy(),
  };
}
