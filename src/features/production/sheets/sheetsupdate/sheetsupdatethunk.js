// features/production/sheets/sheetupdate/sheetsupdatethunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { sheetsupdateservice } from './sheetsupdateservice';

export const updateSheetThunk = createAsyncThunk(
    'sheetsUpdate/updateSheet',
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await sheetsupdateservice(id, payload);
            return response.data?.data ?? response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در ویرایش ورق' }
            );
        }
    }
);