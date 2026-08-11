// components/UsersTable.jsx
import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUsersThunk } from "../../features/users/userslist/Usersthunk";
import { getPositionsThunk } from "../../features/auth/positions/Positionthunk";
import { addPositionsToUsersThunk } from "../../features/auth/positions/addpositiontousers/AddPositionsToUsersThunk";
import { unassignPositionsThunk } from "../../features/auth/positions/unassignpositions/UnassignpositionsThunk";
import { getUsersPositionThunk } from "../../features/auth/positions/Usersposition/Userspositionthunk";

// ======== فیلدهای کاربر برای نمایش کارتی (فقط فیلدهایی که از API برمی‌گردن) ========
const USER_FIELDS = [
  { key: "username", label: "نام کاربری" },
  { key: "first_name", label: "نام" },
  { key: "last_name", label: "نام خانوادگی" },
];

// ======== تابع فرمت کردن مقادیر ========
const formatUserValue = (key, value) => {
  if (!value && value !== 0) {
    return "—";
  }
  return value;
};

// ======== استایل‌های اسکرول بار نازک ========
const scrollbarStyles = `
  .thin-scrollbar::-webkit-scrollbar {
    width: 3px;
    height: 3px;
  }
  .thin-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .thin-scrollbar::-webkit-scrollbar-thumb {
    background: #c4c4c4;
    border-radius: 10px;
  }
  .thin-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a0a0a0;
  }
  /* Firefox */
  .thin-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #c4c4c4 transparent;
  }
`;

// ======== مودال تایید حذف ========
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, positionName, userName, deleting }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-[10000] px-4"
      onClick={onClose}
    >
      <div
        className="bg-Background border border-Card_border rounded-xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-sm font-medium text-Primary mb-3">تایید حذف</h4>
        
        <p className="text-sm text-Primary mb-6">
          آیا از حذف سمت 
          <span className="font-medium text-Secondary mx-1">{positionName}</span>
          از کاربر 
          <span className="font-medium text-Secondary mx-1">{userName}</span>
          اطمینان دارید؟
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 h-10 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? "در حال حذف..." : "حذف"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 h-10 rounded-lg border border-Card_border text-Primary text-sm font-medium hover:bg-Input_bg transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};

// ======== محاسبه‌ی موقعیت دراپ‌داون نسبت به viewport (برای پورتال) ========
const DROPDOWN_MAX_HEIGHT = 208;
const DROPDOWN_GAP = 4;

const computeDropdownPosition = (triggerEl) => {
  if (!triggerEl) return null;
  const rect = triggerEl.getBoundingClientRect();

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  const openUp = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;

  const top = openUp
    ? rect.top - DROPDOWN_GAP
    : rect.bottom + DROPDOWN_GAP;

  return {
    top,
    left: rect.left,
    width: rect.width,
    openUp,
    maxHeight: Math.max(
      120,
      Math.min(DROPDOWN_MAX_HEIGHT, openUp ? spaceAbove - DROPDOWN_GAP - 8 : spaceBelow - DROPDOWN_GAP - 8)
    ),
  };
};

// ======== هوک مشترک برای مدیریت باز/بسته شدن، پوزیشن و کلیک بیرون ========
const useDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const isOpeningRef = useRef(false);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      setPosition(computeDropdownPosition(triggerRef.current));
    }
  }, []);

  const open = useCallback(() => {
    if (isOpeningRef.current) return;
    isOpeningRef.current = true;
    updatePosition();
    setIsOpen(true);
    setTimeout(() => {
      isOpeningRef.current = false;
    }, 200);
  }, [updatePosition]);

  const close = useCallback(() => {
    setIsOpen(false);
    isOpeningRef.current = false;
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleReposition = () => updatePosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      const clickedTrigger = triggerRef.current && triggerRef.current.contains(event.target);
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      if (!clickedTrigger && !clickedDropdown) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  return { isOpen, open, close, position, triggerRef, dropdownRef };
};

// ======== کامپوننت سرچ و انتخاب تکی ========
const SearchableSelect = ({
  value,
  onChange,
  disabled,
  items,
  placeholder = "جستجو...",
  getItemLabel,
  getItemCode,
  valueKey = "id",
}) => {
  const { isOpen, open, close, position, triggerRef, dropdownRef } = useDropdown();
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);

  const selectedItem = items.find((item) => item[valueKey] === value);

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.trim().toLowerCase();
    const label = getItemLabel(item).toLowerCase();
    const code = getItemCode ? getItemCode(item)?.toLowerCase() || "" : "";
    return label.includes(search) || code.includes(search);
  });

  const handleSelectItem = (item) => {
    onChange(item[valueKey]);
    close();
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm("");
  };

  const toggleDropdown = (e) => {
    e?.stopPropagation();
    if (disabled) return;
    if (isOpen) {
      close();
    } else {
      open();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="relative" ref={triggerRef}>
      <div
        className={`bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus-within:ring-1 focus-within:ring-Secondary cursor-text ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={toggleDropdown}
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={selectedItem ? getItemLabel(selectedItem) : placeholder}
            value={isOpen ? searchTerm : (selectedItem ? getItemLabel(selectedItem) : "")}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) open();
            }}
            onFocus={() => !disabled && open()}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-sm text-Primary placeholder:text-Muted/60 min-w-0"
            dir="rtl"
          />

          {selectedItem && !isOpen && (
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
            <i className={`fas fa-chevron-${isOpen ? "up" : "down"} text-[10px]`} />
          </button>
        </div>
      </div>

      {isOpen &&
        !disabled &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-Background border border-Card_border rounded-lg shadow-lg overflow-y-auto thin-scrollbar"
            style={{
              top: position.openUp ? undefined : position.top,
              bottom: position.openUp ? window.innerHeight - position.top : undefined,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
          >
            {filteredItems.length === 0 ? (
              <div className="px-3 py-2 text-xs text-Muted">نتیجه‌ای یافت نشد</div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item[valueKey] === value;
                return (
                  <button
                    key={item[valueKey]}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`w-full px-3 py-2 text-right text-xs transition-colors hover:bg-Input_bg flex items-center justify-between ${
                      isSelected ? "bg-Secondary/10 text-Secondary" : "text-Primary"
                    }`}
                  >
                    <span>{getItemLabel(item)}</span>
                    {getItemCode && (
                      <span className="text-Muted text-[10px]">{getItemCode(item)}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

// ======== کامپوننت سرچ و انتخاب چندتایی ========
const MultiSearchableSelect = ({
  values,
  onChange,
  disabled,
  items,
  placeholder = "جستجو...",
  getItemLabel,
  getItemCode,
  valueKey = "id",
}) => {
  const { isOpen, open, close, position, triggerRef, dropdownRef } = useDropdown();
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.trim().toLowerCase();
    const label = getItemLabel(item).toLowerCase();
    const code = getItemCode ? getItemCode(item)?.toLowerCase() || "" : "";
    return label.includes(search) || code.includes(search);
  });

  const handleToggleItem = (item) => {
    const itemId = item[valueKey];
    if (values.includes(itemId)) {
      onChange(values.filter((id) => id !== itemId));
    } else {
      onChange([...values, itemId]);
    }
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange([]);
    close();
    setSearchTerm("");
  };

  const toggleDropdown = (e) => {
    e?.stopPropagation();
    if (disabled) return;
    if (isOpen) {
      close();
    } else {
      open();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const getSelectedLabels = () => {
    if (values.length === 0) return "";
    const selectedItems = items.filter((item) => values.includes(item[valueKey]));
    return selectedItems.map((item) => getItemLabel(item)).join("، ");
  };

  return (
    <div className="relative" ref={triggerRef}>
      <div
        className={`bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus-within:ring-1 focus-within:ring-Secondary cursor-text ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={toggleDropdown}
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={values.length > 0 ? getSelectedLabels() : placeholder}
            value={isOpen ? searchTerm : (values.length > 0 ? getSelectedLabels() : "")}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) open();
            }}
            onFocus={() => !disabled && open()}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-sm text-Primary placeholder:text-Muted/60 min-w-0"
            dir="rtl"
          />

          {values.length > 0 && !isOpen && (
            <button
              type="button"
              onClick={handleClearAll}
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
            <i className={`fas fa-chevron-${isOpen ? "up" : "down"} text-[10px]`} />
          </button>
        </div>
      </div>

      {isOpen &&
        !disabled &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-Background border border-Card_border rounded-lg shadow-lg overflow-y-auto thin-scrollbar"
            style={{
              top: position.openUp ? undefined : position.top,
              bottom: position.openUp ? window.innerHeight - position.top : undefined,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
          >
            {filteredItems.length === 0 ? (
              <div className="px-3 py-2 text-xs text-Muted">نتیجه‌ای یافت نشد</div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = values.includes(item[valueKey]);
                return (
                  <button
                    key={item[valueKey]}
                    type="button"
                    onClick={() => handleToggleItem(item)}
                    className={`w-full px-3 py-2 text-right text-xs transition-colors hover:bg-Input_bg flex items-center justify-between ${
                      isSelected ? "bg-Secondary/10 text-Secondary" : "text-Primary"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[8px] ${
                          isSelected
                            ? "bg-Secondary border-Secondary text-white"
                            : "border-Card_border"
                        }`}
                      >
                        {isSelected && <i className="fas fa-check" />}
                      </span>
                      <span>{getItemLabel(item)}</span>
                    </div>
                    {getItemCode && (
                      <span className="text-Muted text-[10px]">{getItemCode(item)}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

// ======== مودال افزودن سمت به کاربر ========
const AddUserPositionModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const users = useSelector((state) => state.users?.users || []);
  const usersLoading = useSelector((state) => state.users?.loading || false);
  const usersLoaded = useSelector((state) => state.users?.loaded || false);

  const positions = useSelector((state) => state.positions?.positions || []);
  const positionsLoading = useSelector((state) => state.positions?.loading || false);
  const positionsLoaded = useSelector((state) => state.positions?.loaded || false);

  useEffect(() => {
    if (!usersLoaded && !usersLoading) {
      dispatch(getUsersThunk());
    }
  }, [dispatch, usersLoaded, usersLoading]);

  useEffect(() => {
    if (!positionsLoaded && !positionsLoading) {
      dispatch(getPositionsThunk());
    }
  }, [dispatch, positionsLoaded, positionsLoading]);

  const rowIdCounter = useRef(1);
  const [rows, setRows] = useState([
    { rowId: 0, userId: null, positionIds: [], primaryId: null },
  ]);

  const updateRow = (rowId, changes) => {
    setRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, ...changes } : row))
    );
  };

  const handleUserChange = (rowId, userId) => {
    updateRow(rowId, { userId });
  };

  const handlePositionsChange = (rowId, positionIds) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;
        const primaryId = row.primaryId && positionIds.includes(row.primaryId)
          ? row.primaryId
          : null;
        return { ...row, positionIds, primaryId };
      })
    );
  };

  const handlePrimaryToggle = (rowId, positionId) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;
        const newPrimaryId = row.primaryId === positionId ? null : positionId;
        return { ...row, primaryId: newPrimaryId };
      })
    );
  };

  const handleAddRow = () => {
    rowIdCounter.current += 1;
    setRows((prev) => [
      ...prev,
      { rowId: rowIdCounter.current, userId: null, positionIds: [], primaryId: null },
    ]);
  };

  const handleRemoveRow = (rowId) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validRows = rows.filter((r) => r.userId && r.positionIds.length > 0);

    if (validRows.length === 0) {
      setError("لطفاً حداقل برای یک کاربر، یک سمت انتخاب کنید");
      return;
    }

    const payload = validRows.flatMap((row) =>
      row.positionIds.map((positionId) => ({
        user_id: row.userId,
        position_id: positionId,
        is_primary: positionId === row.primaryId,
      }))
    );

    setSubmitting(true);
    setError(null);

    try {
      await dispatch(addPositionsToUsersThunk(payload)).unwrap();
      await dispatch(getUsersPositionThunk()).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.message?.fa || err?.fa || "خطا در افزودن سمت به کاربر");
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = usersLoading || positionsLoading;

  return (
    <>
      <style>{scrollbarStyles}</style>
      
      <div
        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
        onClick={onClose}
      >
        <div
          className="bg-Background border border-Card_border rounded-xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="text-sm font-medium text-Primary mb-4 flex-shrink-0">افزودن سمت به کاربران</h4>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 thin-scrollbar">
              {rows.map((row, index) => {
                const selectedPositions = positions.filter((p) =>
                  row.positionIds.includes(p.id)
                );

                return (
                  <div
                    key={row.rowId}
                    className="flex flex-col gap-2 border border-Card_border rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-Muted">کاربر {index + 1}</span>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.rowId)}
                          disabled={submitting}
                          className="text-Muted hover:text-red-500 transition-colors"
                        >
                          <i className="fa-solid fa-trash-can text-xs" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-Muted">انتخاب کاربر</label>
                        <SearchableSelect
                          value={row.userId}
                          onChange={(userId) => handleUserChange(row.rowId, userId)}
                          disabled={submitting || isLoading}
                          items={users}
                          placeholder="جستجوی کاربر..."
                          getItemLabel={(user) =>
                            `${user.first_name || ""} ${user.last_name || ""} (${user.username})`.trim()
                          }
                          getItemCode={(user) => user.username}
                          valueKey="id"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-Muted">
                          انتخاب سمت‌ها
                          {row.positionIds.length > 0 && (
                            <span className="mr-1 text-Secondary">
                              ({row.positionIds.length} انتخاب شده)
                            </span>
                          )}
                        </label>
                        <MultiSearchableSelect
                          values={row.positionIds}
                          onChange={(positionIds) => handlePositionsChange(row.rowId, positionIds)}
                          disabled={submitting || isLoading}
                          items={positions}
                          placeholder="جستجوی سمت..."
                          getItemLabel={(position) => position.display_name}
                          getItemCode={(position) => position.code}
                          valueKey="id"
                        />
                      </div>
                    </div>

                    {selectedPositions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3 mt-1 pt-2 border-t border-Card_border/50">
                        <span className="text-xs text-Muted flex-shrink-0">سمت اصلی:</span>
                        {selectedPositions.map((position) => (
                          <label
                            key={position.id}
                            className="flex items-center gap-1.5 cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={row.primaryId === position.id}
                              onChange={() => handlePrimaryToggle(row.rowId, position.id)}
                              disabled={submitting}
                              className="w-3.5 h-3.5 rounded border-Card_border text-Secondary focus:ring-Secondary focus:ring-offset-0 cursor-pointer"
                            />
                            <span className={row.primaryId === position.id ? "text-Secondary font-medium" : "text-Primary"}>
                              {position.display_name}
                            </span>
                          </label>
                        ))}
                        {row.primaryId && (
                          <button
                            type="button"
                            onClick={() => handlePrimaryToggle(row.rowId, row.primaryId)}
                            className="text-[10px] text-red-500 hover:text-red-700 transition-colors"
                          >
                            <i className="fas fa-times text-[9px] ml-1" />
                            لغو اصلی
                          </button>
                        )}
                        {!row.primaryId && selectedPositions.length > 0 && (
                          <span className="text-[10px] text-Muted">(هیچکدام اصلی نیست)</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex-shrink-0 mt-4 space-y-3">
              <button
                type="button"
                onClick={handleAddRow}
                disabled={submitting}
                className="w-full h-10 rounded-lg border border-dashed border-Secondary text-Secondary text-sm font-medium hover:bg-Secondary/5 transition-colors disabled:opacity-40"
              >
                <i className="fa-solid fa-plus text-xs ml-1.5" />
                افزودن کاربر جدید
              </button>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="flex-1 h-10 rounded-lg bg-Secondary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? "در حال ارسال..." : "تایید نهایی"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 h-10 rounded-lg border border-Card_border text-Primary text-sm font-medium hover:bg-Input_bg transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// ======== کامپوننت اصلی جدول کاربران ========
const UsersTable = ({
  users,
  usersLoading,
  usersError,
  getPositionName,
  title = "کاربران",
  showPositions = true,
  onAddUserPositionSuccess,
  onPositionDeleted,
}) => {
  const dispatch = useDispatch();
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: null,
    positionId: null,
    positionName: "",
    userName: "",
  });
  const [deleting, setDeleting] = useState(false);

  const handleDeletePosition = async () => {
    if (!deleteModal.positionId) return;
    
    setDeleting(true);
    try {
      await dispatch(unassignPositionsThunk([deleteModal.positionId])).unwrap();
      await dispatch(getUsersPositionThunk()).unwrap();
      onPositionDeleted?.();
      setDeleteModal({ 
        isOpen: false, 
        userId: null, 
        positionId: null, 
        positionName: "", 
        userName: "" 
      });
    } catch (error) {
      console.error("خطا در حذف سمت:", error);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (userId, positionId, positionName, userName) => {
    setDeleteModal({
      isOpen: true,
      userId,
      positionId,
      positionName,
      userName,
    });
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setDeleteModal({ 
        isOpen: false, 
        userId: null, 
        positionId: null, 
        positionName: "", 
        userName: "" 
      });
    }
  };

  // محاسبه ارتفاع ثابت برای جلوگیری از پرش صفحه
  const hasData = users && users.length > 0;
  const showLoading = usersLoading && users.length === 0;
  const showError = !usersLoading && usersError;
  const showEmpty = !usersLoading && !usersError && !hasData;

  return (
    <>
      <style>{scrollbarStyles}</style>
      
      <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-Card_border">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-Primary">{title}</h3>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-Secondary text-white text-xs font-medium rounded-lg hover:bg-Secondary/90 transition-colors"
              >
                <i className="fas fa-user-plus text-[10px]" />
                افزودن سمت
              </button>

              <span className="text-xs text-Muted bg-Input_bg px-2 py-0.5 rounded-full flex-shrink-0">
                {users.length.toLocaleString("fa-IR")}
              </span>
            </div>
          </div>
        </div>

        {/* ارتفاع ثابت برای جلوگیری از پرش صفحه */}
        <div className="p-3 sm:p-4 min-h-[400px] relative">
          {/* لودینگ */}
          {showLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-Muted">در حال بارگذاری لیست کاربران...</span>
            </div>
          )}

          {/* خطا */}
          {showError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-red-500">
                <i className="fas fa-exclamation-circle ml-1" />
                {usersError?.message?.fa || "خطا در دریافت لیست کاربران"}
              </span>
            </div>
          )}

          {/* خالی */}
          {showEmpty && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-Muted">
                <i className="fas fa-inbox ml-1" />
                هیچ کاربری یافت نشد.
              </span>
            </div>
          )}

          {/* لیست کاربران - فقط زمانی که دیتا وجود دارد و لودینگ نیست */}
          {hasData && !usersLoading && (
            <>
              {/* ======== نمایش کارتی - موبایل ======== */}
              <div className="lg:hidden flex flex-col gap-4">
                {users.map((user) => {
                  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`;
                  const positions = user.positions || [];
                  const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;

                  return (
                    <div
                      key={user.id}
                      className="bg-Background border border-Card_border rounded-xl overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-Card_border">
                        <div className="w-10 h-10 rounded-full bg-Secondary/15 text-Secondary flex items-center justify-center font-medium text-sm flex-shrink-0">
                          {initials || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-Primary text-sm truncate">
                            {user.first_name || "—"} {user.last_name || ""}
                          </p>
                          <p className="text-xs text-Muted truncate">{user.username}</p>
                        </div>
                      </div>

                      <div className="divide-y divide-Card_border">
                        {USER_FIELDS.map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-xs text-Muted">{label}</span>
                            <span className="text-xs text-Primary font-medium">
                              {formatUserValue(key, user[key])}
                            </span>
                          </div>
                        ))}
                        {showPositions && (
                          <div className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-xs text-Muted">سمت‌ها</span>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {positions.length > 0 ? (
                                positions.map((pos) => (
                                  <span
                                    key={pos.id}
                                    className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                      pos.is_primary 
                                        ? "bg-Secondary text-white" 
                                        : "bg-Secondary/10 text-Secondary"
                                    }`}
                                  >
                                    {pos.display_name || getPositionName?.(pos.id) || "—"}
                                    {pos.is_primary && " (اصلی)"}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal(
                                          user.id, 
                                          pos.id, 
                                          pos.display_name || pos.id, 
                                          userName
                                        );
                                      }}
                                      className={`text-[10px] hover:text-red-500 transition-colors ${
                                        pos.is_primary ? "text-white/80 hover:text-white" : "text-Muted hover:text-red-500"
                                      }`}
                                    >
                                      <i className="fas fa-times" />
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-Muted">—</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ======== نمایش جدولی - دسکتاپ ======== */}
              <div className="hidden lg:block">
                <table className="w-full text-xs table-fixed">
                  <thead>
                    <tr className="border-b border-Card_border bg-Input_bg">
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-Muted">
                        <i className="fas fa-user ml-1" />
                        نام کاربری
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-Muted">
                        <i className="fas fa-id-card ml-1" />
                        نام و نام خانوادگی
                      </th>
                      {showPositions && (
                        <th className="px-3 py-2.5 text-right text-xs font-medium text-Muted">
                          <i className="fas fa-briefcase ml-1" />
                          سمت‌ها
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-Card_border">
                    {users.map((user) => {
                      const positions = user.positions || [];
                      const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;
                      
                      return (
                        <tr key={user.id} className="hover:bg-Input_bg transition-colors">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-Secondary/20 flex items-center justify-center text-Secondary text-xs font-medium flex-shrink-0">
                                {user.first_name?.[0] || user.username?.[0] || "?"}
                              </div>
                              <span className="text-xs text-Primary truncate">
                                {user.username || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs text-Primary truncate block">
                              {user.first_name || "—"} {user.last_name || ""}
                            </span>
                          </td>
                          {showPositions && (
                            <td className="px-3 py-2.5">
                              <div className="flex flex-wrap gap-1">
                                {positions.length > 0 ? (
                                  positions.map((pos) => (
                                    <span
                                      key={pos.id}
                                      className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                        pos.is_primary 
                                          ? "bg-Secondary text-white" 
                                          : "bg-Secondary/10 text-Secondary"
                                      }`}
                                    >
                                      {pos.display_name || getPositionName?.(pos.id) || "—"}
                                      {pos.is_primary && " (اصلی)"}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openDeleteModal(
                                            user.id, 
                                            pos.id, 
                                            pos.display_name || pos.id, 
                                            userName
                                          );
                                        }}
                                        className={`text-[10px] hover:text-red-500 transition-colors ${
                                          pos.is_primary ? "text-white/80 hover:text-white" : "text-Muted hover:text-red-500"
                                        }`}
                                      >
                                        <i className="fas fa-times" />
                                      </button>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-Muted">—</span>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* مودال افزودن سمت به کاربر */}
      {showAddModal && (
        <AddUserPositionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={onAddUserPositionSuccess}
        />
      )}

      {/* مودال تایید حذف */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeletePosition}
        positionName={deleteModal.positionName}
        userName={deleteModal.userName}
        deleting={deleting}
      />
    </>
  );
};

export default UsersTable;