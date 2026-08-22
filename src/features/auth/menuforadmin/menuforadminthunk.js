// features/auth/menuforadmin/menuforadminthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { menuforadminservice } from './menuforadminservice';

export const getMenuForAdminThunk = createAsyncThunk(
    'menuForAdmin/getMenuForAdmin',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await menuforadminservice(params);
            return response.data?.data ?? response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت منوها' }
            );
        }
    }
);