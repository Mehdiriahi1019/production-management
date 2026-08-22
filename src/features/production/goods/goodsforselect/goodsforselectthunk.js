// features/production/goods/goodsforselect/goodsforselectthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { goodsforselectservice } from './goodsforselectservice';

export const getGoodsForSelectThunk = createAsyncThunk(
    'goodsForSelect/getGoodsForSelect',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await goodsforselectservice(params);
            // ✅ کل response رو برگردون
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت لیست کالاها' }
            );
        }
    }
);