// features/production/goods/goodsupdate/goodsupdate.service.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const goodsupdateservice = (id, payload) => {
    const GOODS_UPDATE_URL = `${API_URL}/api/production/produc/goods/update/${id}/`;
    
    return axiosInstance.patch(GOODS_UPDATE_URL, payload);
};