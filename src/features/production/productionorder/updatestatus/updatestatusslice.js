// features/production/productionorder/updatestatus/updatestatusslice.js
import { createSlice } from '@reduxjs/toolkit';
import { updateStatusThunk } from './updatestatusthunk';

const initialState = {
    loading: false,
    error: null,
    success: false,
    data: null,
};

const updateStatusSlice = createSlice({
    name: 'updateStatus',
    initialState,
    reducers: {
        clearUpdateStatusState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateStatusThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateStatusThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(updateStatusThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload; // ذخیره کامل خطا
                state.data = null;
            });
    },
});

export const { clearUpdateStatusState } = updateStatusSlice.actions;
export default updateStatusSlice.reducer;