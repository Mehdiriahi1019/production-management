import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../../features/setting/settingSlice";

// ======== کامپوننت بازگشتی برای رندر هر سطح از منو/زیرمنو ========
const MenuItem = ({ item, depth, openMenus, toggleMenu, onNavigate }) => {
  const hasSubItems = (it) => it.subItems && it.subItems.length > 0;
  const isOpen = openMenus[item.label] || false;

  if (hasSubItems(item)) {
    return (
      <div>
        <button
          onClick={() => toggleMenu(item.label)}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-Text_secondary hover:bg-Input_bg transition-colors"
        >
          <div className="flex items-center gap-3">
            {item.icon && <i className={`fa-solid ${item.icon} w-5 text-center`} />}
            <span>{item.label}</span>
          </div>
          <i
            className={`fa-solid fa-chevron-left transition-transform duration-200 ${
              isOpen ? "-rotate-90" : ""
            }`}
          />
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-[1000px] mt-1" : "max-h-0"
          }`}
        >
          <div className="pr-3 space-y-1 border-r-2 border-Primary/20 mr-2">
            {item.subItems.map((sub, idx) => (
              <MenuItem
                key={sub.path || sub.label || idx}
                item={sub}
                depth={depth + 1}
                openMenus={openMenus}
                toggleMenu={toggleMenu}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? "bg-Primary/10 text-Primary font-medium"
            : "text-Text_secondary hover:bg-Input_bg"
        }`
      }
    >
      {item.icon && <i className={`fa-solid ${item.icon} w-5 text-center`} />}
      <span>{item.label}</span>
    </NavLink>
  );
};

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({}); 
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
      label: "مدیریت", 
      icon: "fa-user-gear",
      subItems: [
        { path: "/users", label: "لیست کاربران", icon:"fa-users"},
        { path: "/positionsanduserspage", label: "سمت‌ها و کاربران" , icon:"fa-user-group" },
        { path: "/menu", label: "منو ها " , icon :"fa-solid fa-bars" },
        { path: "/permission", label: "دسترسی ها " , icon:"fa-solid fa-key" },
      ],
    },
    { 
      label: "تولید", 
      icon: "fa-gear",
      subItems: [
        { path: "/productiondata", label: "داده های تولید" ,icon:"fa-database" , subItems: [
        { path: "/productionpage/services", label: "خدمات" , icon:"fa-screwdriver-wrench" },
        { path: "/productionpage/paint", label: "رنگ ها ", icon:"fa-solid fa-palette" },
        { path: "/productionpage/device", label: "دستگاه ها" , icon:"fa-solid fa-gears" },
        { path: "/productionpage/sheet", label: "ورق ها" , icon: "fa-solid fa-layer-group" },
        { path: "/productionpage/reports", label: "گزارشات تولید" , icon:"fa-solid fa-chart-line" },
        { path: "/productionpage/goods", label: "کالا ها", icon:"fa-solid fa-boxes-stacked" },
      ], },
      ],
    },
  ];

  // تابع برای تغییر وضعیت باز/بسته شدن منو
  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleNavigate = () => {
    setIsSidebarOpen(false);
    setOpenMenus({}); // بستن همه منوها بعد از کلیک
  };

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
            {/* ====== رندر داینامیک و بازگشتی منوها ====== */}
            {menuItems.map((item, index) => (
              <MenuItem
                key={item.path || item.label || index}
                item={item}
                depth={0}
                openMenus={openMenus}
                toggleMenu={toggleMenu}
                onNavigate={handleNavigate}
              />
            ))}

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