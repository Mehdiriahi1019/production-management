// features/production/goods/goodsupdate/goodsupdate.thunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { goodsupdateservice } from './goodsupdateservice';

export const updateGoodsThunk = createAsyncThunk(
    'goodsUpdate/updateGoods',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await goodsupdateservice(id, payload);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
               
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در به‌روزرسانی کالا' });
        }
    }
);