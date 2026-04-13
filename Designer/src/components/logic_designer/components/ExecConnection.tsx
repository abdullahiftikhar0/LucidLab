import * as React from 'react';
import { css } from 'styled-components';
import { ClassicScheme, Presets } from 'rete-react-render-plugin';
import { getSelectedConnectionId } from '../connection_selection';

const { Connection } = Presets.classic;

export function ExecConnectionComponent(props: {
  data: ClassicScheme['Connection'] & { isLoop?: boolean };
}) {
  const isSelected = getSelectedConnectionId() === props.data.id;
  const styles = css`
    stroke: ${isSelected ? '#00d1ff' : '#00000078'};
    stroke-width: ${isSelected ? '10px' : '7px'};
    stroke-dasharray: 10 5;
    animation: dash 1s linear infinite;
    stroke-dashoffset: 45;
    cursor: pointer;
    transition: stroke 120ms ease, stroke-width 120ms ease, filter 120ms ease;
    filter: ${isSelected ? 'drop-shadow(0 0 6px rgba(0, 209, 255, 0.7))' : 'none'};

    &:hover {
      stroke: #00d1ff;
      stroke-width: 10px;
      filter: drop-shadow(0 0 6px rgba(0, 209, 255, 0.6));
    }

    @keyframes dash {
      to {
        stroke-dashoffset: 0;
      }
    }
  `;

  return <Connection {...props} styles={() => styles} />;
}
