// features/auth/menuupdate/updademenuthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { updademenuservice } from './updademenuservice';

export const updateMenuThunk = createAsyncThunk(
    'menuUpdate/updateMenu',
    async ({ menuId, payload }, { rejectWithValue }) => {
        try {
            const response = await updademenuservice(menuId, payload);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در به‌روزرسانی منو' });
        }
    }
);