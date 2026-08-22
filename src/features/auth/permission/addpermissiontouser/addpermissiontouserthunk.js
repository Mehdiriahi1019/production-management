// features/auth/permission/addpermissiontouser/addpermissiontouserthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { addpermissiontouserservice } from './addpermissiontouserservice';

export const addPermissionToUserThunk = createAsyncThunk(
    'addPermissionToUser/addPermissionToUser',
    async ({ userId, permissions }, { rejectWithValue }) => {
        try {
            const response = await addpermissiontouserservice(userId, { permissions });
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در افزودن دسترسی به کاربر' });
        }
    }
);