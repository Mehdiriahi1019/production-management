import { createSlice } from "@reduxjs/toolkit";
import { getDevicesListThunk } from "./devicesthunk";

const initialState = {
  devices: [],
  loading: false,
  error: null,
  total: 0,
};

const devicesListSlice = createSlice({
  name: "devicesList",
  initialState,
  reducers: {
    clearDevicesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDevicesListThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDevicesListThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.devices = action.payload.data || [];
        state.total = action.payload.meta?.count ?? state.devices.length;
      })
      .addCase(getDevicesListThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDevicesError } = devicesListSlice.actions;
export default devicesListSlice.reducer;