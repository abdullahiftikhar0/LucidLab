import { Box, FormControl, FormLabel } from '@chakra-ui/react';
import * as React from 'react';
import { BaseCustomControl } from './BaseCustomControl';

export class InputBoxControl extends BaseCustomControl {
  public value: string = '';
  constructor(
    public label: string,
    public isMultiline: boolean = false,
    public placeholder: string = '',
  ) {
    super();
  }
}

export function InputBoxControlImpl(props: { data: InputBoxControl }) {
  const [value, setValue] = React.useState(props.data.value);

  const baseStyle: React.CSSProperties = {
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

  React.useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);

  return (
    <Box width="100%">
      <FormControl>
        <FormLabel color={'white'}>{props.data.label}</FormLabel>
        {props.data.isMultiline ? (
          <textarea
            style={{ ...baseStyle, height: '6em', resize: 'vertical' }}
            value={value}
            onPointerDown={e => e.stopPropagation()}
            placeholder={props.data.placeholder}
            onChange={e => {
              setValue(e.target.value);
              props.data.setValue(e.target.value);
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 0 0 1px #3b82f6';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        ) : (
          <input
            type="text"
            value={value}
            style={baseStyle}
            onPointerDown={e => e.stopPropagation()}
            placeholder={props.data.placeholder}
            onChange={e => {
              setValue(e.target.value);
              props.data.setValue(e.target.value);
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 0 0 1px #3b82f6';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        )}
      </FormControl>
    </Box>
  );
}
