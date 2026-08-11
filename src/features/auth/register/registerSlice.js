import { createSlice } from "@reduxjs/toolkit";
import { registerUser } from "./registerThunk";


const initialState = {
  user: null,
  loading: false,
  error: null,
  success: false,
};


const authSlice = createSlice({

  name: "auth",

  initialState,

  reducers: {

    clearError: (state) => {
      state.error = null;
    },

  },


  extraReducers: (builder) => {

    builder

      .addCase(registerUser.pending, (state) => {

        state.loading = true;
        state.error = null;

      })


      .addCase(registerUser.fulfilled, (state, action) => {

        state.loading = false;
        state.success = true;
        state.user = action.payload;

      })


      .addCase(registerUser.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload;

      });

  },

});


export const {
  clearError
} = authSlice.actions;


export default authSlice.reducer;