// features/production/goods/addroute/addrouteslice.js
import { createSlice } from '@reduxjs/toolkit';
import { addRouteThunk } from './addroutethunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const addRouteSlice = createSlice({
    name: 'addRoute',
    initialState,
    reducers: {
        clearAddRouteStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addRouteThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(addRouteThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(addRouteThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در افزودن مسیر تولید' };
                state.data = null;
            });
    },
});

export const { clearAddRouteStatus } = addRouteSlice.actions;
export default addRouteSlice.reducer;