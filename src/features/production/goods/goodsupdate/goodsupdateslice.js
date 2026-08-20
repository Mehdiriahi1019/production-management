// features/production/goods/goodsupdate/goodsupdate.slice.js
import { createSlice } from '@reduxjs/toolkit';
import { updateGoodsThunk } from './goodsupdatethunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const goodsUpdateSlice = createSlice({
    name: 'goodsUpdate',
    initialState,
    reducers: {
        clearGoodsUpdateStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateGoodsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateGoodsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(updateGoodsThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در به‌روزرسانی کالا' };
                state.data = null;
            });
    },
});

export const { clearGoodsUpdateStatus } = goodsUpdateSlice.actions;
export default goodsUpdateSlice.reducer;