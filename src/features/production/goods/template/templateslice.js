// features/production/goods/template/templateslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getTemplateThunk } from './templatethunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const templateSlice = createSlice({
    name: 'template',
    initialState,
    reducers: {
        clearTemplateStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getTemplateThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getTemplateThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(getTemplateThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در دریافت تمپلیت' };
                state.data = null;
            });
    },
});

export const { clearTemplateStatus } = templateSlice.actions;
export default templateSlice.reducer;