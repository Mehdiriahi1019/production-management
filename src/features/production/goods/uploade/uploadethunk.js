// features/production/goods/upload/uplodethunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { uplodeservice } from './uploadeservice';

export const uploadGoodsThunk = createAsyncThunk(
    'upload/uploadGoods',
    async (file, { rejectWithValue }) => {
        try {
            const response = await uplodeservice(file);
            return response.data;
        } catch (error) {
            // گرفتن خطاهای دقیق از سرور
            const errorData = error.response?.data;
            
            if (errorData) {
                // اگر خطاها به صورت array هستند
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    const errorMessages = errorData.errors.map(err => 
                        `${err.field}: ${err.message}`
                    ).join(' | ');
                    
                    return rejectWithValue({
                        message: errorData.message || 'خطا در آپلود فایل',
                        errors: errorData.errors,
                        code: errorData.code,
                        fullMessage: errorMessages
                    });
                }
                
                // اگر خطا به صورت رشته است
                if (typeof errorData === 'string') {
                    return rejectWithValue({
                        message: errorData,
                        errors: []
                    });
                }
                
                // اگر خطا به صورت object با detail
                if (errorData.detail) {
                    return rejectWithValue({
                        message: errorData.detail,
                        errors: []
                    });
                }
                
                // اگر خطا به صورت object با message
                if (errorData.message) {
                    return rejectWithValue({
                        message: typeof errorData.message === 'string' 
                            ? errorData.message 
                            : errorData.message.fa || errorData.message.en || 'خطا در آپلود فایل',
                        errors: errorData.errors || []
                    });
                }
            }
            
            return rejectWithValue({
                message: 'خطا در اتصال به سرور',
                errors: []
            });
        }
    }
);