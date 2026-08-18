// features/production/goods/updatefile/updatefileslice.js
import { createSlice } from '@reduxjs/toolkit';
import { updateFileThunk } from './updatefilethunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const updateFileSlice = createSlice({
    name: 'updateFile',
    initialState,
    reducers: {
        clearUpdateFileStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateFileThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateFileThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(updateFileThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در به‌روزرسانی فایل' };
                state.data = null;
            });
    },
});

export const { clearUpdateFileStatus } = updateFileSlice.actions;
export default updateFileSlice.reducer;