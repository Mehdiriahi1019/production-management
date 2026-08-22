// features/menu/menulist/menulistthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { menulistservice } from './menulistservice';

export const getMenuListThunk = createAsyncThunk(
    'menuList/getMenuList',
    async (_, { rejectWithValue }) => {
        try {
            const response = await menulistservice();
            return response.data?.data ?? response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت منوها' }
            );
        }
    }
);