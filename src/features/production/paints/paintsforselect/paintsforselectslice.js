// features/production/paints/paintsforselect/paintsforselectslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getPaintsForSelectThunk } from './paintsforselectthunk';

const initialState = {
    paints: [],
    loading: false,
    error: null,
    total: 0,
};

const paintsForSelectSlice = createSlice({
    name: 'paintsForSelect',
    initialState,
    reducers: {
        clearPaintsForSelect: (state) => {
            state.paints = [];
            state.loading = false;
            state.error = null;
            state.total = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getPaintsForSelectThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getPaintsForSelectThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                
                const payload = action.payload;
                
                // ✅ ساختار: { data: [...], meta: { count: ... } }
                if (payload?.data && Array.isArray(payload.data)) {
                    state.paints = payload.data;
                    state.total = payload.meta?.count || 0;
                } else if (payload?.results && Array.isArray(payload.results)) {
                    state.paints = payload.results;
                    state.total = payload.count || 0;
                } else if (Array.isArray(payload)) {
                    state.paints = payload;
                    state.total = payload.length;
                } else {
                    state.paints = [];
                    state.total = 0;
                }
            })
            .addCase(getPaintsForSelectThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || { detail: 'خطا در دریافت لیست رنگ‌ها' };
                state.paints = [];
                state.total = 0;
            });
    },
});

export const { clearPaintsForSelect } = paintsForSelectSlice.actions;
export default paintsForSelectSlice.reducer;