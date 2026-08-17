import { createAsyncThunk } from '@reduxjs/toolkit';
import { deviceditailservice } from './deviceditailservice';

export const getDeviceDetailThunk = createAsyncThunk(
  'deviceDetail/getDeviceDetail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await deviceditailservice(id);
      return response.data?.data ?? response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { detail: 'خطا در دریافت جزئیات دستگاه' }
      );
    }
  }
);