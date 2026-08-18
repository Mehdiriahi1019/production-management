// features/production/goods/deleteroute/deleteroutethunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleterouteservice } from './deleterouteservice';

export const deleteRouteThunk = createAsyncThunk(
    'deleteRoute/deleteRoute',
    async ({ goodsId, routeId }, { rejectWithValue }) => {
        try {
            const response = await deleterouteservice(goodsId, routeId);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در حذف مسیر تولید' });
        }
    }
);