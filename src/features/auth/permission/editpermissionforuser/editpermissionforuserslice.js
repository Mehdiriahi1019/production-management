// features/auth/permission/editpermissionforuser/editpermissionforuserslice.js
import { createSlice } from '@reduxjs/toolkit';
import { editPermissionForUserThunk } from './editpermissionforuserthunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const editPermissionForUserSlice = createSlice({
    name: 'editPermissionForUser',
    initialState,
    reducers: {
        clearEditPermissionForUserStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(editPermissionForUserThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(editPermissionForUserThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(editPermissionForUserThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در ویرایش دسترسی کاربر' };
                state.data = null;
            });
    },
});

export const { clearEditPermissionForUserStatus } = editPermissionForUserSlice.actions;
export default editPermissionForUserSlice.reducer;