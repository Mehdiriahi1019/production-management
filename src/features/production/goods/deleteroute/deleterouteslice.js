// features/production/goods/deleteroute/deleterouteslice.js
import { createSlice } from '@reduxjs/toolkit';
import { deleteRouteThunk } from './deleteroutethunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const deleteRouteSlice = createSlice({
    name: 'deleteRoute',
    initialState,
    reducers: {
        clearDeleteRouteStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(deleteRouteThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(deleteRouteThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(deleteRouteThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در حذف مسیر تولید' };
                state.data = null;
            });
    },
});

export const { clearDeleteRouteStatus } = deleteRouteSlice.actions;
export default deleteRouteSlice.reducer;