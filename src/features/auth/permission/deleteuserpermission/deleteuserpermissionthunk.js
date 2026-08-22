// features/auth/permission/deleteuserpermission/deleteuserpermissionthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleteuserpermissionservice } from './deleteuserpermissionservice';

export const deleteUserPermissionThunk = createAsyncThunk(
    'deleteUserPermission/deleteUserPermission',
    async (permissionId, { rejectWithValue }) => {
        try {
            const response = await deleteuserpermissionservice(permissionId);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در حذف دسترسی کاربر' });
        }
    }
);