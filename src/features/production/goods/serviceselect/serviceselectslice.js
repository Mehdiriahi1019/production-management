// features/production/goods/serviceselect/serviceselectslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getServiceSelectThunk } from './serviceselectthunk';

const initialState = {
    services: [],
    loading: false,
    loaded: false,
    error: null,
    success: false,
};

const serviceSelectSlice = createSlice({
    name: 'serviceSelect',
    initialState,
    reducers: {
        clearServiceSelect: (state) => {
            state.services = [];
            state.loading = false;
            state.loaded = false;
            state.error = null;
            state.success = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getServiceSelectThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getServiceSelectThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.loaded = true;
                state.success = true;
                state.services = Array.isArray(action.payload) ? action.payload : [];
                state.error = null;
            })
            .addCase(getServiceSelectThunk.rejected, (state, action) => {
                state.loading = false;
                state.loaded = true;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در دریافت لیست سرویس‌ها' };
                state.services = [];
            });
    },
});

export const { clearServiceSelect } = serviceSelectSlice.actions;
export default serviceSelectSlice.reducer;