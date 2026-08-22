// features/production/sheets/sheetslistthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { sheetslistservice } from './sheetslistservice';

export const getSheetsListThunk = createAsyncThunk(
    'sheetsList/getSheetsList',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await sheetslistservice(params);
            return {
                data: response.data?.data ?? [],
                meta: response.data?.meta ?? null,
            };
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت لیست ورق‌ها' }
            );
        }
    }
);