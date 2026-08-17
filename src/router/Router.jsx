import { createBrowserRouter, Navigate } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import Layout from "../pages/layout/Layout";
import Dashboard from "../pages/dashboard/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";
import Profile from "../pages/auth/Profile";
import Users from "../pages/users/Users";
import EditUserPage from "../pages/users/Edituserpage";
import PositionsAndUsersPage from "../pages/users/PositionsAndUsersPage";
import Production from "../pages/production/Production";
import Paint from "../pages/production/Paint";
import Devices from "../pages/production/Device";
import Device from "../pages/production/Device";
import Sheets from "../pages/production/Sheets";
import Goods from "../pages/production/Goods";

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: "/dashboard",
            element: <Dashboard />,
          },
          {
            path: "/profile",
            element: <Profile />,
          },
          {
            path: "/users",
            element: <Users />,
          },
          {
            path: "/users/edit/:id",
            element: <EditUserPage />,
          },
          {
            path: "/positionsanduserspage",
            element: <PositionsAndUsersPage />,
          },
          {
            path: "/positionsanduserspage/:positionId",
            element: <PositionsAndUsersPage />,
          },
          {
            path: "/productionpage/services",
            element: <Production/>,
          },
          {
            path: "/productionpage/paint",
            element: <Paint/>,
          },
          {
            path: "/productionpage/device",
            element: <Device/>,
          },
          {
            path: "/productionpage/sheet",
            element: <Sheets/>,
          },
          {
            path: "/productionpage/goods",
            element: <Goods/>,
          },
          {
            path: "*",
            element: <Navigate to="/dashboard" replace />,
          },
        ],
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);