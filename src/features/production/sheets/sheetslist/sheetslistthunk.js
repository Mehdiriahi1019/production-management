// features/production/sheets/sheetsistthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { sheetslistservice } from './sheetslistservice';

export const getSheetsListThunk = createAsyncThunk(
    'sheetsList/getSheetsList',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await sheetslistservice(params);
            return response.data?.data ?? response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت لیست ورق‌ها' }
            );
        }
    }
);