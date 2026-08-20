// features/auth/permission/addpremissiontoposition/addpremissiontopositionslice.js
import { createSlice } from '@reduxjs/toolkit';
import { addPremissionToPositionThunk } from './addpremissiontopositionthunk';

const initialState = {
    data: null,
    loading: false,
    error: null,
    success: false,
};

const addPremissionToPositionSlice = createSlice({
    name: 'addPremissionToPosition',
    initialState,
    reducers: {
        clearAddPremissionToPositionStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addPremissionToPositionThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(addPremissionToPositionThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(addPremissionToPositionThunk.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload || { detail: 'خطا در افزودن دسترسی به پوزیشن' };
                state.data = null;
            });
    },
});

export const { clearAddPremissionToPositionStatus } = addPremissionToPositionSlice.actions;
export default addPremissionToPositionSlice.reducer;