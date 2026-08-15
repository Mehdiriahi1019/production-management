import { createSlice } from "@reduxjs/toolkit";
import { getServicesList } from "./serviceslistthunk";

const initialState = {
    data: [],
    count: 0,
    loading: false,
    error: null,
};

const servicesListSlice = createSlice({
    name: "servicesList",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getServicesList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getServicesList.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload?.data || action.payload?.results || action.payload;
                state.count = action.payload?.meta?.count || action.payload?.count || 0;
            })
            .addCase(getServicesList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default servicesListSlice.reducer;