// features/auth/permissions/permissionlist.slice.js
import { createSlice } from '@reduxjs/toolkit';
import { getPermissionListThunk } from './permissionlistthunk';

const initialState = {
    permissions: [],
    loading: false,
    error: null,
    success: false,
    total: 0,
};

const permissionListSlice = createSlice({
    name: 'permissionList',
    initialState,
    reducers: {
        clearPermissionListStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
        },
        clearPermissionList: (state) => {
            state.permissions = [];
            state.total = 0;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getPermissionListThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getPermissionListThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                
                // اگر پاسخ شامل meta و data باشد
                if (action.payload?.data && Array.isArray(action.payload.data)) {
                    state.permissions = action.payload.data;
                    state.total = action.payload.meta?.count || action.payload.data.length;
                } 
                // اگر پاسخ مستقیم آرایه باشد
                else if (Array.isArray(action.payload)) {
                    state.permissions = action.payload;
                    state.total = action.payload.length;
                }
                // اگر پاسخ شامل results باشد (برای DRF)
                else if (action.payload?.results && Array.isArray(action.payload.results)) {
                    state.permissions = action.payload.results;
                    state.total = action.payload.count || action.payload.results.length;
                }
                // در غیر این صورت
                else {
                    state.permissions = [];
                    state.total = 0;
                }
                
                state.error = null;
            })
            .addCase(getPermissionListThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در دریافت لیست مجوزها' };
                state.permissions = [];
                state.total = 0;
            });
    },
});

export const { clearPermissionListStatus, clearPermissionList } = permissionListSlice.actions;
export default permissionListSlice.reducer;