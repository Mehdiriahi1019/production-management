// features/production/ordertype/ordertypethunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { ordertypeservice } from './ordertypeservice';

export const getOrderTypeThunk = createAsyncThunk(
    'orderType/getOrderType',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await ordertypeservice(params);
            return response.data?.data ?? response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت انواع سفارش' }
            );
        }
    }
);