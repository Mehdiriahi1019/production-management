// features/auth/permission/addpremissiontoposition/addpremissiontopositionthunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { addpremissiontopositionservice } from './addpremissiontopositionservice';

export const addPremissionToPositionThunk = createAsyncThunk(
    'addPremissionToPosition/addPremissionToPosition',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await addpremissiontopositionservice(payload);
            return response.data?.data ?? response.data;
        } catch (error) {
            const errorData = error.response?.data;
            
            if (errorData) {
                return rejectWithValue(errorData);
            }
            
            return rejectWithValue({ detail: 'خطا در افزودن دسترسی به پوزیشن' });
        }
    }
);