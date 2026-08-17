// features/production/goods/goodslist/goodslistthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { goodslistservice } from './goodslistservice';

export const getGoodsListThunk = createAsyncThunk(
    'goodsList/getGoodsList',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await goodslistservice(params);
            // کل envelope (شامل data و meta) رو برمی‌گردونیم
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت لیست کالاها' }
            );
        }
    }
);