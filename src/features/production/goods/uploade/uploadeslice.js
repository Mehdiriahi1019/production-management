// features/production/goods/upload/uplodeslice.js
import { createSlice } from '@reduxjs/toolkit';
import { uploadGoodsThunk } from './uploadethunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    errors: [], // اضافه کردن آرایه خطاها
    errorCode: null, // کد خطا
    success: false,
    progress: 0,
};

const uploadSlice = createSlice({
    name: 'upload',
    initialState,
    reducers: {
        clearUploadStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.errors = [];
            state.errorCode = null;
            state.data = null;
            state.progress = 0;
        },
        setUploadProgress: (state, action) => {
            state.progress = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(uploadGoodsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.errors = [];
                state.errorCode = null;
                state.success = false;
                state.progress = 0;
            })
            .addCase(uploadGoodsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
                state.errors = [];
                state.errorCode = null;
                state.progress = 100;
            })
            .addCase(uploadGoodsThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                
                const payload = action.payload;
                if (payload) {
                    state.error = payload.message || 'خطا در آپلود فایل';
                    state.errors = payload.errors || [];
                    state.errorCode = payload.code || null;
                } else {
                    state.error = 'خطا در آپلود فایل';
                    state.errors = [];
                    state.errorCode = null;
                }
                
                state.data = null;
                state.progress = 0;
            });
    },
});

export const { clearUploadStatus, setUploadProgress } = uploadSlice.actions;
export default uploadSlice.reducer;