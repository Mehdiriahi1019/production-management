// features/auth/permission/deletepermissionforposition/deletepermissionforpositionslice.js
import { createSlice } from '@reduxjs/toolkit';
import { deletePermissionForPositionThunk } from './deletepermissionforpositionthunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const deletePermissionForPositionSlice = createSlice({
    name: 'deletePermissionForPosition',
    initialState,
    reducers: {
        clearDeletePermissionForPositionStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(deletePermissionForPositionThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(deletePermissionForPositionThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(deletePermissionForPositionThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در حذف دسترسی از پوزیشن' };
                state.data = null;
            });
    },
});

export const { clearDeletePermissionForPositionStatus } = deletePermissionForPositionSlice.actions;
export default deletePermissionForPositionSlice.reducer;