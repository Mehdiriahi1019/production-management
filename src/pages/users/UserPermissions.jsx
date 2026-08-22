// components/UserPermissions.jsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { addPermissionToUserThunk } from "../../features/auth/permission/addpermissiontouser/addpermissiontouserthunk";
import { deleteUserPermissionThunk } from "../../features/auth/permission/deleteuserpermission/deleteuserpermissionthunk";
import { editPermissionForUserThunk } from "../../features/auth/permission/editpermissionforuser/editpermissionforuserthunk";
import { getPermissionListThunk } from "../../features/auth/permission/permissionlist/permissionlistthunk";

// The backend sends error text as { fa, en } under different keys depending
// on the endpoint (message / errors / detail), or sometimes a plain string.
// This always resolves to the exact server string (fa first), and only uses
// the fallback when the server genuinely sent nothing usable.
const extractErrorMessage = (err, fallback) => {
  if (!err) return fallback;
  if (typeof err === "string") return err;

  const pickString = (value) => {
    if (typeof value === "string" && value.trim()) return value;
    if (value && typeof value === "object") {
      if (typeof value.fa === "string" && value.fa.trim()) return value.fa;
      if (typeof value.en === "string" && value.en.trim()) return value.en;
    }
    return null;
  };

  return (
    pickString(err.message) ||
    pickString(err.errors) ||
    pickString(err.detail) ||
    fallback
  );
};

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

const isPermissionActive = (perm) => {
  if (perm.is_active !== undefined && perm.is_active !== null) {
    return !!perm.is_active;
  }
  return perm.confirm === "allow";
};

const UserSearchablePermissionSelect = ({
  selectedPermissions = [],
  onChange,
  disabled,
  initialPermissions = []
}) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false, maxHeight: 360 });
  const [permissionsCache, setPermissionsCache] = useState(() => {
    const cache = {};
    initialPermissions.forEach((p) => {
      if (p?.id) cache[p.id] = p;
    });
    return cache;
  });

  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const PER_PAGE = 20;
  const ESTIMATED_PANEL_HEIGHT = 420;
  const VIEWPORT_MARGIN = 8;

  const normalizedSelected = useMemo(
    () => selectedPermissions.map((id) => String(id)),
    [selectedPermissions]
  );
  const isPermissionSelected = (id) => normalizedSelected.includes(String(id));

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const openUp = spaceBelow < ESTIMATED_PANEL_HEIGHT && spaceAbove > spaceBelow;
    const maxHeight = Math.max(160, Math.min(360, (openUp ? spaceAbove : spaceBelow)));

    setCoords({
      top: openUp ? rect.top : rect.bottom,
      left: rect.left,
      width: rect.width,
      openUp,
      maxHeight,
    });
  };

  const loadPermissions = async (search = '', page = 1) => {
    setLoading(true);
    try {
      const params = {
        limit: PER_PAGE,
        offset: (page - 1) * PER_PAGE,
      };
      if (search.trim()) {
        params.search = search.trim();
      }

      const result = await dispatch(getPermissionListThunk(params)).unwrap();

      let items = [];
      let count = 0;

      if (result?.data && Array.isArray(result.data)) {
        items = result.data;
        if (result?.meta && typeof result.meta.count === 'number') {
          count = result.meta.count;
        } else {
          count = result.data.length;
        }
      } else if (Array.isArray(result)) {
        items = result;
        count = result.length;
      } else if (result?.results && Array.isArray(result.results)) {
        items = result.results;
        count = result.count || result.results.length;
      }

      setAllPermissions(items);
      setTotalCount(count);

      setPermissionsCache((prev) => {
        const next = { ...prev };
        items.forEach((p) => {
          if (p?.id) next[p.id] = p;
        });
        return next;
      });
    } catch (error) {
      console.error('خطا در دریافت دسترسی‌ها:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions('', 1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadPermissions(searchTerm, 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || loading) return;
    setCurrentPage(page);
    loadPermissions(searchTerm, page);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedContainer = containerRef.current?.contains(event.target);
      const clickedPanel = panelRef.current?.contains(event.target);
      if (!clickedContainer && !clickedPanel) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handle = () => updateCoords();
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setPanelVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setPanelVisible(false);
    }
  }, [isOpen]);

  const selectedPermissionDetails = useMemo(() => {
    return normalizedSelected
      .map((id) => permissionsCache[id])
      .filter(Boolean);
  }, [normalizedSelected, permissionsCache]);

  const handleTogglePermission = (permissionId) => {
    const idStr = String(permissionId);
    if (normalizedSelected.includes(idStr)) {
      onChange(selectedPermissions.filter((id) => String(id) !== idStr));
    } else {
      onChange([...selectedPermissions, idStr]);
    }
  };

  const handleRemovePermission = (e, permissionId) => {
    e.stopPropagation();
    const idStr = String(permissionId);
    onChange(selectedPermissions.filter((id) => String(id) !== idStr));
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange([]);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setIsOpen(false);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const renderPermissionRow = (permission, isSelected) => {
    const title = permission.display_name || permission.name || permission.title || "بدون عنوان";
    const code = permission.code || permission.codename || "";

    return (
      <button
        key={permission.id}
        type="button"
        onClick={() => handleTogglePermission(permission.id)}
        className={`w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 mx-1 my-0.5 rounded-lg transition-all duration-150 ${
          isSelected
            ? "bg-Secondary/10 text-Secondary"
            : "text-Primary hover:bg-Input_bg hover:translate-x-[-1px]"
        }`}
        style={{ width: 'calc(100% - 8px)' }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`w-4 h-4 rounded-md border flex items-center justify-center text-[8px] flex-shrink-0 transition-all duration-150 ${
              isSelected
                ? "bg-Secondary border-Secondary text-white scale-100"
                : "border-Card_border scale-95"
            }`}
          >
            <i
              className={`fas fa-check transition-all duration-150 ${
                isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"
              }`}
            />
          </span>
          <span className="truncate">{title}</span>
        </div>
        {code && (
          <span
            dir="ltr"
            className="text-Muted text-[10px] flex-shrink-0 bg-Input_bg/60 px-1.5 py-0.5 rounded-md"
          >
            {code}
          </span>
        )}
      </button>
    );
  };

  const panel = isOpen && !disabled ? createPortal(
    <div
      ref={panelRef}
      dir="rtl"
      style={{
        position: 'fixed',
        top: coords.openUp ? undefined : coords.top + 6,
        bottom: coords.openUp ? window.innerHeight - coords.top + 6 : undefined,
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight,
        zIndex: 9999,
        opacity: panelVisible ? 1 : 0,
        transform: panelVisible
          ? 'translateY(0) scale(1)'
          : `translateY(${coords.openUp ? 6 : -6}px) scale(0.98)`,
        transition: 'opacity 160ms ease, transform 160ms ease',
      }}
      className="rounded-2xl border border-Card_border bg-Background/95 backdrop-blur-xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden ring-1 ring-black/5"
    >
      <div className="px-3 py-2 bg-gradient-to-l from-Secondary/15 via-Secondary/5 to-transparent border-b border-Card_border flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-medium text-Secondary flex items-center gap-1.5">
          <i className="fas fa-shield-halved text-[10px]" />
          انتخاب دسترسی‌ها
        </span>
        {totalCount > 0 && (
          <span className="text-[10px] text-Muted">
            {totalCount.toLocaleString("fa-IR")} مورد
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-1">
        {selectedPermissionDetails.length > 0 && (
          <div className="mb-1">
            <div className="px-3 pt-1.5 pb-1 flex items-center justify-between">
              <span className="text-[10px] font-medium text-Secondary flex items-center gap-1">
                <i className="fas fa-check-double text-[9px]" />
                انتخاب شده ({selectedPermissionDetails.length.toLocaleString("fa-IR")})
              </span>
            </div>
            {selectedPermissionDetails.map((permission) =>
              renderPermissionRow(permission, true)
            )}
            <div className="border-t border-Card_border my-1 mx-2" />
          </div>
        )}

        {loading && allPermissions.length === 0 ? (
          <div className="px-3 py-6 text-xs text-Muted text-center flex flex-col items-center gap-2">
            <i className="fas fa-spinner fa-spin text-Secondary" />
            در حال بارگذاری...
          </div>
        ) : allPermissions.length === 0 && selectedPermissionDetails.length === 0 ? (
          <div className="px-3 py-6 text-xs text-Muted text-center flex flex-col items-center gap-2">
            <i className="fas fa-inbox text-lg opacity-40" />
            دسترسی‌ای یافت نشد
          </div>
        ) : (
          allPermissions.map((permission) => {
            if (isPermissionSelected(permission.id)) return null;
            return renderPermissionRow(permission, false);
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-Card_border bg-Input_bg/40 flex-shrink-0">
          <span className="text-[10px] text-Muted">
            صفحه {currentPage.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="w-6 h-6 flex items-center justify-center rounded-md text-xs text-Muted hover:bg-Background hover:text-Secondary transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <i className="fas fa-chevron-right text-[10px]" />
            </button>

            {getPageNumbers().map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page)}
                disabled={loading}
                className={`w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-medium transition-all duration-150 ${
                  currentPage === page
                    ? "bg-gradient-to-br from-Secondary to-Secondary/80 text-white shadow-sm shadow-Secondary/40"
                    : "text-Primary hover:bg-Background"
                }`}
              >
                {page.toLocaleString("fa-IR")}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="w-6 h-6 flex items-center justify-center rounded-md text-xs text-Muted hover:bg-Background hover:text-Secondary transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <i className="fas fa-chevron-left text-[10px]" />
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative" ref={containerRef}>
        <div
          className={`bg-Input_bg border rounded-lg px-3 py-2 text-sm text-Primary cursor-text transition-all duration-150 ${
            isOpen ? "border-Secondary ring-2 ring-Secondary/20" : "border-Card_border"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={toggleDropdown}
        >
          <div className="flex items-center gap-2">
            <i className="fas fa-magnifying-glass text-[11px] text-Muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="جستجوی دسترسی..."
              value={isOpen ? searchTerm : ""}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => !disabled && setIsOpen(true)}
              disabled={disabled}
              className="flex-1 bg-transparent outline-none text-sm text-Primary placeholder:text-Muted/60 min-w-0 truncate"
              dir="rtl"
            />
            {selectedPermissions.length > 0 && !isOpen && (
              <span className="flex-shrink-0 text-[10px] font-medium text-white bg-gradient-to-br from-Secondary to-Secondary/80 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {selectedPermissions.length.toLocaleString("fa-IR")}
              </span>
            )}
            {selectedPermissions.length > 0 && !isOpen && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={disabled}
                className="flex-shrink-0 text-Muted hover:text-red-500 transition-colors"
                title="پاک کردن همه"
              >
                <i className="fas fa-times text-xs" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleDropdown}
              disabled={disabled}
              className="flex-shrink-0 text-Muted hover:text-Secondary transition-colors"
            >
              <i className={`fas fa-chevron-${isOpen ? "up" : "down"} text-[10px] transition-transform`} />
            </button>
          </div>
        </div>
      </div>

      {selectedPermissionDetails.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPermissionDetails.map((permission) => {
            const title = permission.display_name || permission.name || permission.title || "بدون عنوان";
            return (
              <span
                key={permission.id}
                className="inline-flex items-center gap-1.5 max-w-full bg-Secondary/10 text-Secondary text-[11px] pl-1.5 pr-2.5 py-1 rounded-full"
              >
                <span className="truncate max-w-[160px]">{title}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemovePermission(e, permission.id)}
                  disabled={disabled}
                  className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-Secondary hover:text-white transition-colors disabled:pointer-events-none"
                >
                  <i className="fas fa-times text-[8px]" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {panel}
    </div>
  );
};

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, isLoading }) => {
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
            <span className="font-medium text-Secondary"> "{title}" </span>
            از این کاربر اطمینان دارید؟
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

// userPermissions come from the user-details endpoint (user.permissions).
// They are kept in a local state that's synced from the `user` prop, so that
// editing a permission's confirm value can update the UI instantly without
// calling refetchUser() (which re-fetches the whole user object and causes
// the entire page to re-render / feel like a refresh). Add/remove still
// resync via refetchUser since they change the list itself.
const UserPermissions = ({ userId, user, refetchUser }) => {
  const dispatch = useDispatch();

  const [localPermissions, setLocalPermissions] = useState(user?.permissions || []);

  useEffect(() => {
    setLocalPermissions(user?.permissions || []);
  }, [user]);

  const userPermissions = localPermissions;

  const [openPermissionGroups, setOpenPermissionGroups] = useState({});
  const [deletingPermissionId, setDeletingPermissionId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPermissionForDelete, setSelectedPermissionForDelete] = useState(null);

  const [showAddUserPermission, setShowAddUserPermission] = useState(false);
  const [newUserPermissions, setNewUserPermissions] = useState([]);
  const [addUserPermissionLoading, setAddUserPermissionLoading] = useState(false);
  const [addUserPermissionError, setAddUserPermissionError] = useState(null);
  const [addUserPermissionMessage, setAddUserPermissionMessage] = useState(null);

  const [editingPermissionId, setEditingPermissionId] = useState(null);
  const [editConfirmValue, setEditConfirmValue] = useState('allow');

  const handleAddUserPermission = async () => {
    if (newUserPermissions.length === 0) {
      setAddUserPermissionError('لطفاً حداقل یک دسترسی انتخاب کنید');
      return;
    }

    setAddUserPermissionLoading(true);
    setAddUserPermissionError(null);
    setAddUserPermissionMessage(null);

    const permissionsPayload = newUserPermissions.map(permId => ({
      permission_id: permId,
      confirm: "allow"
    }));

    try {
      await dispatch(addPermissionToUserThunk({
        userId,
        permissions: permissionsPayload
      })).unwrap();

      setAddUserPermissionMessage({ type: 'success', text: 'دسترسی با موفقیت به کاربر اضافه شد' });
      setNewUserPermissions([]);
      setShowAddUserPermission(false);

      if (refetchUser) {
        await refetchUser();
      }

      setTimeout(() => setAddUserPermissionMessage(null), 3000);
    } catch (err) {
      console.error('خطا در افزودن دسترسی به کاربر:', err);
      setAddUserPermissionError(extractErrorMessage(err, 'خطا در افزودن دسترسی به کاربر'));
      setTimeout(() => setAddUserPermissionError(null), 4000);
    } finally {
      setAddUserPermissionLoading(false);
    }
  };

  const handleDeleteUserPermission = (permission) => {
    setSelectedPermissionForDelete(permission);
    setShowConfirmModal(true);
  };

  const confirmDeleteUserPermission = async () => {
    if (!selectedPermissionForDelete) return;

    setDeletingPermissionId(selectedPermissionForDelete.id);
    try {
      await dispatch(deleteUserPermissionThunk(selectedPermissionForDelete.id)).unwrap();

      if (refetchUser) {
        await refetchUser();
      }

      setShowConfirmModal(false);
      setSelectedPermissionForDelete(null);
    } catch (err) {
      console.error('خطا در حذف دسترسی:', err);
      setAddUserPermissionError(extractErrorMessage(err, 'خطا در حذف دسترسی'));
      setTimeout(() => setAddUserPermissionError(null), 4000);
    } finally {
      setDeletingPermissionId(null);
    }
  };

  const handleEditPermission = (permissionId) => {
    setEditingPermissionId(permissionId);
    const permission = userPermissions.find(p => p.id === permissionId);
    setEditConfirmValue(permission?.confirm === "allow" ? "allow" : "deny");
  };

  const saveEditPermission = async (permissionId) => {
    try {
      await dispatch(editPermissionForUserThunk({
        permissionId,
        payload: { confirm: editConfirmValue }
      })).unwrap();

      setLocalPermissions((prev) =>
        prev.map((p) =>
          p.id === permissionId ? { ...p, confirm: editConfirmValue } : p
        )
      );

      setEditingPermissionId(null);
    } catch (err) {
      console.error('خطا در ویرایش دسترسی:', err);
      setAddUserPermissionError(extractErrorMessage(err, 'خطا در ویرایش دسترسی'));
      setTimeout(() => setAddUserPermissionError(null), 4000);
    }
  };

  const togglePermissionGroup = (key) => {
    setOpenPermissionGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const groupedPermissions = useMemo(
    () => groupPermissions(userPermissions),
    [userPermissions]
  );
  const permissionGroupKeys = Object.keys(groupedPermissions);

  return (
    <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-Card_border flex items-center justify-between">
        <h3 className="text-sm font-medium text-Primary">دسترسی‌ها</h3>
        <button
          type="button"
          onClick={() => setShowAddUserPermission(true)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-Muted hover:text-Secondary hover:bg-Secondary/10 transition-colors"
        >
          <i className="fa-solid fa-plus text-xs" />
        </button>
      </div>

      <div dir="rtl" className="p-3 flex flex-col gap-2">
        {userPermissions.length === 0 ? (
          <div className="py-6 text-center text-xs text-Muted">
            دسترسی‌ای ثبت نشده است.
          </div>
        ) : (
          permissionGroupKeys.map((key) => {
            const { label, items } = groupedPermissions[key];
            const activeCount = items.filter(isPermissionActive).length;
            const isOpen = openPermissionGroups[key] ?? false;

            return (
              <div
                key={key}
                className="border border-Card_border rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => togglePermissionGroup(key)}
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
                    {items.length.toLocaleString("fa-IR")} مجاز
                  </span>
                </button>

                {isOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-Background">
                    {items.map((perm) => {
                      const isDeleting = deletingPermissionId === perm.id;
                      const isEditing = editingPermissionId === perm.id;

                      return (
                        <div
                          key={perm.id}
                          className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-Input_bg/30 text-xs ${
                            isDeleting ? 'opacity-50' : ''
                          }`}
                        >
                          <span className="text-Primary truncate">{perm.title}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isEditing ? (
                              <>
                                <select
                                  value={editConfirmValue}
                                  onChange={(e) => setEditConfirmValue(e.target.value)}
                                  className="text-[10px] rounded border border-Card_border bg-Background px-1 py-0.5"
                                >
                                  <option value="allow">مجاز</option>
                                  <option value="deny">غیر مجاز</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => saveEditPermission(perm.id)}
                                  className="text-green-500 hover:text-green-700 transition-colors"
                                >
                                  <i className="fas fa-check text-[10px]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPermissionId(null)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <i className="fas fa-times text-[10px]" />
                                </button>
                              </>
                            ) : (
                              <>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    isPermissionActive(perm)
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {isPermissionActive(perm) ? "مجاز" : "غیر مجاز"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleEditPermission(perm.id)}
                                  className="text-blue-400 hover:text-blue-600 transition-colors"
                                  title="ویرایش دسترسی"
                                >
                                  <i className="fas fa-pen text-[10px]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUserPermission(perm)}
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
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showAddUserPermission && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-Background border border-Card_border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-Primary">افزودن دسترسی به کاربر</h4>
              <button
                type="button"
                onClick={() => {
                  setShowAddUserPermission(false);
                  setNewUserPermissions([]);
                  setAddUserPermissionError(null);
                }}
                className="text-Muted hover:text-Primary transition-colors"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-Muted">
                  کاربر: <span className="text-Primary font-medium">{user?.username}</span>
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-Muted">
                  دسترسی‌ها
                  {newUserPermissions.length > 0 && (
                    <span className="mr-1 text-Secondary">({newUserPermissions.length} انتخاب شده)</span>
                  )}
                </label>
                <UserSearchablePermissionSelect
                  selectedPermissions={newUserPermissions}
                  onChange={setNewUserPermissions}
                  disabled={addUserPermissionLoading}
                />
              </div>

              {addUserPermissionError && (
                <p className="text-xs text-red-500">{addUserPermissionError}</p>
              )}

              {addUserPermissionMessage && (
                <p className="text-xs text-green-600">{addUserPermissionMessage.text}</p>
              )}

              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-Card_border">
                <button
                  type="button"
                  onClick={handleAddUserPermission}
                  disabled={addUserPermissionLoading || newUserPermissions.length === 0}
                  className="flex-1 h-10 rounded-lg bg-Secondary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {addUserPermissionLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin ml-1" />
                      در حال افزودن...
                    </>
                  ) : (
                    "افزودن دسترسی"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserPermission(false);
                    setNewUserPermissions([]);
                    setAddUserPermissionError(null);
                  }}
                  disabled={addUserPermissionLoading}
                  className="flex-1 h-10 rounded-lg border border-Card_border text-Primary text-sm font-medium hover:bg-Input_bg transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedPermissionForDelete(null);
        }}
        onConfirm={confirmDeleteUserPermission}
        title={selectedPermissionForDelete?.title || ''}
        isLoading={!!deletingPermissionId}
      />
    </div>
  );
};

export default UserPermissions;