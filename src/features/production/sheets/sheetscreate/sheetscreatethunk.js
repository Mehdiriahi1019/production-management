// features/production/sheets/sheetcreate/sheetscreatethunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { sheetscreateservice } from './sheetscreateservice';

export const createSheetThunk = createAsyncThunk(
    'sheetsCreate/createSheet',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await sheetscreateservice(payload);
            return response.data?.data ?? response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در ایجاد ورق' }
            );
        }
    }
);