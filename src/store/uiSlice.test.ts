import { describe, expect, it } from 'vitest';
import reducer, { addToast, removeToast, setGlobalSearch } from './uiSlice';

describe('UI state', () => {
  it('creates identifiable toasts and removes only the dismissed toast', () => {
    const first = addToast({ message: 'Modificările au fost salvate.' });
    const second = addToast({ message: 'Încearcă din nou.', tone: 'error' });
    let state = reducer(undefined, first);
    state = reducer(state, second);
    expect(first.payload.id).not.toBe(second.payload.id);
    expect(state.toasts.map((toast) => toast.tone)).toEqual(['success', 'error']);
    state = reducer(state, removeToast(first.payload.id));
    expect(state.toasts).toEqual([second.payload]);
  });

  it('stores the cross-page search input independently of notifications', () => {
    const state = reducer(undefined, setGlobalSearch('Oradea'));
    expect(state.globalSearch).toBe('Oradea');
    expect(state.toasts).toEqual([]);
  });
});
