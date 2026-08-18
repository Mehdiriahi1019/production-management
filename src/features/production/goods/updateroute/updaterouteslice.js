// features/production/goods/updateroute/updaterouteslice.js
import { createSlice } from '@reduxjs/toolkit';
import { updateRouteThunk } from './updateroutethunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const updateRouteSlice = createSlice({
    name: 'updateRoute',
    initialState,
    reducers: {
        clearUpdateRouteStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateRouteThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateRouteThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(updateRouteThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در به‌روزرسانی مسیر تولید' };
                state.data = null;
            });
    },
});

export const { clearUpdateRouteStatus } = updateRouteSlice.actions;
export default updateRouteSlice.reducer;