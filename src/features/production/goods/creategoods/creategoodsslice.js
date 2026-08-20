// features/production/goods/creategoods/creategoodsslice.js
import { createSlice } from '@reduxjs/toolkit';
import { createGoodsThunk } from './creategoodsthunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const createGoodsSlice = createSlice({
    name: 'createGoods',
    initialState,
    reducers: {
        clearCreateGoodsStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createGoodsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createGoodsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(createGoodsThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در ایجاد کالا' };
                state.data = null;
            });
    },
});

export const { clearCreateGoodsStatus } = createGoodsSlice.actions;
export default createGoodsSlice.reducer;