// features/production/sheets/sheetsforselect/sheetsforselectslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getSheetsForSelectThunk } from './sheetsforselectthunk';

const initialState = {
    sheets: [],
    loading: false,
    error: null,
    total: 0,
};

const sheetsForSelectSlice = createSlice({
    name: 'sheetsForSelect',
    initialState,
    reducers: {
        clearSheetsForSelect: (state) => {
            state.sheets = [];
            state.loading = false;
            state.error = null;
            state.total = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSheetsForSelectThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSheetsForSelectThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                
                const payload = action.payload;
                
                // ✅ ساختار: { data: [...], meta: { count: ... } }
                if (payload?.data && Array.isArray(payload.data)) {
                    state.sheets = payload.data;
                    state.total = payload.meta?.count || 0;
                } else if (payload?.results && Array.isArray(payload.results)) {
                    state.sheets = payload.results;
                    state.total = payload.count || 0;
                } else if (Array.isArray(payload)) {
                    state.sheets = payload;
                    state.total = payload.length;
                } else {
                    state.sheets = [];
                    state.total = 0;
                }
            })
            .addCase(getSheetsForSelectThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || { detail: 'خطا در دریافت لیست ورق‌ها' };
                state.sheets = [];
                state.total = 0;
            });
    },
});

export const { clearSheetsForSelect } = sheetsForSelectSlice.actions;
export default sheetsForSelectSlice.reducer;