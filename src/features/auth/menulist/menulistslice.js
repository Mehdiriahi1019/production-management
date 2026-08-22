// features/auth/menulist/menulistslice.js
import { createSlice } from '@reduxjs/toolkit';
import { getMenuListThunk } from './menulistthunk';

const initialState = {
    menus: [],
    loading: false,
    error: null,
    loaded: false,
};

const menuListSlice = createSlice({
    name: 'menuList',
    initialState,
    reducers: {
        clearMenuList: (state) => {
            state.menus = [];
            state.loading = false;
            state.error = null;
            state.loaded = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getMenuListThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getMenuListThunk.fulfilled, (state, action) => {
                state.loading = false;
                // اگر payload null یا undefined بود، آرایه خالی بگذار
                state.menus = Array.isArray(action.payload) ? action.payload : [];
                state.loaded = true;
                state.error = null;
            })
            .addCase(getMenuListThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || { detail: 'خطا در دریافت منوها' };
                state.menus = [];
                state.loaded = false;
            });
    },
});

export const { clearMenuList } = menuListSlice.actions;
export default menuListSlice.reducer;