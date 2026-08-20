// features/production/goods/addroute/addroutethunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { addrouteservice } from './addrouteservice';

export const addRouteThunk = createAsyncThunk(
    'addRoute/addRoute',
    async ({ goodsId, payload }, { rejectWithValue }) => {
        try {
            const response = await addrouteservice(goodsId, payload);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در افزودن مسیر تولید' });
        }
    }
);