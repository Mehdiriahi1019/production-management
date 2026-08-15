import { createSlice } from "@reduxjs/toolkit";
import { getServiceDetail } from "./serviceditailsthunk";

const initialState = {
  data: null,
  loading: false,
  error: null,
};

const serviceDetailSlice = createSlice({
  name: "serviceDetail",
  initialState,
  reducers: {
    clearServiceDetail: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getServiceDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getServiceDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getServiceDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearServiceDetail } = serviceDetailSlice.actions;
export default serviceDetailSlice.reducer;