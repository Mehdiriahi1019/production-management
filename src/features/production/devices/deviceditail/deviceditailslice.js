import { createSlice } from '@reduxjs/toolkit';
import { getDeviceDetailThunk } from './deviceditailthunk';

const initialState = {
  data: null,
  loading: false,
  error: null,
  saving: false,
  saveError: null,
};

const deviceDetailSlice = createSlice({
  name: 'deviceDetail',
  initialState,
  reducers: {
    clearDeviceDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // ======== دریافت جزئیات ========
      .addCase(getDeviceDetailThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDeviceDetailThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getDeviceDetailThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export const { clearDeviceDetail } = deviceDetailSlice.actions;
export default deviceDetailSlice.reducer;