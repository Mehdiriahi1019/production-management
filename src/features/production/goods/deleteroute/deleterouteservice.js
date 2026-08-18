// features/production/goods/deleteroute/deleterouteservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const deleterouteservice = (goodsId, routeId) => {
    const DELETE_ROUTE_URL = `${API_URL}/api/production/produc/goods/${goodsId}/route/${routeId}/`;
    
    return axiosInstance.delete(DELETE_ROUTE_URL);
};