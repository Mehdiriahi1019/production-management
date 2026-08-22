// features/production/goods/goodsforselect/goodsforselectslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getGoodsForSelectThunk } from './goodsforselectthunk';

const initialState = {
    goods: [],
    loading: false,
    error: null,
    loaded: false,
    total: 0,
};

const goodsForSelectSlice = createSlice({
    name: 'goodsForSelect',
    initialState,
    reducers: {
        clearGoodsForSelect: (state) => {
            state.goods = [];
            state.loading = false;
            state.error = null;
            state.loaded = false;
            state.total = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getGoodsForSelectThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.loaded = false;
            })
            .addCase(getGoodsForSelectThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.loaded = true;
                state.error = null;
                
                const payload = action.payload;
                
                if (payload?.results) {
                    state.goods = Array.isArray(payload.results) ? payload.results : [];
                    state.total = payload.count || 0;
                } else if (payload?.data) {
                    state.goods = Array.isArray(payload.data) ? payload.data : [];
                    state.total = payload.total || 0;
                } else if (Array.isArray(payload)) {
                    state.goods = payload;
                    state.total = payload.length;
                } else {
                    state.goods = [];
                    state.total = 0;
                }
            })
            .addCase(getGoodsForSelectThunk.rejected, (state, action) => {
                state.loading = false;
                state.loaded = false;
                state.error = action.payload || { detail: 'خطا در دریافت لیست کالاها' };
                state.goods = [];
                state.total = 0;
            });
    },
});

export const { clearGoodsForSelect } = goodsForSelectSlice.actions;
export default goodsForSelectSlice.reducer;