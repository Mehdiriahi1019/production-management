// features/production/orders/orderlist/orderlistslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getOrderListThunk } from './orderlistthunk';

const initialState = {
    orders: [], // ← همیشه آرایه باشد
    loading: false,
    error: null,
    total: 0,
};

const orderListSlice = createSlice({
    name: 'orderList',
    initialState,
    reducers: {
        clearOrderError: (state) => {
            state.error = null;
        },
        resetOrders: (state) => {
            state.orders = [];
            state.total = 0;
            state.error = null;
            state.loading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getOrderListThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getOrderListThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                
                // اطمینان از اینکه action.payload آرایه است
                const payload = action.payload;
                
                if (payload?.results) {
                    state.orders = Array.isArray(payload.results) ? payload.results : [];
                    state.total = payload.count || 0;
                } else if (payload?.data) {
                    state.orders = Array.isArray(payload.data) ? payload.data : [];
                    state.total = payload.total || 0;
                } else if (Array.isArray(payload)) {
                    state.orders = payload;
                    state.total = payload.length;
                } else {
                    state.orders = [];
                    state.total = 0;
                }
            })
            .addCase(getOrderListThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || { detail: 'خطا در دریافت لیست سفارشات' };
                state.orders = [];
                state.total = 0;
            });
    },
});

export const { clearOrderError, resetOrders } = orderListSlice.actions;
export default orderListSlice.reducer;