import { createAsyncThunk } from "@reduxjs/toolkit";
import { serviceslistservice } from "./serviceslistservice";

export const getServicesList = createAsyncThunk(
    "servicesList/getServicesList",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await serviceslistservice(params);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || error.message
            );
        }
    }
);