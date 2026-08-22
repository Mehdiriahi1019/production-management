// features/production/paints/paintsforselect/paintsforselectthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { paintsforselectservice } from './paintsforselectservice';

export const getPaintsForSelectThunk = createAsyncThunk(
    'paintsForSelect/getPaintsForSelect',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await paintsforselectservice(params);
            // ✅ کل response رو برگردون تا meta هم داخلش باشه
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت لیست رنگ‌ها' }
            );
        }
    }
);