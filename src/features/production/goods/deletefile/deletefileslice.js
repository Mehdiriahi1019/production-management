// features/production/goods/deletefile/deletefileslice.js
import { createSlice } from '@reduxjs/toolkit';
import { deleteFileThunk } from './deletefilethunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const deleteFileSlice = createSlice({
    name: 'deleteFile',
    initialState,
    reducers: {
        clearDeleteFileStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(deleteFileThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(deleteFileThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(deleteFileThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در حذف فایل' };
                state.data = null;
            });
    },
});

export const { clearDeleteFileStatus } = deleteFileSlice.actions;
export default deleteFileSlice.reducer;