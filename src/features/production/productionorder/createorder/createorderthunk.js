// features/production/orders/createorder/createorderthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createOrderService } from './createorderservice';

export const createOrderThunk = createAsyncThunk(
    'createOrder/createOrder',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await createOrderService(payload);
            return response.data?.data ?? response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در ایجاد سفارش' }
            );
        }
    }
);