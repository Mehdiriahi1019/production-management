// features/production/goods/updatefile/updatefileservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const updatefileservice = (goodsId, fileId, payload) => {
    const UPDATE_FILE_URL = `${API_URL}/api/production/produc/goods/${goodsId}/file/${fileId}/`;
    
    const formData = new FormData();
    
    // اگر فایل جدید ارسال شده
    if (payload.file) {
        formData.append('file', payload.file);
    }
    
    // اگر updated_at ارسال شده
    if (payload.updated_at) {
        formData.append('updated_at', payload.updated_at);
    }
    
    return axiosInstance.patch(UPDATE_FILE_URL, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};