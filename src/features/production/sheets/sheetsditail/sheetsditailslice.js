import { createSlice } from '@reduxjs/toolkit';
import { getSheetsDitailThunk } from './sheetsditailthunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
};

const sheetsDitailSlice = createSlice({
    name: 'sheetsDitail',
    initialState,
    reducers: {
        clearSheetsDitail: (state) => {
            state.data = null;
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSheetsDitailThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSheetsDitailThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(getSheetsDitailThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || { detail: 'خطا در دریافت جزئیات ورق' };
                state.data = null;
            });
    },
});

export const { clearSheetsDitail } = sheetsDitailSlice.actions;
export default sheetsDitailSlice.reducer;