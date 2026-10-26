import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useInput from './useInput';

describe('useInput', () => {
  it('menerima event input, checkbox, dan nilai langsung', () => {
    const { result } = renderHook(() => useInput('awal'));
    expect(result.current[0]).toBe('awal');
    act(() => result.current[1]({ target: { type: 'text', value: 'baru' } }));
    expect(result.current[0]).toBe('baru');
    act(() => result.current[1]({ target: { type: 'checkbox', checked: true, value: 'on' } }));
    expect(result.current[0]).toBe(true);
    act(() => result.current[1]('langsung'));
    expect(result.current[0]).toBe('langsung');
    act(() => result.current[2]('setter'));
    expect(result.current[0]).toBe('setter');
  });

  it('default kosong', () => {
    expect(renderHook(() => useInput()).result.current[0]).toBe('');
  });
});
