// positionsListSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { getPositionsListThunk } from "./Positionsliststhunk";

const initialState = {
  positions: [],
  meta: null,
  loading: false,
  error: null,
  loaded: false,

  // ======== کش فرزندان هر پوزیشن، کلید = parentId ========
  // شکل هر آیتم: { data: [], loading: false, error: null, loaded: false }
  childrenByParent: {},
};

const positionsListSlice = createSlice({
  name: "positionsList",
  initialState,
  reducers: {
    resetPositionsList: (state) => {
      state.positions = [];
      state.meta = null;
      state.loading = false;
      state.error = null;
      state.loaded = false; // مهم: loaded رو false می‌کنیم تا دوباره درخواست بزنه
      state.childrenByParent = {}; // فقط اینجا (بازگشت واقعی به لیست ریشه) پاک می‌شه
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPositionsListThunk.pending, (state, action) => {
        const parentId = action.meta?.arg?.parent_id;
        if (!parentId) {
          state.loading = true;
          state.error = null;
        } else {
          const existing = state.childrenByParent[parentId] || {};
          state.childrenByParent[parentId] = {
            ...existing,
            loading: true,
            error: null,
          };
        }
      })
      .addCase(getPositionsListThunk.fulfilled, (state, action) => {
        const parentId = action.meta?.arg?.parent_id;
        if (!parentId) {
          state.loading = false;
          state.positions = action.payload?.data || [];
          state.meta = action.payload?.meta || null;
          state.loaded = true;
        } else {
          state.childrenByParent[parentId] = {
            data: action.payload?.data || [],
            loading: false,
            error: null,
            loaded: true,
          };
        }
      })
      .addCase(getPositionsListThunk.rejected, (state, action) => {
        const parentId = action.meta?.arg?.parent_id;
        if (!parentId) {
          state.loading = false;
          state.error = action.payload;
          state.loaded = false;
        } else {
          const existing = state.childrenByParent[parentId] || {};
          state.childrenByParent[parentId] = {
            ...existing,
            loading: false,
            error: action.payload,
            loaded: false,
          };
        }
      });
  },
});

export const { resetPositionsList } = positionsListSlice.actions;
export default positionsListSlice.reducer;