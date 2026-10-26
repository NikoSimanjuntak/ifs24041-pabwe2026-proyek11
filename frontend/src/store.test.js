import { describe, expect, it } from 'vitest';
import store, { reducer } from './store';

describe('store', () => {
  it('menyusun seluruh reducer dengan state awal yang benar', () => {
    const state = store.getState();
    expect(Object.keys(state).sort()).toEqual(Object.keys(reducer).sort());
    expect(state).toMatchObject({
      isAuthLogin: false, profile: null, applications: [], application: null, interviews: [], dashboard: null,
    });
  });
});
