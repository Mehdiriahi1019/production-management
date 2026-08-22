// features/production/sheets/sheetsforselect/sheetsforselectthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { sheetsforselectservice } from './sheetsforselectservice';

export const getSheetsForSelectThunk = createAsyncThunk(
    'sheetsForSelect/getSheetsForSelect',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await sheetsforselectservice(params);
            // ✅ کل response رو برگردون تا meta داخلش باشه
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت لیست ورق‌ها' }
            );
        }
    }
);