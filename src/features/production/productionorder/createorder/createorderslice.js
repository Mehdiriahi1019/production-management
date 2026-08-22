// features/production/orders/createorder/createorderslice.js
import { createSlice } from '@reduxjs/toolkit';
import { createOrderThunk } from './createorderthunk';

const initialState = {
    loading: false,
    error: null,
    success: false,
    data: null,
};

const createOrderSlice = createSlice({
    name: 'createOrder',
    initialState,
    reducers: {
        clearCreateOrderState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
            state.data = null;
        },
        resetCreateOrder: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createOrderThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createOrderThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(createOrderThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در ایجاد سفارش' };
                state.data = null;
            });
    },
});

export const { clearCreateOrderState, resetCreateOrder } = createOrderSlice.actions;
export default createOrderSlice.reducer;