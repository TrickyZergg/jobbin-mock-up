import { createSlice, nanoid } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Toast { id: string; message: string; tone: 'success' | 'error' | 'info'; }
export interface UiState { toasts: Toast[]; globalSearch: string; }
const initialState: UiState = { toasts: [], globalSearch: '' };

const uiSlice = createSlice({
  name: 'ui', initialState,
  reducers: {
    addToast: {
      reducer: (state, action: PayloadAction<Toast>) => { state.toasts.push(action.payload); },
      prepare: ({ message, tone = 'success' }: { message: string; tone?: Toast['tone'] }) => ({ payload: { id: nanoid(), message, tone } }),
    },
    removeToast: (state, action: PayloadAction<string>) => { state.toasts = state.toasts.filter((toast) => toast.id !== action.payload); },
    setGlobalSearch: (state, action: PayloadAction<string>) => { state.globalSearch = action.payload; },
  },
});

export const { addToast, removeToast, setGlobalSearch } = uiSlice.actions;
export default uiSlice.reducer;
