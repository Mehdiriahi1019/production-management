// features/production/goods/goodsditail/goodsditailthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { goodsditailservice } from './goodsditailservice';

export const getGoodsDitailThunk = createAsyncThunk(
    'goodsDitail/getGoodsDitail',
    async (id, { rejectWithValue }) => {
        try {
            const response = await goodsditailservice(id);
            return response.data?.data ?? response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت جزئیات کالا' }
            );
        }
    }
);