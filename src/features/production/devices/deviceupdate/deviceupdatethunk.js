import { createAsyncThunk } from '@reduxjs/toolkit';
import { deviceUpdateService } from './DeviceUpdateService';

export const updateDeviceThunk = createAsyncThunk(
  'deviceDetail/updateDevice',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await deviceUpdateService(id, payload);
      return response.data?.data ?? response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { detail: 'خطا در ویرایش دستگاه' }
      );
    }
  }
);