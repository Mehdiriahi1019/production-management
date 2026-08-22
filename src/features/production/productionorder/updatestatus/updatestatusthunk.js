// features/production/productionorder/updatestatus/updatestatusthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { updatestatusservice } from './updatestatusservice';

export const updateStatusThunk = createAsyncThunk(
    'updateStatus/updateStatus',
    async ({ orderId, data }, { rejectWithValue }) => {
        try {
            const response = await updatestatusservice(orderId, data);
            return response.data?.data ?? response.data;
        } catch (error) {
            // ارسال کامل خطای سرور
            return rejectWithValue(
                error.response?.data || { 
                    success: false,
                    message: { fa: 'خطا در به‌روزرسانی وضعیت', en: 'Error updating status' },
                    errors: { fa: 'خطا در به‌روزرسانی وضعیت', en: 'Error updating status' }
                }
            );
        }
    }
);