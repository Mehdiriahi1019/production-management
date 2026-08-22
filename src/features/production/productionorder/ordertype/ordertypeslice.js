// features/production/productionorder/ordertype/ordertypeslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getOrderTypeThunk } from './ordertypethunk';

const initialState = {
    orderTypes: [],
    loading: false,
    error: null,
};

const orderTypeSlice = createSlice({
    name: 'orderType',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getOrderTypeThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getOrderTypeThunk.fulfilled, (state, action) => {
                state.loading = false;
                // پاسخ: { success: true, data: { order_type: [{ value, label }] } }
                state.orderTypes = action.payload?.data?.order_type || action.payload?.order_type || [];
            })
            .addCase(getOrderTypeThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error;
                state.orderTypes = [];
            });
    },
});

export default orderTypeSlice.reducer;