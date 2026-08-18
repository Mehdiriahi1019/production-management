// features/production/goods/deletefile/deletefilethunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { deletefileservice } from './deletefileservice';

export const deleteFileThunk = createAsyncThunk(
    'deleteFile/deleteFile',
    async ({ goodsId, fileId }, { rejectWithValue }) => {
        try {
            const response = await deletefileservice(goodsId, fileId);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در حذف فایل' });
        }
    }
);