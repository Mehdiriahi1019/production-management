// features/production/goods/creategoods/creategoodsthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { creategoodsservice } from './creategoodsservice';

export const createGoodsThunk = createAsyncThunk(
    'createGoods/createGoods',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await creategoodsservice(payload);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در ایجاد کالا' });
        }
    }
);