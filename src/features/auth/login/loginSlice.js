import { createSlice } from "@reduxjs/toolkit";
import { loginUser } from "./loginThunk";


const initialState = {
  user: null,
  loading: false,
  error: null,
  success: false,
};


const loginSlice = createSlice({

  name: "login",

  initialState,

  reducers: {

    clearError: (state) => {
      state.error = null;
    },

  },


  extraReducers: (builder) => {

    builder

      .addCase(loginUser.pending, (state) => {

        state.loading = true;
        state.error = null;

      })


      .addCase(loginUser.fulfilled, (state, action) => {

        state.loading = false;
        state.success = true;
        state.user = action.payload;

        // ذخیره‌ی توکن‌ها در localStorage
        if (action.payload?.access) {
          localStorage.setItem("accessToken", action.payload.access);
        }
        if (action.payload?.refresh) {
          localStorage.setItem("refreshToken", action.payload.refresh);
        }

      })


      .addCase(loginUser.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload;

      });

  },

});


export const {
  clearError
} = loginSlice.actions;


export default loginSlice.reducer;