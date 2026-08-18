// features/production/goods/updateroute/updateroutethunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { updaterouteservice } from './updaterouteservice';

export const updateRouteThunk = createAsyncThunk(
    'updateRoute/updateRoute',
    async ({ goodsId, routeId, payload }, { rejectWithValue }) => {
        try {
            const response = await updaterouteservice(goodsId, routeId, payload);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در به‌روزرسانی مسیر تولید' });
        }
    }
);