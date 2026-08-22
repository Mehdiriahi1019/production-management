// features/auth/menuforadmin/menuforadminslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getMenuForAdminThunk } from './menuforadminthunk';

const initialState = {
    menus: [],
    loading: false,
    error: null,
    loaded: false,
};

const menuForAdminSlice = createSlice({
    name: 'menuForAdmin',
    initialState,
    reducers: {
        clearMenuForAdmin: (state) => {
            state.menus = [];
            state.loading = false;
            state.error = null;
            state.loaded = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getMenuForAdminThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.loaded = false;
            })
            .addCase(getMenuForAdminThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.menus = Array.isArray(action.payload) ? action.payload : [];
                state.loaded = true;
                state.error = null;
            })
            .addCase(getMenuForAdminThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || { detail: 'خطا در دریافت منوها' };
                state.menus = [];
                state.loaded = false;
            });
    },
});

export const { clearMenuForAdmin } = menuForAdminSlice.actions;
export default menuForAdminSlice.reducer;