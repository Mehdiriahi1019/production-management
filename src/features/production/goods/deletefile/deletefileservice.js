// features/production/goods/deletefile/deletefileservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const deletefileservice = (goodsId, fileId) => {
    const DELETE_FILE_URL = `${API_URL}/api/production/produc/goods/${goodsId}/file/${fileId}/`;
    
    return axiosInstance.delete(DELETE_FILE_URL);
};