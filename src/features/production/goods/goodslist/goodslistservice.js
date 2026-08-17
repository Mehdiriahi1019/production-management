// features/production/goods/goodslist/goodslistservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const goodslistservice = (params = {}) => {
    const GOODS_LIST_URL = `${API_URL}/api/production/produc/goods/list/`;
    
    return axiosInstance.get(GOODS_LIST_URL, { params });
};