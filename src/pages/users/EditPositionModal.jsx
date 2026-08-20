// components/EditPositionModal.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getPositionsThunk } from '../../features/auth/positions/Positionthunk';
import { getPermissionListThunk } from '../../features/auth/permission/permissionlist/permissionlistthunk';
import { addPremissionToPositionThunk } from '../../features/auth/permission/addpremissiontoposition/addpremissiontopositionthunk';

// ======== کامپوننت سرچ و انتخاب والد ========
// پنل با پورتال و position:fixed رندر می‌شود تا داخل مودالی که
// overflow-y-auto دارد کراپ/بریده نشود و همیشه کامل نمایش داده شود.
const SearchableParentSelect = ({ value, onChange, disabled, allPositions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false, maxHeight: 208 });
  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const ESTIMATED_PANEL_HEIGHT = 220;
  const VIEWPORT_MARGIN = 8; // حداقل فاصله‌ی امن از لبه‌ی بالا/پایین صفحه (هدر مرورگر و ...)

  useEffect(() => {
    if (value) {
      const found = allPositions.find(p => p.id === value);
      setSelectedLabel(found ? `${found.display_name} (${found.code})` : "");
    } else {
      setSelectedLabel("");
    }
  }, [value, allPositions]);

  const filteredPositions = allPositions.filter(p => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.trim().toLowerCase();
    return (
      p.display_name?.toLowerCase().includes(search) ||
      p.code?.toLowerCase().includes(search)
    );
  });

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const openUp = spaceBelow < ESTIMATED_PANEL_HEIGHT && spaceAbove > spaceBelow;
    // ارتفاع پنل را به فضای واقعی موجود محدود می‌کنیم تا هیچ‌وقت زیر هدر مرورگر یا بیرون از صفحه نرود
    const maxHeight = Math.max(120, Math.min(208, (openUp ? spaceAbove : spaceBelow)));

    setCoords({
      top: openUp ? rect.top : rect.bottom,
      left: rect.left,
      width: rect.width,
      openUp,
      maxHeight,
    });
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

  const handleSelect = (position) => {
    onChange(position.id);
    setSelectedLabel(`${position.display_name} (${position.code})`);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSelectNone = () => {
    onChange(null);
    setSelectedLabel("");
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSelectedLabel("");
    setSearchTerm("");
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
      className="rounded-lg border border-Card_border bg-Background shadow-lg overflow-y-auto"
    >
      <button
        type="button"
        onClick={handleSelectNone}
        className={`w-full px-3 py-2 text-right text-xs transition-colors hover:bg-Input_bg flex items-center justify-between ${value === null ? "bg-Secondary/10 text-Secondary" : "text-Primary"}`}
      >
        <span>بدون والد</span>
        {value === null && <i className="fas fa-check text-Secondary text-[10px] mr-2" />}
      </button>
      <div className="border-t border-Card_border my-1" />
      {filteredPositions.length === 0 ? (
        <div className="px-3 py-2 text-xs text-Muted">نتیجه‌ای یافت نشد</div>
      ) : (
        filteredPositions.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSelect(p)}
            className={`w-full px-3 py-2 text-right text-xs transition-colors hover:bg-Input_bg flex items-center justify-between ${value === p.id ? "bg-Secondary/10 text-Secondary" : "text-Primary"}`}
          >
            <span>{p.display_name}</span>
            <span className="text-Muted text-[10px]">{p.code}</span>
            {value === p.id && <i className="fas fa-check text-Secondary text-[10px] mr-2" />}
          </button>
        ))
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus-within:ring-1 focus-within:ring-Secondary cursor-text ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={toggleDropdown}
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="جستجوی والد..."
            value={isOpen ? searchTerm : selectedLabel}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-sm text-Primary placeholder:text-Muted/60 min-w-0"
            dir="rtl"
          />
          {selectedLabel && !isOpen && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="flex-shrink-0 text-Muted hover:text-red-500 transition-colors"
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

      {panel}
    </div>
  );
};

// ======== کامپوننت سرچ و انتخاب دسترسی‌ها ========
// ورودی فیلد فقط برای سرچ استفاده می‌شود؛ آیتم‌های انتخاب‌شده به‌صورت
// باکس‌های کوچک (chips) زیر فیلد نمایش داده می‌شوند و هرکدام دکمه‌ی
// ضربدر مستقل برای حذف دارند.
const SearchablePermissionSelect = ({
  selectedPermissions = [],
  onChange,
  disabled,
  initialPermissions = [],
  excludeIds = [] // آیدی‌هایی که نباید در لیست قابل‌انتخاب نمایش داده شوند (مثلاً دسترسی‌های از قبل موجود)
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
  const VIEWPORT_MARGIN = 8; // حداقل فاصله‌ی امن از لبه‌ی بالا/پایین صفحه (هدر مرورگر و ...)

  const normalizedSelected = useMemo(
    () => selectedPermissions.map((id) => String(id)),
    [selectedPermissions]
  );
  const isPermissionSelected = (id) => normalizedSelected.includes(String(id));

  const normalizedExcluded = useMemo(
    () => excludeIds.map((id) => String(id)),
    [excludeIds]
  );
  const isPermissionExcluded = (id) => normalizedExcluded.includes(String(id));

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const openUp = spaceBelow < ESTIMATED_PANEL_HEIGHT && spaceAbove > spaceBelow;
    // ارتفاع پنل را به فضای واقعی موجود محدود می‌کنیم تا هیچ‌وقت زیر هدر مرورگر یا بیرون از صفحه نرود
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
            if (isPermissionExcluded(permission.id)) return null;
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

      {/* باکس‌های کوچک دسترسی‌های انتخاب‌شده، مستقل از باز/بسته بودن پنل */}
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

// ======== مودال ویرایش پوزیشن ========
const EditPositionModal = ({
  position,
  onClose,
  onSubmit,
  isLoading = false,
  onUpdateSuccess
}) => {
  const dispatch = useDispatch();
  const allPositions = useSelector((state) => state.positions?.positions || []);
  const positionsLoading = useSelector((state) => state.positions?.loading || false);
  const positionsLoaded = useSelector((state) => state.positions?.loaded || false);

  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [parentId, setParentId] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState([]); // دسترسی‌های از قبل موجود در پوزیشن
  const [newPermissions, setNewPermissions] = useState([]); // فقط دسترسی‌های تازه‌ای که کاربر در حالت «افزودن» انتخاب می‌کند
  const [initialPermissionObjects, setInitialPermissionObjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isAddPermissionMode, setIsAddPermissionMode] = useState(false);

  useEffect(() => {
    if (!positionsLoaded && !positionsLoading) {
      dispatch(getPositionsThunk());
    }
  }, [dispatch, positionsLoaded, positionsLoading]);

  const fetchPermissionDetails = async (permIds) => {
    if (!permIds || permIds.length === 0) {
      setInitialPermissionObjects([]);
      return;
    }

    setLoadingPermissions(true);
    try {
      const params = {
        limit: 1000,
        offset: 0,
      };

      const result = await dispatch(getPermissionListThunk(params)).unwrap();
      let allPermissions = [];

      if (result?.data && Array.isArray(result.data)) {
        allPermissions = result.data;
      } else if (Array.isArray(result)) {
        allPermissions = result;
      } else if (result?.results && Array.isArray(result.results)) {
        allPermissions = result.results;
      }

      const permIdSet = new Set(permIds.map(String));
      const filteredPermissions = allPermissions.filter(
        (p) =>
          permIdSet.has(String(p.id)) ||
          permIdSet.has(String(p.permission_id))
      );

      if (filteredPermissions.length > 0) {
        setInitialPermissionObjects(filteredPermissions);
      } else {
        setInitialPermissionObjects(
          permIds.map((id) => ({
            id: id,
            display_name: `دسترسی ${id}`,
            code: "",
          }))
        );
      }
    } catch (error) {
      console.error('خطا در دریافت جزئیات دسترسی‌ها:', error);
      setInitialPermissionObjects(
        permIds.map((id) => ({
          id: id,
          display_name: `دسترسی ${id}`,
          code: "",
        }))
      );
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    if (!position) return;

    setDisplayName(position.display_name || "");
    setCode(position.code || "");

    const parentValue = position.parent || position.parent_id;
    if (parentValue) {
      const foundParent = allPositions.find(p => p.id === parentValue);
      setParentId(foundParent ? foundParent.id : null);
    } else {
      setParentId(null);
    }

    setIsActive(position.is_active !== undefined ? position.is_active : true);

    const rawPermissions = position.position_perm || position.permissions || [];

    if (Array.isArray(rawPermissions) && rawPermissions.length > 0) {
      const permIds = rawPermissions
        .map((p) => {
          if (typeof p === "string") return p;
          if (typeof p === "number") return String(p);
          if (typeof p === "object") {
            return p.id || p.permission_id || p.permission?.id;
          }
          return null;
        })
        .filter(Boolean)
        .map((id) => String(id));

      setSelectedPermissions(permIds);

      const hasFullObjects = rawPermissions.some(
        (p) => typeof p === "object" && (p.display_name || p.title)
      );

      if (hasFullObjects) {
        const fullObjects = rawPermissions
          .filter((p) => typeof p === "object" && p.id)
          .map((p) => ({
            id: String(p.id),
            display_name: p.display_name || p.name || p.title || `دسترسی ${p.id}`,
            code: p.code || p.codename || "",
            ...p,
          }));
        setInitialPermissionObjects(fullObjects);
      } else {
        fetchPermissionDetails(permIds);
      }
    } else {
      setInitialPermissionObjects([]);
      setSelectedPermissions([]);
    }
  }, [position, allPositions]);

  // ======== تابع برای افزودن دسترسی به پوزیشن (فقط دسترسی‌های تازه انتخاب‌شده) ========
  const handleAddPermissions = async () => {
    if (newPermissions.length === 0) {
      setGeneralError('لطفاً حداقل یک دسترسی انتخاب کنید');
      return;
    }

    setSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});

    const payload = {
      position_id: position.id,
      permission_ids: newPermissions,
    };

    try {
      await dispatch(addPremissionToPositionThunk(payload)).unwrap();

      // بعد از موفقیت، دسترسی‌های تازه را به لیست موجود اضافه کن و حالت افزودن را ریست کن
      setSelectedPermissions((prev) => [...prev, ...newPermissions]);
      setNewPermissions([]);

      if (onUpdateSuccess) {
        await onUpdateSuccess();
      }

      onClose();
    } catch (err) {
      const nextFieldErrors = {};
      Object.entries(err || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) nextFieldErrors[key] = value.join("، ");
        else if (typeof value === 'string') nextFieldErrors[key] = value;
      });
      setFieldErrors(nextFieldErrors);
      if (err?.message?.fa) setGeneralError(err.message.fa);
      else if (err?.detail) setGeneralError(err.detail);
      else if (typeof err === 'string') setGeneralError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // اگر در حالت افزودن دسترسی هستیم، فقط دسترسی اضافه کن
    if (isAddPermissionMode) {
      await handleAddPermissions();
      return;
    }

    // در غیر این صورت، ویرایش معمولی پوزیشن
    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(true);

    const payload = {
      display_name: displayName,
      code: code,
      is_active: isActive,
      parent_id: parentId,
      permissions: selectedPermissions,
    };

    if (position) {
      if (position.updated_at) payload.updated_at = position.updated_at;
      if (position.updated_by) payload.updated_by = position.updated_by;
    }

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const nextFieldErrors = {};
      Object.entries(err || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) nextFieldErrors[key] = value.join("، ");
      });
      setFieldErrors(nextFieldErrors);
      if (err?.message?.fa) setGeneralError(err.message.fa);
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitting = submitting || isLoading;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-Background border border-Card_border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-Primary">
            {isAddPermissionMode ? 'افزودن دسترسی به پوزیشن' : 'ویرایش پوزیشن'}
          </h4>
          <div className="flex items-center gap-2">
            {!isAddPermissionMode && (
              <button
                type="button"
                onClick={() => {
                  setNewPermissions([]);
                  setIsAddPermissionMode(true);
                }}
                disabled={isSubmitting}
                className="text-xs bg-Secondary/10 text-Secondary px-3 py-1.5 rounded-lg hover:bg-Secondary/20 transition-colors"
              >
                <i className="fas fa-plus ml-1 text-[10px]" />
                افزودن دسترسی
              </button>
            )}
            {isAddPermissionMode && (
              <button
                type="button"
                onClick={() => {
                  setIsAddPermissionMode(false);
                  setNewPermissions([]);
                  setGeneralError(null);
                  setFieldErrors({});
                }}
                disabled={isSubmitting}
                className="text-xs border border-Card_border px-3 py-1.5 rounded-lg text-Muted hover:text-Primary transition-colors"
              >
                <i className="fas fa-arrow-right ml-1 text-[10px]" />
                بازگشت
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-Muted hover:text-Primary transition-colors"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* حالت افزودن دسترسی */}
          {isAddPermissionMode ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-Muted">
                  پوزیشن: <span className="text-Primary font-medium">{position?.display_name}</span>
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-Muted">
                  دسترسی‌های جدید
                  {newPermissions.length > 0 && (
                    <span className="mr-1 text-Secondary">({newPermissions.length} انتخاب شده)</span>
                  )}
                  {loadingPermissions && (
                    <span className="mr-1 text-Muted text-[10px]">
                      <i className="fas fa-spinner fa-spin ml-1" />
                      در حال بارگذاری...
                    </span>
                  )}
                </label>
                <SearchablePermissionSelect
                  selectedPermissions={newPermissions}
                  onChange={setNewPermissions}
                  disabled={isSubmitting || loadingPermissions}
                  excludeIds={selectedPermissions}
                />
                {fieldErrors.permissions && (
                  <span className="text-[11px] text-red-500">{fieldErrors.permissions}</span>
                )}
              </div>

              {generalError && <p className="text-xs text-red-500">{generalError}</p>}

              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-Card_border">
                <button
                  type="button"
                  onClick={handleAddPermissions}
                  disabled={isSubmitting || newPermissions.length === 0 || loadingPermissions}
                  className="flex-1 h-10 rounded-lg bg-Secondary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? (
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
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 h-10 rounded-lg border border-Card_border text-Primary text-sm font-medium hover:bg-Input_bg transition-colors"
                >
                  انصراف
                </button>
              </div>
            </>
          ) : (
            <>
              {/* فرم ویرایش معمولی — فیلد دسترسی‌ها اینجا نمایش داده نمی‌شود */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-Muted">عنوان پوزیشن *</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus:outline-none focus:ring-1 focus:ring-Secondary"
                  />
                  {fieldErrors.display_name && (
                    <span className="text-[11px] text-red-500">{fieldErrors.display_name}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-Muted">کد *</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary text-left focus:outline-none focus:ring-1 focus:ring-Secondary"
                  />
                  {fieldErrors.code && (
                    <span className="text-[11px] text-red-500">{fieldErrors.code}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-Muted">وضعیت</label>
                  <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    disabled={isSubmitting}
                    className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus:outline-none focus:ring-1 focus:ring-Secondary"
                  >
                    <option value="true">فعال</option>
                    <option value="false">غیرفعال</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-Muted">والد</label>
                  <SearchableParentSelect
                    value={parentId}
                    onChange={setParentId}
                    disabled={isSubmitting}
                    allPositions={allPositions}
                  />
                  {fieldErrors.parent_id && (
                    <span className="text-[11px] text-red-500">{fieldErrors.parent_id}</span>
                  )}
                </div>
              </div>

              {generalError && <p className="text-xs text-red-500">{generalError}</p>}

              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-Card_border">
                <button
                  type="submit"
                  disabled={isSubmitting || !displayName.trim() || !code.trim() || loadingPermissions}
                  className="flex-1 h-10 rounded-lg bg-Secondary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin ml-1" />
                      در حال ویرایش...
                    </>
                  ) : (
                    "ویرایش پوزیشن"
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 h-10 rounded-lg border border-Card_border text-Primary text-sm font-medium hover:bg-Input_bg transition-colors"
                >
                  انصراف
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditPositionModal;