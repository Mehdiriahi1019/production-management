// features/production/orders/orderlist/orderlistthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { orderlistservice } from './orderlistservice';

export const getOrderListThunk = createAsyncThunk(
    'orderList/getOrderList',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await orderlistservice(params);
            return response.data?.data ?? response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { detail: 'خطا در دریافت لیست سفارشات' }
            );
        }
    }
);