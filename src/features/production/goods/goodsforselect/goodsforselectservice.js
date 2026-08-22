// features/production/goods/goodsforselect/goodsforselectservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const goodsforselectservice = (params = {}) => {
    const GOODS_FOR_SELECT_URL = `${API_URL}/api/production/produc/goods/for-select/`;
    
    return axiosInstance.get(GOODS_FOR_SELECT_URL, { params });
};