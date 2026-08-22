// pages/PositionPermission.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { deletePermissionForPositionThunk } from "../../features/auth/permission/deletepermissionforposition/deletepermissionforpositionthunk";

// Fallback فقط برای وقتی سرور عنوان گروه رو نفرستاده
const GROUP_LABELS_FALLBACK = {
  production_routes: "مسیرهای تولید",
  production_orders: "سفارش‌های تولید",
  goods: "کالاها",
  sheets: "ورق‌ها",
  devices: "دستگاه‌ها",
  paints: "رنگ‌ها",
  services: "خدمات",
  permissions: "دسترسی‌ها",
  menus: "منوها",
  positions: "سمت‌ها",
  users: "کاربران",
};

const humanizeKey = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const resolveGroupLabel = (key, perm) => {
  const serverLabel = perm?.group_title || perm?.group?.title || perm?.category_title;
  if (serverLabel) return serverLabel;
  if (GROUP_LABELS_FALLBACK[key]) return GROUP_LABELS_FALLBACK[key];
  return humanizeKey(key);
};

const groupPermissions = (permissions) => {
  const groups = {};
  permissions.forEach((perm) => {
    const key = perm.code?.split(".")[0] || "other";
    if (!groups[key]) {
      groups[key] = { label: resolveGroupLabel(key, perm), items: [] };
    }
    groups[key].items.push(perm);
  });
  return groups;
};

// ======== کامپوننت مودال تایید حذف ========
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, permissionTitle, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-Card_border bg-Background shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 border-b border-Card_border pb-3">
          <h3 className="text-sm font-medium text-Primary">تایید حذف دسترسی</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-Muted hover:text-Primary transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-Primary text-center">
            آیا از حذف دسترسی
            <span className="font-medium text-Secondary"> "{permissionTitle}" </span>
            از این پوزیشن اطمینان دارید؟
          </p>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 h-10 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin ml-1" />
                  در حال حذف...
                </>
              ) : (
                "حذف"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-10 rounded-lg border border-Card_border text-Primary text-sm font-medium hover:bg-Input_bg transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PositionPermission = ({ 
  permissions = [], 
  loading = false, 
  error = null,
  positionId = null,
  onPermissionChange = null,
  onDeleteSuccess = null
}) => {
  const dispatch = useDispatch();
  const [openGroups, setOpenGroups] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [localPermissions, setLocalPermissions] = useState(permissions);

  // به‌روزرسانی localPermissions وقتی permissions تغییر کنه
  useEffect(() => {
    setLocalPermissions(permissions);
  }, [permissions]);

  const grouped = useMemo(() => groupPermissions(localPermissions), [localPermissions]);
  const groupKeys = Object.keys(grouped);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteClick = (permission) => {
    setSelectedPermission(permission);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!positionId || !selectedPermission) {
      setMessage({ type: 'error', text: 'شناسه پوزیشن یا دسترسی موجود نیست' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setDeletingId(selectedPermission.id);
    setMessage(null);

    try {
      await dispatch(deletePermissionForPositionThunk({
        positionId: positionId,
        permissionIds: [selectedPermission.id]
      })).unwrap();

      // حذف از لیست محلی (درجا)
      setLocalPermissions(prev => 
        prev.filter(p => p.id !== selectedPermission.id)
      );

      setMessage({ type: 'success', text: 'دسترسی با موفقیت حذف شد' });
      
      // اگر تابع رفرش وجود دارد، صدا بزن
      if (onPermissionChange) {
        await onPermissionChange();
      }
      
      // اگر تابع حذف موفق وجود دارد
      if (onDeleteSuccess) {
        onDeleteSuccess(selectedPermission.id);
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('خطا در حذف دسترسی:', err);
      setMessage({ 
        type: 'error', 
        text: typeof err === 'string' ? err : err?.detail || err?.message || 'خطا در حذف دسترسی' 
      });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setDeletingId(null);
      setShowConfirmModal(false);
      setSelectedPermission(null);
    }
  };

  const closeConfirmModal = () => {
    if (deletingId) return;
    setShowConfirmModal(false);
    setSelectedPermission(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-sm text-Muted">
          <i className="fas fa-spinner fa-spin ml-1" />
          در حال بارگذاری دسترسی‌ها...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-sm text-red-500">
          <i className="fas fa-exclamation-circle ml-1" />
          {error}
        </span>
      </div>
    );
  }

  if (!localPermissions || localPermissions.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-sm text-Muted">دسترسی‌ای ثبت نشده است.</span>
      </div>
    );
  }

  // کامپوننت نمایش پیام
  const Message = () => {
    if (!message) return null;
    
    const bgColor = message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
    const icon = message.type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation';
    
    return (
      <div className={`flex items-center justify-between p-2 rounded-lg border ${bgColor} mb-3`}>
        <div className="flex items-center gap-2">
          <i className={`fa-solid ${icon}`} />
          <span className="text-xs">{message.text}</span>
        </div>
        <button
          type="button"
          onClick={() => setMessage(null)}
          className="text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          <i className="fa-solid fa-xmark text-xs" />
        </button>
      </div>
    );
  };

  return (
    <>
      <div dir="rtl" className="flex flex-col gap-2">
        <Message />

        {groupKeys.map((key) => {
          const { label, items } = grouped[key];
          const activeCount = items.filter((p) => p.is_active).length;
          const isOpen = openGroups[key] ?? false;

          return (
            <div
              key={key}
              className="border border-Card_border rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleGroup(key)}
                className="w-full flex items-center justify-between px-3 py-2 bg-Input_bg/40 hover:bg-Input_bg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <i
                    className={`fas fa-chevron-${
                      isOpen ? "down" : "left"
                    } text-[10px] text-Muted`}
                  />
                  <span className="text-xs font-medium text-Primary">{label}</span>
                </div>
                <span className="text-[10px] text-Muted bg-Background border border-Card_border px-2 py-0.5 rounded-full">
                  {activeCount.toLocaleString("fa-IR")} از{" "}
                  {items.length.toLocaleString("fa-IR")} فعال
                </span>
              </button>

              {isOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-Background">
                  {items.map((perm) => {
                    const isDeleting = deletingId === perm.id;
                    
                    return (
                      <div
                        key={perm.id}
                        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-Input_bg/30 text-xs ${
                          isDeleting ? 'opacity-50' : ''
                        }`}
                      >
                        <span className="text-Primary truncate">{perm.title}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              perm.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {perm.is_active ? "فعال" : "غیرفعال"}
                          </span>
                          {positionId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(perm)}
                              disabled={isDeleting}
                              className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="حذف دسترسی"
                            >
                              {isDeleting ? (
                                <i className="fas fa-spinner fa-spin text-[10px]" />
                              ) : (
                                <i className="fas fa-trash-can text-[10px]" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* مودال تایید حذف */}
      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmDelete}
        permissionTitle={selectedPermission?.title || ''}
        isLoading={!!deletingId}
      />
    </>
  );
};

export default PositionPermission;