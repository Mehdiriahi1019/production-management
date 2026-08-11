// features/auth/positions/Positiondetail/Positiondetailservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

const DETAIL_POSITION_URL = `${API_URL}/api/production/produc/detail-position/`;

export const getPositionDetailService = async (positionId) => {
  try {
    const response = await axiosInstance.get(
      `${DETAIL_POSITION_URL}${positionId}/`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message || "خطا در دریافت جزئیات سمت";
  }
};