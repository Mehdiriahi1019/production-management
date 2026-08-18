// features/production/goods/addfile/addfilethunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { addfileservice } from './addfileservice';

export const addFileThunk = createAsyncThunk(
    'addFile/addFile',
    async ({ id, file }, { rejectWithValue }) => {
        try {
            const response = await addfileservice(id, file);
            return response.data?.data ?? response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در آپلود فایل' }
            );
        }
    }
);