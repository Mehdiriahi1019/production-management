// features/production/goods/goodsditail/goodsditailservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const goodsditailservice = (id) => {
    const GOODS_DITAIL_URL = `${API_URL}/api/production/produc/goods/detail/${id}/`;
    
    return axiosInstance.get(GOODS_DITAIL_URL);
};