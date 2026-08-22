// features/production/sheets/sheetsslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getSheetsListThunk } from './sheetslistthunk';

const initialState = {
    sheets: [],
    loading: false,
    error: null,
    total: 0,
};

const sheetsSlice = createSlice({
    name: 'sheetsList',
    initialState,
    reducers: {
        clearSheetsError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSheetsListThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSheetsListThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;

                state.sheets = action.payload?.data || [];
                state.total = action.payload?.meta?.count || 0;
            })
            .addCase(getSheetsListThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || { detail: 'خطا در دریافت لیست ورق‌ها' };
                state.sheets = [];
                state.total = 0;
            });
    },
});

export const { clearSheetsError } = sheetsSlice.actions;
export default sheetsSlice.reducer;