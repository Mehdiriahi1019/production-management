import { createAsyncThunk } from '@reduxjs/toolkit';
import { deviceCreateService } from './devicecreateservice';

export const createDeviceThunk = createAsyncThunk(
  'devices/createDevice',
  async ({ display_name, code }, { rejectWithValue }) => {
    try {
      const response = await deviceCreateService({ display_name, code });
      return response.data?.data ?? response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { detail: 'خطا در ایجاد دستگاه' }
      );
    }
  }
);