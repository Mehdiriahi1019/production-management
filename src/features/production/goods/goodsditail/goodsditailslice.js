// features/production/goods/goodsditail/goodsditailslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getGoodsDitailThunk } from './goodsditailthunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
};

const goodsDitailSlice = createSlice({
    name: 'goodsDitail',
    initialState,
    reducers: {
        clearGoodsDitail: (state) => {
            state.data = null;
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getGoodsDitailThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getGoodsDitailThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(getGoodsDitailThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || { detail: 'خطا در دریافت جزئیات کالا' };
                state.data = null;
            });
    },
});

export const { clearGoodsDitail } = goodsDitailSlice.actions;
export default goodsDitailSlice.reducer;