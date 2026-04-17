import { BaseCustomControl } from './BaseCustomControl';
import React from 'react';


export class ComboBoxControl extends BaseCustomControl {
  constructor(public label: string, public choices: string[]) {
    super();
  }
}

export function ComboBoxControlImpl(props: { data: ComboBoxControl }) {
  const [value, setValue] = React.useState(props.data.value);

  React.useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    lineHeight: 1.4,
    outline: 'none',
    boxSizing: 'border-box',
    opacity: 1,
    WebkitTextFillColor: '#0f172a',
  };
  
  function setComboBoxValue(val: string) {
    props.data.setValue(val);
    setValue(val);
  }

  return (
    <select
      aria-label={props.data.label}
      style={selectStyle}
      value={value}
      onPointerDown={e => e.stopPropagation()}
      onChange={e => setComboBoxValue(e.target.value as string)}
      onFocus={e => {
        e.currentTarget.style.borderColor = '#3b82f6';
        e.currentTarget.style.boxShadow = '0 0 0 1px #3b82f6';
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = '#cbd5e1';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <option value="" disabled>
        {props.data.label}
      </option>
      {props.data.choices.map(x => (
        <option key={x} value={x}>
          {x}
        </option>
      ))}
    </select>
  );
}
