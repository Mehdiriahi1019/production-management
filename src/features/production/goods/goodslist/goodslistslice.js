// features/production/goods/goodslist/goodsslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getGoodsListThunk } from './goodslistthunk';

const initialState = {
    goods: [],
    loading: false,
    error: null,
    total: 0,
};

const goodsSlice = createSlice({
    name: 'goodsList',
    initialState,
    reducers: {
        clearGoodsError: (state) => {
            state.error = null;
        },
        resetGoods: (state) => {
            state.goods = [];
            state.total = 0;
            state.error = null;
            state.loading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getGoodsListThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getGoodsListThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;

                const payload = action.payload;

                // آیتم‌ها همیشه توی data هستن
                state.goods = Array.isArray(payload?.data) ? payload.data : [];

                // تعداد کل رکوردها توی meta.count هست
                state.total = payload?.meta?.count ?? 0;
            })
            .addCase(getGoodsListThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || { detail: 'خطا در دریافت لیست کالاها' };
                state.goods = [];
                state.total = 0;
            });
    },
});

export const { clearGoodsError, resetGoods } = goodsSlice.actions;
export default goodsSlice.reducer;