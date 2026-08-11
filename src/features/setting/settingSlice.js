import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  theme: localStorage.getItem("theme") || "dark",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;

      localStorage.setItem(
        "theme",
        action.payload
      );
    },
  },
});

export const { setTheme } = settingsSlice.actions;

export default settingsSlice.reducer;