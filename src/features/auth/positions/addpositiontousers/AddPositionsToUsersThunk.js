import { createAsyncThunk } from "@reduxjs/toolkit";
import AddPositionsToUsersService from "./AddPositionsToUsersService";

// ======== اختصاص چند سمت به چند کاربر ========
// arg: آرایه‌ی { user_id, position_id, is_primary }
export const addPositionsToUsersThunk = createAsyncThunk(
  "addPositionsToUsers/add",
  async (positions, { rejectWithValue }) => {
    try {
      const data = await AddPositionsToUsersService.addPositionsToUsers(positions);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);