// features/production/goods/creategoods/creategoodsservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const creategoodsservice = (payload) => {
    const CREATE_GOODS_URL = `${API_URL}/api/production/produc/goods/create/`;
    
    const formData = new FormData();
    
    // فیلدهای متنی
    if (payload.display_name) formData.append('display_name', payload.display_name);
    if (payload.title) formData.append('title', payload.title);
    if (payload.sn_code) formData.append('sn_code', payload.sn_code);
    if (payload.warehouse_code) formData.append('warehouse_code', payload.warehouse_code);
    if (payload.production_time_factor) formData.append('production_time_factor', payload.production_time_factor);
    
    // فایل‌ها (DXF)
    if (payload.files && payload.files.length > 0) {
        payload.files.forEach((file) => {
            formData.append('files', file);
        });
    }
    
    // goods_routes به صورت JSON string
    if (payload.goods_routes && payload.goods_routes.length > 0) {
        formData.append('goods_routes', JSON.stringify(payload.goods_routes));
    }
    
    return axiosInstance.post(CREATE_GOODS_URL, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};