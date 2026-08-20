// pages/Paint.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import * as DatePickerModule from "react-multi-date-picker";
import * as persianModule from "react-date-object/calendars/persian";
import * as persian_faModule from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import { getPaintsListThunk } from '../../features/production/paints/paintslistthunk';
import { clearPaintsError } from '../../features/production/paints/paintslistslice';
import { createPaintThunk } from '../../features/production/paints/paintcreate/PaintCreateThunk';
import {getPaintDetailThunk} from '../../features/production/paints/paintditail/paintdetailthunk';
import { updatePaintThunk } from '../../features/production/paints/paintupdate/PaintUpdateThunk';
import { clearPaintDetail } from '../../features/production/paints/paintditail/paintdetailslice';

const unwrapModule = (mod) => {
  let current = mod;
  let guard = 0;
  while (
    current &&
    typeof current !== "function" &&
    current.default &&
    guard < 5
  ) {
    current = current.default;
    guard += 1;
  }
  return current;
};

const DatePicker = unwrapModule(DatePickerModule);
const persian = persianModule.default || persianModule;
const persian_fa = persian_faModule.default || persian_faModule;

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
  .thin-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #c4c4c4 transparent;
  }
  .rmdp-input-filter {
    width: 100% !important;
    font-size: 11px !important;
    border-radius: 6px !important;
    border: 1px solid #e2e2e2 !important;
    padding: 6px 8px !important;
    outline: none !important;
  }
`;

const DEFAULT_FILTERS = {
  search: "",
  is_active: "",
  created_at: "",
  created_at__gte: "",
  created_at__lte: "",
  created_at__range: "",
  ordering: "",
  limit: 20,
  offset: 0,
};

const NUMERIC_KEYS = ["limit", "offset"];

const filtersFromSearchParams = (searchParams) => {
  const result = { ...DEFAULT_FILTERS };
  Object.keys(DEFAULT_FILTERS).forEach((key) => {
    if (searchParams.has(key)) {
      const raw = searchParams.get(key);
      result[key] = NUMERIC_KEYS.includes(key) ? Number(raw) || 0 : raw;
    }
  });
  return result;
};

const filtersToSearchParams = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) return;
    if (key === "limit" && value === DEFAULT_FILTERS.limit) return;
    if (key === "offset" && value === 0) return;
    params.set(key, value);
  });
  return params;
};

const ORDERING_OPTIONS = [
  { value: "", label: "پیش‌فرض" },
  { value: "name", label: "بر اساس نام (صعودی)" },
  { value: "-name", label: "بر اساس نام (نزولی)" },
  { value: "created_at", label: "قدیمی‌ترین" },
  { value: "-created_at", label: "جدیدترین" },
  { value: "updated_at", label: "آخرین به‌روزرسانی (صعودی)" },
  { value: "-updated_at", label: "آخرین به‌روزرسانی (نزولی)" },
];

const DATE_FORMAT = "YYYY-MM-DD";

const formatDate = (dateObject) => {
  if (!dateObject) return "";
  try {
    return dateObject.format(DATE_FORMAT);
  } catch {
    return "";
  }
};

const buildParams = (filters) => {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params[key] = value;
    }
  });
  return params;
};

// ======== تابع استخراج پیام خطا دقیقاً از سرور ========
const extractErrorMessage = (err) => {
  if (!err) return "خطایی رخ داد";
  if (typeof err === "string") return err;
  if (err.fa) return err.fa;
  if (err.detail) return err.detail;
  if (err.message?.fa) return err.message.fa;

  const firstKey = Object.keys(err)[0];
  if (firstKey && Array.isArray(err[firstKey])) {
    return err[firstKey][0];
  }
  if (firstKey && typeof err[firstKey] === "string") {
    return err[firstKey];
  }

  return "خطایی رخ داد";
};

// ======== تابع نرمال‌سازی مقدار is_active به بولی واقعی ========
const toBoolActive = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true" || value === "1";
  return Boolean(value);
};

// ======== مودال جزئیات و ویرایش ========
// این مودال دیگه کل آیتم رو از جدول نمی‌گیره؛ فقط "itemId" رو می‌گیره
// و خودش با دیسپچ کردن getPaintDetailThunk(id) جزئیات رو از API جدا
// (اسلایس/تانک paintDetail) می‌گیره.
const DetailsEditModal = ({ itemId, isOpen, onClose, onSaved }) => {
  const dispatch = useDispatch();
  const {
    data: item,
    loading: detailLoading,
    error: detailError,
    saving: isSaving,
    saveError,
  } = useSelector((state) => state.paintDetail);

  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    display_name: "",
    code: "",
    is_active: true,
    updated_at: "",
  });

  // با باز شدن مودال (یا تغییر آیدی)، جزئیات رو از سرور بگیر
  useEffect(() => {
    if (isOpen && itemId) {
      setIsEditing(false);
      dispatch(getPaintDetailThunk(itemId));
    }
  }, [isOpen, itemId, dispatch]);

  // با بسته شدن مودال، دیتای قبلی رو پاک کن تا دفعه‌ی بعد چشمک نزنه
  useEffect(() => {
    if (!isOpen) {
      dispatch(clearPaintDetail());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (item) {
      setFormValues({
        display_name: item.display_name || item.name || "",
        code: item.code || "",
        is_active: toBoolActive(item.is_active),
        updated_at: item.updated_at || "",
      });
    }
  }, [item]);

  useEffect(() => {
    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (key) => (e) => {
    setFormValues((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleActiveToggle = () => {
    setFormValues((prev) => ({ ...prev, is_active: !prev.is_active }));
  };

  const handleSaveClick = async () => {
    if (!itemId) {
      return;
    }

    try {
      const result = await dispatch(
        updatePaintThunk({
          id: itemId,
          display_name: formValues.display_name,
          code: formValues.code,
          is_active: formValues.is_active,
          updated_at: formValues.updated_at,
        })
      ).unwrap();

      // رفرش جزئیات همین مودال تا مقادیر جدید درجا نمایش داده بشن
      dispatch(getPaintDetailThunk(itemId));

      onSaved?.();
      setIsEditing(false);
    } catch (err) {
      // خطا توسط slice مدیریت میشه
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-Card_border bg-Background shadow-lg max-h-[85vh] overflow-y-auto thin-scrollbar"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-Card_border">
          <h3 className="text-sm font-medium text-Primary">
            {isEditing ? "ویرایش رنگ" : "جزئیات رنگ"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-Muted hover:text-Primary transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {detailLoading ? (
          <div className="flex items-center justify-center h-[180px]">
            <span className="text-sm text-Muted">
              <i className="fa-solid fa-spinner fa-spin ml-1" />
              در حال بارگذاری جزئیات...
            </span>
          </div>
        ) : detailError ? (
          <div className="flex items-center justify-center h-[180px] px-4 text-center">
            <span className="text-sm text-red-500">
              <i className="fa-solid fa-triangle-exclamation ml-1" />
              {extractErrorMessage(detailError)}
            </span>
          </div>
        ) : item ? (
          <>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-Muted">نام</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formValues.display_name}
                    onChange={handleFieldChange("display_name")}
                    disabled={isSaving}
                    className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-2 py-1.5 text-Primary outline-none focus:border-Primary/50"
                  />
                ) : (
                  <span className="text-sm text-Primary">
                    {item.display_name || item.name || "—"}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-Muted">کد</span>
                {isEditing ? (
                  <input
                    type="text"
                    dir="ltr"
                    value={formValues.code}
                    onChange={handleFieldChange("code")}
                    disabled={isSaving}
                    className="w-full text-sm font-mono rounded-md border border-Card_border bg-Input_bg/40 px-2 py-1.5 text-Primary outline-none focus:border-Primary/50 text-left"
                  />
                ) : (
                  <span className="text-sm font-mono text-Primary" dir="ltr">
                    {item.code || "—"}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-Muted">وضعیت</span>
                {isEditing ? (
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={formValues.is_active}
                      onChange={handleActiveToggle}
                      disabled={isSaving}
                      className="w-4 h-4 rounded border-Card_border text-Secondary focus:ring-Secondary focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-Primary">
                      {formValues.is_active ? "فعال" : "غیرفعال"}
                    </span>
                  </label>
                ) : (
                  <span className={`text-[10px] w-fit px-2 py-0.5 rounded-full ${
                    toBoolActive(item.is_active)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {toBoolActive(item.is_active) ? 'فعال' : 'غیرفعال'}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-Muted">تاریخ ایجاد</span>
                <span className="text-sm text-Muted" >
                  {item.created_at || "—"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-Muted">ایجادکننده</span>
                <span className="text-sm text-Muted">
                  {item.created_by || "—"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-Muted">به‌روزرسانی‌کننده</span>
                <span className="text-sm text-Muted">
                  {item.updated_by || "—"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 px-4 py-3 border-t border-Card_border">
              {saveError && (
                <span className="text-xs text-red-500 text-center">
                  <i className="fa-solid fa-triangle-exclamation ml-1" />
                  {extractErrorMessage(saveError)}
                </span>
              )}
              <div className="flex items-center justify-end gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormValues({
                          display_name: item.display_name || item.name || "",
                          code: item.code || "",
                          is_active: toBoolActive(item.is_active),
                          updated_at: item.updated_at || "",
                        });
                      }}
                      disabled={isSaving}
                      className="text-xs rounded-md border border-Card_border px-3 py-1.5 text-Muted hover:bg-Input_bg transition-colors disabled:opacity-50"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveClick}
                      disabled={isSaving}
                      className="text-xs rounded-md bg-slate-600 px-3 py-1.5 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin ml-1" />
                          در حال ذخیره...
                        </>
                      ) : (
                        "ذخیره"
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs rounded-md border border-Card_border px-3 py-1.5 text-Primary hover:bg-Input_bg transition-colors"
                  >
                    <i className="fa-solid fa-pen ml-1" />
                    ویرایش
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[180px] px-4 text-center">
            <span className="text-sm text-Muted">رنگی یافت نشد</span>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// ======== مودال افزودن رنگ جدید ========
const AddPaintModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const rowIdCounter = useRef(1);
  const [rows, setRows] = useState([
    { rowId: 0, display_name: "", code: "" },
  ]);

  const updateRow = (rowId, changes) => {
    setRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, ...changes } : row))
    );
  };

  const handleAddRow = () => {
    rowIdCounter.current += 1;
    setRows((prev) => [
      ...prev,
      { rowId: rowIdCounter.current, display_name: "", code: "" },
    ]);
  };

  const handleRemoveRow = (rowId) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validRows = rows.filter(
      (r) => r.display_name.trim() && r.code.trim()
    );

    if (validRows.length === 0) {
      setError("لطفاً حداقل یک رنگ با نام و کد معتبر وارد کنید");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await Promise.all(
        validRows.map((row) =>
          dispatch(
            createPaintThunk({
              display_name: row.display_name.trim(),
              code: row.code.trim(),
            })
          ).unwrap()
        )
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

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
          <h4 className="text-sm font-medium text-Primary mb-4 flex-shrink-0">افزودن رنگ جدید</h4>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 thin-scrollbar">
              {rows.map((row, index) => (
                <div
                  key={row.rowId}
                  className="flex flex-col gap-2 border border-Card_border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-Muted">رنگ {index + 1}</span>
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
                      <label className="text-xs text-Muted">نام نمایشی</label>
                      <input
                        type="text"
                        value={row.display_name}
                        onChange={(e) => updateRow(row.rowId, { display_name: e.target.value })}
                        disabled={submitting}
                        placeholder="مثلاً رنگ کرم"
                        dir="rtl"
                        className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary outline-none focus:ring-1 focus:ring-Secondary placeholder:text-Muted/60"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-Muted">کد</label>
                      <input
                        type="text"
                        value={row.code}
                        onChange={(e) => updateRow(row.rowId, { code: e.target.value })}
                        disabled={submitting}
                        placeholder="مثلاً P"
                        dir="ltr"
                        className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary outline-none focus:ring-1 focus:ring-Secondary placeholder:text-Muted/60"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-shrink-0 mt-4 space-y-3">
              <button
                type="button"
                onClick={handleAddRow}
                disabled={submitting}
                className="w-full h-10 rounded-lg border border-dashed border-Secondary text-Secondary text-sm font-medium hover:bg-Secondary/5 transition-colors disabled:opacity-40"
              >
                <i className="fa-solid fa-plus text-xs ml-1.5" />
                افزودن رنگ جدید
              </button>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
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

// ======== کامپوننت کارت موبایل ========
const MobileRowCard = ({ item, index, onEditClick }) => {
  return (
    <div className="rounded-lg border border-Card_border bg-Input_bg/40 p-3 flex flex-col gap-2" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-Primary font-medium truncate">
          {item.display_name || item.name || "—"}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-Muted">
            {(index + 1).toLocaleString("fa-IR")}
          </span>
          <button
            type="button"
            onClick={() => onEditClick(item.id)}
            className="text-Muted hover:text-Primary transition-colors"
            aria-label="ویرایش"
          >
            <i className="fa-solid fa-pen text-xs" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
        <div className="flex flex-col gap-0.5 items-start">
          <span className="text-Muted">کد</span>
          <span className="text-Primary font-mono text-right w-full" dir="ltr">
            {item.code || "—"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 items-start">
          <span className="text-Muted">تاریخ ایجاد</span>
          <span className="text-Muted text-right w-full" dir="ltr">
            {item.created_at || "—"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 col-span-2 items-start">
          <span className="text-Muted">ایجادکننده</span>
          <span className="text-Muted">
            {item.created_by || "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

// ======== نوار فیلترها ========
const FiltersBar = ({ filters, onChange, onReset }) => {
  const handleField = (key) => (e) => {
    const value = e.target.value;
    onChange({ ...filters, [key]: value, offset: 0 });
  };

  const handleSingleDate = (key) => (dateObject) => {
    onChange({ ...filters, [key]: formatDate(dateObject), offset: 0 });
  };

  return (
    <div className="flex flex-col gap-2 p-2 border-b border-Card_border bg-Input_bg/30">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <i className="fa-solid fa-magnifying-glass absolute top-1/2 -translate-y-1/2 right-2 text-Muted text-xs" />
          <input
            type="text"
            value={filters.search}
            onChange={handleField("search")}
            placeholder="جستجوی رنگ..."
            className="w-full text-xs rounded-md border border-Card_border bg-Background pr-7 pl-2 py-1.5 text-Primary outline-none focus:border-Primary/50"
          />
        </div>

        <select
          value={filters.is_active}
          onChange={handleField("is_active")}
          className="text-xs rounded-md border border-Card_border bg-Background px-2 py-1.5 text-Primary outline-none"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>

        <select
          value={filters.ordering}
          onChange={handleField("ordering")}
          className="text-xs rounded-md border border-Card_border bg-Background px-2 py-1.5 text-Primary outline-none"
        >
          {ORDERING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onReset}
          className="text-xs rounded-md border border-Card_border px-2 py-1.5 text-Muted hover:text-Primary hover:bg-Input_bg transition-colors"
        >
          <i className="fa-solid fa-rotate-left ml-1" />
          پاک کردن فیلترها
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-0.5 w-32">
          <span className="text-[10px] text-Muted">تاریخ ایجاد</span>
          <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={filters.created_at}
            onChange={handleSingleDate("created_at")}
            inputClass="rmdp-input-filter"
            containerClassName="w-full"
            placeholder="1405-05-05"
            calendarPosition="bottom-right"
          />
        </div>

        <div className="flex flex-col gap-0.5 w-32">
          <span className="text-[10px] text-Muted">از تاریخ</span>
          <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={filters.created_at__gte}
            onChange={handleSingleDate("created_at__gte")}
            inputClass="rmdp-input-filter"
            containerClassName="w-full"
            placeholder="1405-05-01"
            calendarPosition="bottom-right"
          />
        </div>

        <div className="flex flex-col gap-0.5 w-32">
          <span className="text-[10px] text-Muted">تا تاریخ</span>
          <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={filters.created_at__lte}
            onChange={handleSingleDate("created_at__lte")}
            inputClass="rmdp-input-filter"
            containerClassName="w-full"
            placeholder="1405-05-16"
            calendarPosition="bottom-right"
          />
        </div>
      </div>
    </div>
  );
};

// ======== نوار صفحه‌بندی ========
const PaginationBar = ({ filters, onChange, totalCount }) => {
  const { limit, offset } = filters;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / limit)) : null;

  const goPrev = () => {
    onChange({ ...filters, offset: Math.max(0, offset - limit) });
  };
  const goNext = () => {
    onChange({ ...filters, offset: offset + limit });
  };
  const changeLimit = (e) => {
    onChange({ ...filters, limit: Number(e.target.value), offset: 0 });
  };

  return (
    <div className="flex items-center justify-between gap-2 p-2 border-t border-Card_border text-xs">
      <div className="flex items-center gap-2">
        <span className="text-Muted">تعداد در صفحه:</span>
        <select
          value={limit}
          onChange={changeLimit}
          className="rounded-md border border-Card_border bg-Background px-2 py-1 text-Primary outline-none"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n.toLocaleString("fa-IR")}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={offset === 0}
          className="rounded-md border border-Card_border px-2 py-1 text-Muted disabled:opacity-40 hover:bg-Input_bg transition-colors"
        >
          قبلی
        </button>
        <span className="text-Muted">
          صفحه {currentPage.toLocaleString("fa-IR")}
          {totalPages ? ` از ${totalPages.toLocaleString("fa-IR")}` : ""}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={totalPages ? currentPage >= totalPages : false}
          className="rounded-md border border-Card_border px-2 py-1 text-Muted disabled:opacity-40 hover:bg-Input_bg transition-colors"
        >
          بعدی
        </button>
      </div>
    </div>
  );
};

// ======== کامپوننت اصلی ========
const Paint = () => {
  const dispatch = useDispatch();
  const { paints, loading, error, total } = useSelector((state) => state.paintsList);

  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams));

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  const params = useMemo(() => buildParams(debouncedFilters), [debouncedFilters]);

  useEffect(() => {
    dispatch(getPaintsListThunk(params));
  }, [dispatch, JSON.stringify(params)]);

  useEffect(() => {
    const nextParams = filtersToSearchParams(debouncedFilters);
    setSearchParams(nextParams, { replace: true });
  }, [JSON.stringify(debouncedFilters)]);

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  // فقط آیدی نگه داشته میشه؛ خود مودال جزئیات کامل رو از API جدا می‌گیره
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (id) => {
    setSelectedItemId(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItemId(null);
  };

  const [showAddPaintModal, setShowAddPaintModal] = useState(false);

  // نمایش خطا از سرور
  const getErrorMessage = (err) => {
    if (typeof err === 'string') return err;
    if (err?.message?.fa) return err.message.fa;
    if (err?.fa) return err.fa;
    return 'خطا در دریافت اطلاعات';
  };

  return (
    <>
      <style>{scrollbarStyles}</style>

      <div className="w-full px-2 sm:px-4">
        <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
          {/* هدر */}
          <div className="flex items-center justify-between gap-2 px-3 pt-3">
            <h3 className="text-sm font-medium text-Primary">لیست رنگ‌ها</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddPaintModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-Secondary text-white text-xs font-medium rounded-lg hover:bg-Secondary/90 transition-colors"
              >
                <i className="fas fa-plus text-[10px]" />
                افزودن رنگ جدید
              </button>
              <span className="text-xs text-Muted bg-Input_bg px-2 py-0.5 rounded-full flex-shrink-0">
                {total?.toLocaleString('fa-IR') || 0} مورد
              </span>
            </div>
          </div>

          {/* فیلترها */}
          <FiltersBar filters={filters} onChange={setFilters} onReset={handleReset} />

          {/* لودینگ */}
          {loading ? (
            <div className="flex items-center justify-center h-[150px]">
              <span className="text-sm text-Muted">
                <i className="fa-solid fa-spinner fa-spin ml-1" />
                در حال بارگذاری...
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[150px]">
              <span className="text-sm text-red-500">
                <i className="fa-solid fa-triangle-exclamation ml-1" />
                {getErrorMessage(error)}
              </span>
            </div>
          ) : paints.length === 0 ? (
            <div className="flex items-center justify-center h-[150px]">
              <span className="text-sm text-Muted">
                <i className="fa-solid fa-inbox ml-1" />
                هیچ رنگی یافت نشد.
              </span>
            </div>
          ) : (
            <>
              {/* کارت‌های موبایل */}
              <div className="flex flex-col gap-2 p-2 sm:hidden">
                {paints.map((item, index) => (
                  <MobileRowCard
                    key={item.id}
                    item={item}
                    index={index}
                    onEditClick={handleOpenModal}
                  />
                ))}
              </div>

              {/* جدول دسکتاپ */}
              <div className="hidden sm:block thin-scrollbar">
                <table className="w-full text-xs table-fixed">
                  <colgroup>
                    <col className="w-8" />
                    <col className="w-[30%]" />
                    <col className="w-[18%]" />
                    <col className="w-[22%]" />
                    <col className="w-[15%]" />
                    <col className="w-10" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-Card_border bg-Input_bg">
                      <th className="px-2 py-2 text-center font-medium text-Muted">#</th>
                      <th className="px-2 py-2 text-center font-medium text-Muted truncate">نام</th>
                      <th className="px-2 py-2 text-center font-medium text-Muted truncate">کد</th>
                      <th className="px-2 py-2 text-center font-medium text-Muted truncate">تاریخ ایجاد</th>
                      <th className="px-2 py-2 text-center font-medium text-Muted truncate">وضعیت</th>
                      <th className="px-2 py-2 text-center font-medium text-Muted">ویرایش</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-Card_border">
                    {paints.map((item, index) => (
                      <tr key={item.id} className="hover:bg-Input_bg transition-colors">
                        <td className="px-2 py-2 text-center text-Muted">
                          {(index + 1).toLocaleString("fa-IR")}
                        </td>
                        <td className="px-2 py-2 text-center text-Primary font-medium truncate" title={item.display_name || item.name || ""}>
                          {item.display_name || item.name || "—"}
                        </td>
                        <td className="px-2 py-2 text-Primary text-center font-mono truncate" dir="ltr" title={item.code || ""}>
                          {item.code || "—"}
                        </td>
                        <td className="px-2 py-2 text-Muted text-center truncate flex-row-reverse" title={item.created_at || ""}>
                          {item.created_at || "—"}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            item.is_active !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {item.is_active === false ? 'غیرفعال' : 'فعال'}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(item.id)}
                            className="text-Muted hover:text-Primary transition-colors"
                            aria-label="ویرایش"
                          >
                            <i className="fa-solid fa-pen" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* صفحه‌بندی */}
              <PaginationBar filters={filters} onChange={setFilters} totalCount={total} />
            </>
          )}
        </div>
      </div>

      {/* مودال جزئیات و ویرایش */}
      <DetailsEditModal
        itemId={selectedItemId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSaved={() => dispatch(getPaintsListThunk(params))}
      />

      {/* مودال افزودن رنگ جدید */}
      {showAddPaintModal && (
        <AddPaintModal
          onClose={() => setShowAddPaintModal(false)}
          onSuccess={() => dispatch(getPaintsListThunk(params))}
        />
      )}
    </>
  );
};

export default Paint;