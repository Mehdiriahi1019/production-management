// features/auth/menuupdate/updademenuslice.js
import { createSlice } from '@reduxjs/toolkit';
import { updateMenuThunk } from './updademenuthunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const updateMenuSlice = createSlice({
    name: 'menuUpdate',
    initialState,
    reducers: {
        clearUpdateMenuStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateMenuThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateMenuThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(updateMenuThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در به‌روزرسانی منو' };
                state.data = null;
            });
    },
});

export const { clearUpdateMenuStatus } = updateMenuSlice.actions;
export default updateMenuSlice.reducer;