// pages/Menu.jsx
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMenuForAdminThunk } from "../../features/auth/menuforadmin/menuforadminthunk";
import { clearMenuForAdmin } from "../../features/auth/menuforadmin/menuforadminslice";
import { updateMenuThunk } from "../../features/auth/updatdemenu/updademenuthunk";
import { clearUpdateMenuStatus } from "../../features/auth/updatdemenu/updademenuslice";

const Menu = () => {
  const dispatch = useDispatch();
  const { menus, loading, error, loaded } = useSelector((state) => state.menuForAdmin);
  const { loading: updateLoading, success: updateSuccess, error: updateError } = useSelector((state) => state.menuUpdate);
  const hasFetched = useRef(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [localMenus, setLocalMenus] = useState([]);
  const [updatingMenuId, setUpdatingMenuId] = useState(null);
  const [messageVisible, setMessageVisible] = useState(false);

  useEffect(() => {
    if (!hasFetched.current && !loaded && !loading) {
      hasFetched.current = true;
      dispatch(getMenuForAdminThunk());
    }

    return () => {
      dispatch(clearMenuForAdmin());
      hasFetched.current = false;
    };
  }, []);

  useEffect(() => {
    setLocalMenus(menus);
  }, [menus]);

  useEffect(() => {
    if (updateSuccess) {
      setUpdateMessage({ type: 'success', text: 'وضعیت منو با موفقیت تغییر کرد' });
      setMessageVisible(true);
      setUpdatingMenuId(null);
      
      setTimeout(() => {
        setMessageVisible(false);
        setTimeout(() => {
          dispatch(clearUpdateMenuStatus());
          setUpdateMessage(null);
        }, 300);
      }, 3000);
    }
  }, [updateSuccess, dispatch]);

  useEffect(() => {
    if (updateError) {
      let errorText = 'خطا در تغییر وضعیت منو';
      if (typeof updateError === 'string') {
        errorText = updateError;
      } else if (updateError?.detail) {
        errorText = updateError.detail;
      } else if (updateError?.message) {
        errorText = typeof updateError.message === 'string' ? updateError.message : updateError.message?.fa || updateError.message?.en || 'خطا در تغییر وضعیت منو';
      }
      setUpdateMessage({ type: 'error', text: errorText });
      setMessageVisible(true);
      setUpdatingMenuId(null);
      
      setTimeout(() => {
        setMessageVisible(false);
        setTimeout(() => {
          setUpdateMessage(null);
        }, 300);
      }, 4000);
    }
  }, [updateError]);

  const handleToggleStatus = async (menu) => {
    setUpdatingMenuId(menu.id);
    
    try {
      await dispatch(updateMenuThunk({
        menuId: menu.id,
        payload: { is_active: !menu.is_active }
      })).unwrap();
      
      setLocalMenus(prev => 
        prev.map(item => 
          item.id === menu.id 
            ? { ...item, is_active: !item.is_active }
            : item
        )
      );
    } catch (err) {
      console.error('خطا در تغییر وضعیت منو:', err);
    }
  };

  const Message = () => {
    if (!updateMessage) return null;
    
    const bgColor = updateMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
    const icon = updateMessage.type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation';
    
    return (
      <div 
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-4 py-2.5 rounded-lg border shadow-lg transition-all duration-300 ${bgColor}`}
        style={{
          opacity: messageVisible ? 1 : 0,
          transform: `translateX(-50%) translateY(${messageVisible ? 0 : -10}px)`,
          pointerEvents: messageVisible ? 'auto' : 'none'
        }}
      >
        <div className="flex items-center gap-2">
          <i className={`fa-solid ${icon}`} />
          <span className="text-xs">{updateMessage.text}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessageVisible(false);
            setTimeout(() => {
              setUpdateMessage(null);
            }, 300);
          }}
          className="text-current opacity-60 hover:opacity-100 transition-opacity mr-2"
        >
          <i className="fa-solid fa-xmark text-xs" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <span className="text-sm text-Muted">
          <i className="fa-solid fa-spinner fa-spin ml-1" />
          در حال بارگذاری...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <span className="text-sm text-red-500">
          <i className="fa-solid fa-triangle-exclamation ml-1" />
          {typeof error === "string" ? error : error?.detail || "خطا در دریافت منوها"}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-4">
      <Message />

      <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
        {/* هدر */}
        <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-3 border-b border-Card_border">
          <h3 className="text-sm font-medium text-Primary">لیست منوها</h3>
          <span className="text-xs text-Muted bg-Input_bg px-2 py-0.5 rounded-full flex-shrink-0">
            {localMenus.length} مورد
          </span>
        </div>

        {/* محتوای منوها */}
        <div className="p-4">
          {localMenus.length === 0 ? (
            <div className="flex items-center justify-center h-[200px]">
              <span className="text-sm text-Muted">
                <i className="fa-solid fa-inbox ml-1" />
                هیچ منویی یافت نشد.
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-Card_border bg-Input_bg">
                    <th className="px-3 py-2 text-right font-medium text-Muted">#</th>
                    <th className="px-3 py-2 text-right font-medium text-Muted">عنوان</th>
                    <th className="px-3 py-2 text-right font-medium text-Muted">مسیر</th>
                    <th className="px-3 py-2 text-right font-medium text-Muted">آیکون</th>
                    <th className="px-3 py-2 text-right font-medium text-Muted">والد</th>
                    <th className="px-3 py-2 text-right font-medium text-Muted">وضعیت</th>
                    <th className="px-3 py-2 text-right font-medium text-Muted">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-Card_border">
                  {localMenus.map((menu, index) => {
                    const isUpdating = updatingMenuId === menu.id;
                    
                    return (
                      <tr key={menu.id} className="hover:bg-Input_bg/30 transition-colors">
                        <td className="px-3 py-2 text-Muted">
                          {(index + 1).toLocaleString("fa-IR")}
                        </td>
                        <td className="px-3 py-2 text-Primary font-medium">
                          {menu.title || "—"}
                        </td>
                        <td className="px-3 py-2 text-Primary font-mono" dir="ltr">
                          {menu.path || "—"}
                        </td>
                        <td className="px-3 py-2 text-Muted">
                          {menu.icon ? <i className={`fa-solid ${menu.icon}`} /> : "—"}
                        </td>
                        <td className="px-3 py-2 text-Muted">
                          {menu.parent || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            menu.is_active !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {menu.is_active !== false ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(menu)}
                            disabled={isUpdating}
                            className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                              menu.is_active !== false
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isUpdating ? (
                              <i className="fa-solid fa-spinner fa-spin" />
                            ) : (
                              menu.is_active !== false ? 'غیرفعال کردن' : 'فعال کردن'
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;