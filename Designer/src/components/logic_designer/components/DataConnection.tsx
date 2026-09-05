import * as React from 'react';
import { css } from 'styled-components';
import { ClassicScheme, Presets } from 'rete-react-render-plugin';
import { getSelectedConnectionId } from '../connection_selection';

const { Connection } = Presets.classic;

export function DataConnectionComponent(props: {
  data: ClassicScheme['Connection'] & { isLoop?: boolean };
}) {
  const isSelected = getSelectedConnectionId() === props.data.id;
  const styles = css`
    stroke: ${isSelected ? '#ffcc00' : '#b30000d6'};
    stroke-width: ${isSelected ? '10px' : '7px'};
    cursor: pointer;
    transition: stroke 120ms ease, stroke-width 120ms ease, filter 120ms ease;
    filter: ${isSelected ? 'drop-shadow(0 0 6px rgba(255, 204, 0, 0.7))' : 'none'};

    &:hover {
      stroke: #ffcc00;
      stroke-width: 10px;
      filter: drop-shadow(0 0 6px rgba(255, 204, 0, 0.6));
    }
  `;

  return <Connection {...props} styles={() => styles} />;
}
