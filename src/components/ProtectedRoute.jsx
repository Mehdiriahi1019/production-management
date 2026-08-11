import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  // بررسی وجود توکن
  const token = localStorage.getItem("accessToken");
  
  // اگر توکن وجود نداشت، به لاگین هدایت کن
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  // اگر توکن وجود داشت، محتوای صفحه رو نشون بده
  return <Outlet />;
};

export default ProtectedRoute;