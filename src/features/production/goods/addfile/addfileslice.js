// features/production/goods/addfile/addfileslice.js
import { createSlice } from '@reduxjs/toolkit';
import { addFileThunk } from './addfilethunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const addFileSlice = createSlice({
    name: 'addFile',
    initialState,
    reducers: {
        clearAddFileStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addFileThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(addFileThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(addFileThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در آپلود فایل' };
                state.data = null;
            });
    },
});

export const { clearAddFileStatus } = addFileSlice.actions;
export default addFileSlice.reducer;