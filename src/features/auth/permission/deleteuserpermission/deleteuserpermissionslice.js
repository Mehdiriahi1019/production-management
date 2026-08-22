// features/auth/permission/deleteuserpermission/deleteuserpermissionslice.js
import { createSlice } from '@reduxjs/toolkit';
import { deleteUserPermissionThunk } from './deleteuserpermissionthunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const deleteUserPermissionSlice = createSlice({
    name: 'deleteUserPermission',
    initialState,
    reducers: {
        clearDeleteUserPermissionStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(deleteUserPermissionThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(deleteUserPermissionThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(deleteUserPermissionThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در حذف دسترسی کاربر' };
                state.data = null;
            });
    },
});

export const { clearDeleteUserPermissionStatus } = deleteUserPermissionSlice.actions;
export default deleteUserPermissionSlice.reducer;