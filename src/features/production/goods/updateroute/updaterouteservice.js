// features/production/goods/updateroute/updaterouteservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const updaterouteservice = (goodsId, routeId, payload) => {
    const UPDATE_ROUTE_URL = `${API_URL}/api/production/produc/goods/${goodsId}/route/${routeId}/`;
    
    return axiosInstance.patch(UPDATE_ROUTE_URL, payload);
};