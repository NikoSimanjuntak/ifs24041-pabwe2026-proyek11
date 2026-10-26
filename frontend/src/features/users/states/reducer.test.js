import { describe, expect, it } from 'vitest';
import * as A from './action';
import * as R from './reducer';

describe('users reducers', () => {
  it('profileReducer', () => {
    expect(R.profileReducer(undefined, {})).toBeNull();
    expect(R.profileReducer(null, A.receiveProfileActionCreator({ id: 1 }))).toEqual({ id: 1 });
    expect(R.profileReducer({ id: 1 }, { type: 'LAIN' })).toEqual({ id: 1 });
  });
  it('reducer flag', () => {
    expect(R.isProfileReducer(undefined)).toBe(false);
    expect(R.isProfileReducer(false, A.setIsProfileActionCreator(true))).toBe(true);
    expect(R.isChangeProfileReducer(false, A.setIsChangeProfileActionCreator(true))).toBe(true);
    expect(R.isChangeProfilePasswordReducer(false, A.setIsChangeProfilePasswordActionCreator(true))).toBe(true);
  });
});
