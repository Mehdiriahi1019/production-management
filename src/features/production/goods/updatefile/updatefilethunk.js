// features/production/goods/updatefile/updatefilethunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { updatefileservice } from './updatefileservice';

export const updateFileThunk = createAsyncThunk(
    'updateFile/updateFile',
    async ({ goodsId, fileId, payload }, { rejectWithValue }) => {
        try {
            const response = await updatefileservice(goodsId, fileId, payload);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در به‌روزرسانی فایل' });
        }
    }
);