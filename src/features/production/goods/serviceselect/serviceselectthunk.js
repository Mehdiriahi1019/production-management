// features/production/goods/serviceselect/serviceselectthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { serviceselectservice } from './serviceselectservice';

export const getServiceSelectThunk = createAsyncThunk(
    'serviceSelect/getServiceSelect',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await serviceselectservice(params);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در دریافت لیست سرویس‌ها' });
        }
    }
);