// features/production/sheets/sheetcreate/sheetscreateslice.js
import { createSlice } from '@reduxjs/toolkit';
import { createSheetThunk } from './sheetscreatethunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const sheetsCreateSlice = createSlice({
    name: 'sheetsCreate',
    initialState,
    reducers: {
        clearSheetCreateStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createSheetThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createSheetThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(createSheetThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در ایجاد ورق' };
                state.data = null;
            });
    },
});

export const { clearSheetCreateStatus } = sheetsCreateSlice.actions;
export default sheetsCreateSlice.reducer;