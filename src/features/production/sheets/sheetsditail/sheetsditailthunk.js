import { createAsyncThunk } from '@reduxjs/toolkit';
import { sheetsditailservice } from './sheetsditailservice';

export const getSheetsDitailThunk = createAsyncThunk(
    'sheetsDitail/getSheetsDitail',
    async (id, { rejectWithValue }) => {
        try {
            const response = await sheetsditailservice(id);
            return response.data?.data ?? response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت جزئیات ورق' }
            );
        }
    }
);