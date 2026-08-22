// features/auth/permission/addpermissiontouser/addpermissiontouserslice.js
import { createSlice } from '@reduxjs/toolkit';
import { addPermissionToUserThunk } from './addpermissiontouserthunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const addPermissionToUserSlice = createSlice({
    name: 'addPermissionToUser',
    initialState,
    reducers: {
        clearAddPermissionToUserStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addPermissionToUserThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(addPermissionToUserThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(addPermissionToUserThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در افزودن دسترسی به کاربر' };
                state.data = null;
            });
    },
});

export const { clearAddPermissionToUserStatus } = addPermissionToUserSlice.actions;
export default addPermissionToUserSlice.reducer;