// features/production/goods/template/templatethunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { templateservice } from './templateservice';

export const getTemplateThunk = createAsyncThunk(
    'template/getTemplate',
    async (_, { rejectWithValue }) => {
        try {
            const response = await templateservice();
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت تمپلیت' }
            );
        }
    }
);