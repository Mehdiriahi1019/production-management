// features/auth/permission/deletepermissionforposition/deletepermissionforpositionthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { deletepermissionforpositionservice } from './deletepermissionforpositionservice';

export const deletePermissionForPositionThunk = createAsyncThunk(
    'deletePermissionForPosition/deletePermissionForPosition',
    async ({ positionId, permissionIds }, { rejectWithValue }) => {
        try {
            const response = await deletepermissionforpositionservice(positionId, permissionIds);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در حذف دسترسی از پوزیشن' });
        }
    }
);