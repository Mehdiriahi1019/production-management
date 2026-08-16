import { createSlice } from "@reduxjs/toolkit";
import { getServicesForSelectThunk } from "./ServicesForSelectThunk";

const initialState = {
  services: [],
  loading: false,
  loaded: false,
  error: null,
};

const servicesForSelectSlice = createSlice({
  name: "servicesForSelect",
  initialState,
  reducers: {
    resetServicesForSelect: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getServicesForSelectThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getServicesForSelectThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.services = action.payload || [];
      })
      .addCase(getServicesForSelectThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetServicesForSelect } = servicesForSelectSlice.actions;
export default servicesForSelectSlice.reducer;