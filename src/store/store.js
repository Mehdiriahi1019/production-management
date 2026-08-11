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
  },
});