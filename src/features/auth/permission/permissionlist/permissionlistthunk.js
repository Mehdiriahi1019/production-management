// features/auth/permissions/permissionlist.thunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { permissionlistservice } from './permissionlistservice';

export const getPermissionListThunk = createAsyncThunk(
    'permissionList/getPermissionList',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await permissionlistservice(params);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data;

            if (errorData) {
                return rejectWithValue(errorData);
            }

            return rejectWithValue({ detail: 'خطا در دریافت لیست مجوزها' });
        }
    }
);