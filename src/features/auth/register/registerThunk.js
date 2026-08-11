import { createAsyncThunk } from "@reduxjs/toolkit";
import { registerService } from "./registerService";


export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {

    try {

      const response = await registerService(data);
console.log(response)
      return response;

    } catch (error) {

      return rejectWithValue(error);

    }

  }
);