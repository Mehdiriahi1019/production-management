// features/auth/permission/editpermissionforuser/editpermissionforuserthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { editpermissionforuserservice } from './editpermissionforuserservice';

export const editPermissionForUserThunk = createAsyncThunk(
    'editPermissionForUser/editPermissionForUser',
    async ({ permissionId, payload }, { rejectWithValue }) => {
        try {
            const response = await editpermissionforuserservice(permissionId, payload);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در ویرایش دسترسی کاربر' });
        }
    }
);