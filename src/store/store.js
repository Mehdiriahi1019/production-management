import { configureStore } from "@reduxjs/toolkit";
import settingsReducer from "../features/setting/settingSlice";
import authReducer from "../features/auth/register/registerSlice";
import loginReducer from "../features/auth/login/loginSlice";
import profileReducer from "../features/auth/profile/profileSlice";
import usersReducer from "../features/users/userslist/UsersSlice";
import userDetailsSlicereducer from "../features/auth/profile/Userprofile/UserditailSlice";
import positionsListReducer from "../features/auth/positions/Positionslist/Positionslistslice";
import usersPositionReducer from "../features/auth/positions/Usersposition/UserspositionSlice";
import positionDetailReducer from "../features/auth/positions/Positiondetail/Positiondetailslice";
import positionsReducer from "../features/auth/positions/Positionslice";
import addPositionsToUsersReducer from "../features/auth/positions/addpositiontousers/addPositionsToUsersSlice";
import servicesListReducer from "../features/production/services/serviceslist/serviceslistslice";
import serviceDetailSlicereducer from "../features/production/services/serviceditails/serviceditailsslice";
import servicesForSelectReducer from "../features/servicesforselect/ServicesForSelectSlice";
import paintsListReducer from "../features/production/paints/paintslistslice"
import paintDetailReducer from "../features/production/paints/paintditail/paintdetailslice";
import devicesListReducer from "../features/production/devices/devicesslice"
import deviceDetailReducer from "../features/production/devices/deviceditail/deviceditailslice";
import sheetsListReducer from '../features/production/sheets/sheetslist/sheetsslice';
import sheetsDitailReducer from '../features/production/sheets/sheetsditail/sheetsditailslice';
import sheetsUpdateReducer from '../features/production/sheets/sheetsupdate/sheetsupdateslice';
import templateReducer from '../features/production/goods/template/templateslice';
import uploadReducer from '../features/production/goods/uploade/uploadeslice';
import goodsListReducer from '../features/production/goods/goodslist/goodslistslice';
import goodsDitailReducer from '../features/production/goods/goodsditail/goodsditailslice';
import addFileReducer from '../features/production/goods/addfile/addfileslice';
import deleteFileReducer from '../features/production/goods/deletefile/deletefileslice';
import updateFileReducer from '../features/production/goods/updatefile/updatefileslice';
import updateRouteReducer from '../features/production/goods/updateroute/updaterouteslice';
import serviceSelectReducer from '../features/production/goods/serviceselect/serviceselectslice';
import deleteRouteReducer from '../features/production/goods/deleteroute/deleterouteslice';
import addRouteReducer from '../features/production/goods/addroute/addrouteslice';
import createGoodsReducer from '../features/production/goods/creategoods/creategoodsslice';
import goodsUpdateReducer from '../features/production/goods/goodsupdate/goodsupdateslice';
import permissionListSlicereducer from '../features/auth/permission/permissionlist/permissionlistslice';
import addPremissionToPositionReducer from '../features/auth/permission/addpremissiontoposition/addpremissiontopositionslice';
import deletePermissionForPositionReducer from '../features/auth/permission/deletepermissionforposition/deletepermissionforpositionslice';





export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    auth: authReducer,
    login: loginReducer,
    profile: profileReducer,
    users: usersReducer,
    userDetails: userDetailsSlicereducer,
    positionsList: positionsListReducer,
    usersPosition: usersPositionReducer,
    positionDetail: positionDetailReducer,
    positions: positionsReducer,
    addPositionsToUsers: addPositionsToUsersReducer,
    servicesList: servicesListReducer,
    serviceDetail: serviceDetailSlicereducer,
    servicesForSelect: servicesForSelectReducer,
    paintsList: paintsListReducer,
    paintDetail: paintDetailReducer,
    devicesList: devicesListReducer,
    deviceDetail: deviceDetailReducer,
    sheetsList: sheetsListReducer,
    sheetsDitail: sheetsDitailReducer,
    sheetsUpdate: sheetsUpdateReducer,
    template: templateReducer,
    upload: uploadReducer,
    goodsList: goodsListReducer,
    goodsDitail: goodsDitailReducer,
    addFile: addFileReducer,
    deleteFile: deleteFileReducer,
    updateFile: updateFileReducer,
    updateRoute: updateRouteReducer,
    serviceSelect: serviceSelectReducer,
    deleteRoute: deleteRouteReducer,
    addRoute: addRouteReducer,
    createGoods: createGoodsReducer,
    goodsUpdate: goodsUpdateReducer,
    permissionList: permissionListSlicereducer,
    addPremissionToPosition: addPremissionToPositionReducer,
    deletePermissionForPosition: deletePermissionForPositionReducer,

  },
});