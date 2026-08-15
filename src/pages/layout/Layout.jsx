import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../../features/setting/settingSlice";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({}); // برای کنترل باز/بسته شدن زیرمنوها
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector((state) => state.settings.theme);

  const toggleTheme = () => {
    dispatch(setTheme(theme === "dark" ? "light" : "dark"));
  };

  const handleLogout = async () => {
    try {
      await logoutService();
      navigate("/");
    } catch (error) {
      navigate("/");
    }
  };

  // ========== ساختار داینامیک منوها ==========
  const menuItems = [
    { 
      path: "/dashboard", 
      icon: "fa-house", 
      label: "داشبورد" 
    },
    { 
      path: "/users", 
      icon: "fa-users", 
      label: "لیست کاربران" 
    },
    { 
      path: "/positionsanduserspage", 
      icon: "fa-sitemap", 
      label: "سمت‌ها و کاربران" 
    },
    { 
      label: "فرایند تولید", 
      icon: "fa-gear",
      path: "/productionpage"
    },
  ];

  // تابع برای تغییر وضعیت باز/بسته شدن منو
  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // بررسی می‌کنیم که آیا یک منو زیرمنو دارد یا خیر
  const hasSubItems = (item) => item.subItems && item.subItems.length > 0;

  return (
    <div className="w-full min-dvh bg-Signin_background text-Primary" dir="rtl">
      {/* هدر - بدون تغییر */}
      <header className="w-full h-14 bg-Background border-b border-Card_border flex items-center justify-between px-4 sticky top-0 z-30">
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="w-9 h-9 flex items-center justify-center rounded-md text-Primary hover:bg-Input_bg transition-colors"
        >
          <i className={`fa-solid ${isSidebarOpen ? "fa-xmark" : "fa-bars"} text-lg`} />
        </button>

        <span className="text-sm font-bold">پنل مدیریت</span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-md text-Primary hover:bg-Input_bg transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-bell text-lg" />
          </button>
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-md text-Primary hover:bg-Input_bg transition-colors cursor-pointer"
          >
            <Link to={"/profile"} className="fa-solid fa-user text-lg" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-md text-Primary hover:bg-Input_bg transition-colors cursor-pointer"
          >
            <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} text-lg`} />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* overlay موبایل */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
          />
        )}

        {/* سایدبار */}
        <aside
          className={`
            fixed md:static 
            top-14 md:top-0 
            right-0 
            h-[calc(100dvh-56px)] 
            md:h-auto 
            w-64 
            bg-Background 
            border-l 
            border-Card_border 
            z-20 
            transition-transform 
            duration-300
            ${isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
          `}
        >
          <nav className="p-4 space-y-2">
            {/* ====== رندر داینامیک منوها ====== */}
            {menuItems.map((item, index) => {
              const isOpen = openMenus[item.label] || false;

              // اگر آیتم زیرمنو دارد
              if (hasSubItems(item)) {
                return (
                  <div key={index}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-Text_secondary hover:bg-Input_bg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <i className={`fa-solid ${item.icon} w-5 text-center`} />
                        <span>{item.label}</span>
                      </div>
                      <i
                        className={`fa-solid fa-chevron-left transition-transform duration-200 ${
                          isOpen ? "-rotate-90" : ""
                        }`}
                      />
                    </button>

                    {/* زیرمنوها */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-96 mt-1" : "max-h-0"
                      }`}
                    >
                      <div className="pr-7 space-y-1 border-r-2 border-Primary/20 mr-4">
                        {item.subItems.map((sub) => (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            onClick={() => {
                              setIsSidebarOpen(false);
                              setOpenMenus({}); // بستن همه منوها بعد از کلیک
                            }}
                            className={({ isActive }) =>
                              `block px-4 py-2 rounded-lg text-sm transition-colors ${
                                isActive
                                  ? "bg-Primary/10 text-Primary font-medium"
                                  : "text-Text_secondary hover:bg-Input_bg"
                              }`
                            }
                          >
                            {sub.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // اگر آیتم ساده است (بدون زیرمنو)
              return (
                <NavLink
                  key={index}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-Primary/10 text-Primary font-medium"
                        : "text-Text_secondary hover:bg-Input_bg"
                    }`
                  }
                >
                  <i className={`fa-solid ${item.icon} w-5 text-center`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {/* خط جداکننده */}
            <hr className="my-4 border-Card_border" />

            {/* دکمه خروج */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-red-500 hover:bg-red-50/10 transition-colors"
            >
              <i className="fa-solid fa-right-from-bracket w-5 text-center" />
              <span>خروج</span>
            </button>
          </nav>
        </aside>

        {/* محتوا */}
        <main className="flex-1 min-h-[calc(100dvh-56px)] p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;