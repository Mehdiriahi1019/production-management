// features/production/sheets/sheetupdate/sheetsupdateslice.js
import { createSlice } from '@reduxjs/toolkit';
import { updateSheetThunk } from './sheetsupdatethunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const sheetsUpdateSlice = createSlice({
    name: 'sheetsUpdate',
    initialState,
    reducers: {
        clearSheetsUpdateStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateSheetThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateSheetThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(updateSheetThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در ویرایش ورق' };
                state.data = null;
            });
    },
});

export const { clearSheetsUpdateStatus } = sheetsUpdateSlice.actions;
export default sheetsUpdateSlice.reducer;