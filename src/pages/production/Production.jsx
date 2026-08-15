import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import * as DatePickerModule from "react-multi-date-picker";
import * as persianModule from "react-date-object/calendars/persian";
import * as persian_faModule from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
// مسیر زیر رو با پروژه‌ی خودت تنظیم کن - حتماً باید به فایل serviceslistthunk ختم بشه
import { getServicesList } from "../../features/production/services/serviceslist/serviceslistthunk";
// مسیر زیر رو با پروژه‌ی خودت تنظیم کن - thunk/slice جدید جزئیات سرویس
import { getServiceDetail } from "../../features/production/services/serviceditails/serviceditailsthunk";
import { clearServiceDetail } from "../../features/production/services/serviceditails/serviceditailsslice";
import { updateService } from "../../features/production/services/serviceupdate/serviceupdatethunk";

// رفع مشکل interop بین CJS/ESM (باگ شناخته‌شده در Vite 8) که باعث میشه
// default export داخل چند لایه‌ی تودرتو بپیچه و ارور
// "Element type is invalid... got: object" بده.
// این تابع به‌صورت بازگشتی لایه‌های .default رو باز می‌کنه تا به یک function برسه.
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

// مقدار پیش‌فرض فیلترها
const DEFAULT_FILTERS = {
  search: "",
  is_active: "", // "" یعنی فیلتر نشده، "true" / "false"
  created_at: "",
  created_at__gte: "",
  created_at__lte: "",
  created_at__range: "", // "1405-05-01,1405-05-16"
  parent_id: "",
  ordering: "", // مثلا "created_at" یا "-created_at"
  limit: 20,
  offset: 0,
};

// کلیدهایی که عددی هستن و باید موقع خوندن از URL به Number تبدیل بشن
const NUMERIC_KEYS = ["limit", "offset"];

// خوندن فیلترها از URLSearchParams و ترکیب با مقادیر پیش‌فرض
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

// تبدیل فیلترها به URLSearchParams (فقط مقادیر غیرخالی، و limit/offset
// فقط وقتی از پیش‌فرض فرق داشته باشن تا URL شلوغ نشه)
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

// گزینه‌های مرتب‌سازی - در صورت نیاز فیلدهای دیگر رو اضافه کن
const ORDERING_OPTIONS = [
  { value: "", label: "پیش‌فرض" },
  { value: "created_at", label: "قدیمی‌ترین" },
  { value: "-created_at", label: "جدیدترین" },
  { value: "updated_at", label: "آخرین به‌روزرسانی (صعودی)" },
  { value: "-updated_at", label: "آخرین به‌روزرسانی (نزولی)" },
];

// فرمت مورد انتظار سرور: YYYY-MM-DD (جلالی)
const DATE_FORMAT = "YYYY-MM-DD";

// تبدیل یک DateObject به رشته‌ی قابل ارسال به سرور
const formatDate = (dateObject) => {
  if (!dateObject) return "";
  try {
    return dateObject.format(DATE_FORMAT);
  } catch {
    return "";
  }
};

// حذف کلیدهای خالی از آبجکت فیلتر قبل از ارسال به API
const buildParams = (filters) => {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params[key] = value;
    }
  });
  return params;
};

// ======== مودال جزئیات / ادیت آیتم ========
// این کامپوننت با createPortal داخل body رندر میشه تا هیچ overflow یا
// z-index والدی نتونه جلوی نمایش درستش رو بگیره (هم‌راستا با الگوی
// dropdown های portal-based که قبلاً توی پروژه استفاده کردی).
//
// برخلاف نسخه‌ی قبلی، این مودال دیگه کل آیتم رو از جدول نمی‌گیره؛
// فقط "itemId" رو می‌گیره و خودش با دیسپچ کردن getServiceDetail(id)
// جزئیات رو از API جدا (اسلایس/تانک serviceDetail) می‌گیره.
const DetailsEditModal = ({ itemId, isOpen, onClose, onSave }) => {
  const dispatch = useDispatch();
  const {
    data: detail,
    loading: detailLoading,
    error: detailError,
  } = useSelector((state) => state.serviceDetail);

  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    display_name: "",
    code: "",
    updated_at: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // با باز شدن مودال (یا تغییر آیدی)، جزئیات رو از سرور بگیر
  useEffect(() => {
    if (isOpen && itemId) {
      setIsEditing(false);
      dispatch(getServiceDetail(itemId));
    }
  }, [isOpen, itemId, dispatch]);

  // با بسته شدن مودال، دیتای قبلی رو پاک کن تا دفعه‌ی بعد چشمک نزنه
  useEffect(() => {
    if (!isOpen) {
      dispatch(clearServiceDetail());
    }
  }, [isOpen, dispatch]);

  // وقتی جزئیات از سرور رسید، فرم ادیت رو باهاش پر کن
  useEffect(() => {
    if (detail) {
      setFormValues({
        display_name: detail.display_name || "",
        code: detail.code || "",
        updated_at: detail.updated_at || "",
      });
    }
  }, [detail]);

  // جلوگیری از اسکرول پس‌زمینه وقتی مودال بازه
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

  const handleSaveClick = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(itemId, formValues);
      setIsEditing(false);
    } catch (err) {
      setSaveError(
        typeof err === "string" ? err : err?.fa || "خطا در ثبت ویرایش"
      );
    } finally {
      setIsSaving(false);
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
        {/* هدر مودال */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-Card_border">
          <h3 className="text-sm font-medium text-Primary">
            {isEditing ? "ویرایش سرویس" : "جزئیات سرویس"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-Muted hover:text-Primary transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* بدنه‌ی مودال */}
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
              {typeof detailError === "string"
                ? detailError
                : detailError?.fa || "خطا در دریافت جزئیات سرویس"}
            </span>
          </div>
        ) : detail ? (
          <>
            <div className="flex flex-col gap-3 p-4">
              {/* نام */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-Muted">نام</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formValues.display_name}
                    onChange={handleFieldChange("display_name")}
                    className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-2 py-1.5 text-Primary outline-none focus:border-Primary/50"
                  />
                ) : (
                  <span className="text-sm text-Primary">
                    {detail.display_name || "—"}
                  </span>
                )}
              </div>

              {/* کد */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-Muted">کد</span>
                {isEditing ? (
                  <input
                    type="text"
                    dir="ltr"
                    value={formValues.code}
                    onChange={handleFieldChange("code")}
                    className="w-full text-sm font-mono rounded-md border border-Card_border bg-Input_bg/40 px-2 py-1.5 text-Primary outline-none focus:border-Primary/50 text-left"
                  />
                ) : (
                  <span className="text-sm font-mono text-Primary" dir="ltr">
                    {detail.code || "—"}
                  </span>
                )}
              </div>

              {/* تاریخ ایجاد - فقط نمایشی */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-Muted">تاریخ ایجاد</span>
                <span className="text-sm text-Muted" dir="ltr">
                  {detail.created_at || "—"}
                </span>
              </div>

              

              {/* ایجادکننده - فقط نمایشی */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-Muted">ایجادکننده</span>
                <span className="text-sm text-Muted">
                  {detail.created_by || "—"}
                </span>
              </div>

              {/* به‌روزرسانی‌کننده - فقط نمایشی */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-Muted">به‌روزرسانی‌کننده</span>
                <span className="text-sm text-Muted">
                  {detail.updated_by || "—"}
                </span>
              </div>
            </div>

            {/* فوتر مودال */}
            <div className="flex flex-col gap-2 px-4 py-3 border-t border-Card_border">
              {saveError && (
                <span className="text-xs text-red-500 text-center">
                  <i className="fa-solid fa-triangle-exclamation ml-1" />
                  {saveError}
                </span>
              )}
              <div className="flex items-center justify-end gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
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
        ) : null}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// ======== کارت موبایل: هر آیتم یک کارت جدا ========
const MobileRowCard = ({ item, index, onEditClick }) => {
  return (
    <div className="rounded-lg border border-Card_border bg-Input_bg/40 p-3 flex flex-col gap-2" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-Primary font-medium truncate">
          {item.display_name || "—"}
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
    onChange({ ...filters, [key]: value, offset: 0 }); // با هر تغییر فیلتر، صفحه‌بندی ریست میشه
  };

  // انتخاب یک تاریخ تکی (created_at / gte / lte)
  const handleSingleDate = (key) => (dateObject) => {
    onChange({ ...filters, [key]: formatDate(dateObject), offset: 0 });
  };

  // انتخاب بازه‌ی تاریخ (created_at__range) -> "شروع,پایان"
  const handleRangeDate = (dateObjects) => {
    if (!dateObjects || dateObjects.length < 2) {
      onChange({ ...filters, created_at__range: "", offset: 0 });
      return;
    }
    const [start, end] = dateObjects;
    const rangeValue = `${formatDate(start)},${formatDate(end)}`;
    onChange({ ...filters, created_at__range: rangeValue, offset: 0 });
  };

  return (
    <div className="flex flex-col gap-2 p-2 border-b border-Card_border bg-Input_bg/30">
      <div className="flex flex-wrap gap-2 items-center">
        {/* سرچ */}
        <div className="relative flex-1 min-w-[160px]">
          <i className="fa-solid fa-magnifying-glass absolute top-1/2 -translate-y-1/2 right-2 text-Muted text-xs" />
          <input
            type="text"
            value={filters.search}
            onChange={handleField("search")}
            placeholder="جستجو..."
            className="w-full text-xs rounded-md border border-Card_border bg-Background pr-7 pl-2 py-1.5 text-Primary outline-none focus:border-Primary/50"
          />
        </div>

        {/* فعال/غیرفعال */}
        <select
          value={filters.is_active}
          onChange={handleField("is_active")}
          className="text-xs rounded-md border border-Card_border bg-Background px-2 py-1.5 text-Primary outline-none"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>

        {/* مرتب‌سازی */}
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


        {/* ریست فیلترها */}
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
        {/* تاریخ دقیق */}
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

        {/* از تاریخ */}
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

        {/* تا تاریخ */}
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

// ======== کامپوننت اصلی صفحه تولید ========
const Production = () => {
  const dispatch = useDispatch();
  const { data, loading, error, count } = useSelector((state) => state.servicesList);
  // توجه: اگر ردیوسر شما "count" رو برنمی‌گردونه، صفحه‌بندی همچنان با دکمه قبلی/بعدی کار می‌کنه
  // فقط شماره کل صفحات نمایش داده نمیشه.

  // خوندن/نوشتن فیلترها از/به query string آدرس (برای اینکه با رفرش پاک نشن)
  const [searchParams, setSearchParams] = useSearchParams();

  // مقدار اولیه‌ی فیلترها رو از URL می‌خونیم (فقط یک‌بار موقع mount)
  const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams));

  // دیبانس کردن فیلترها (به‌خصوص سرچ متنی) تا با هر تغییر درخواست نره
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  const params = useMemo(() => buildParams(debouncedFilters), [debouncedFilters]);

  useEffect(() => {
    dispatch(getServicesList(params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, JSON.stringify(params)]);

  // هر بار فیلترهای دیبانس‌شده تغییر کنن، URL هم به‌روز میشه (بدون اضافه شدن به تاریخچه‌ی مرورگر)
  useEffect(() => {
    const nextParams = filtersToSearchParams(debouncedFilters);
    setSearchParams(nextParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debouncedFilters)]);

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  // ===== وضعیت مودال جزئیات/ادیت =====
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

  // ارسال ویرایش به سرور - دقیقاً همون فرمتی که سرور برمی‌گردونه (بدون parent)
  const handleSaveEdit = async (id, formValues) => {
    await dispatch(
      updateService({
        id,
        display_name: formValues.display_name,
        code: formValues.code,
       
      })
    ).unwrap();

    // بعد از ذخیره‌ی موفق، هم جزئیات مودال و هم لیست جدول رو رفرش کن
    dispatch(getServiceDetail(id));
    dispatch(getServicesList(params));
  };

  return (
    <>
      <style>{scrollbarStyles}</style>

      <div className="w-full px-2 sm:px-4">
        {/* عنوان صفحه */}

        <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
          <FiltersBar filters={filters} onChange={setFilters} onReset={handleReset} />

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
                خطا در دریافت اطلاعات
              </span>
            </div>
          ) : (
            <>
              {/* ===== نمایش موبایل: هر آیتم یک کارت جدا ===== */}
              <div className="flex flex-col gap-2 p-2 sm:hidden">
                {(data || []).map((item, index) => (
                  <MobileRowCard
                    key={item.id}
                    item={item}
                    index={index}
                    onEditClick={handleOpenModal}
                  />
                ))}
              </div>

              {/* ===== نمایش دسکتاپ/تبلت: یک جدول واحد برای همه‌ی آیتم‌ها ===== */}
              <div className="hidden sm:block thin-scrollbar">
                <table className="w-full text-xs table-fixed">
                  <colgroup>
                    <col className="w-8" />
                    <col className="w-[30%]" />
                    <col className="w-[18%]" />
                    <col className="w-[22%]" />
                    <col className="w-[20%]" />
                    <col className="w-10" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-Card_border bg-Input_bg">
                      <th className="px-2 py-2  text-center font-medium text-Muted">#</th>
                      <th className="px-2 py-2  text-center font-medium text-Muted truncate">نام</th>
                      <th className="px-2 py-2  text-center font-medium text-Muted truncate">کد</th>
                      <th className="px-2 py-2  text-center font-medium text-Muted truncate">تاریخ ایجاد</th>
                      <th className="px-2 py-2  text-center font-medium text-Muted truncate">ایجادکننده</th>
                      <th className="px-2 py-2  text-center font-medium text-Muted">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-Card_border">
                    {(data || []).map((item, index) => (
                      <tr key={item.id} className="hover:bg-Input_bg transition-colors">
                        <td className="px-2 py-2 text-center text-Muted">
                          {(index + 1).toLocaleString("fa-IR")}
                        </td>
                        <td className="px-2 py-2 text-center text-Primary font-medium truncate" title={item.display_name || ""}>
                          {item.display_name || "—"}
                        </td>
                        <td className="px-2 py-2 text-Primary text-center font-mono truncate" dir="ltr" title={item.code || ""}>
                          {item.code || "—"}
                        </td>
                        <td className="px-2 py-2 text-Muted text-center truncate flex-row-reverse" title={item.created_at || ""}>
                          {item.created_at || "—"}
                        </td>
                        <td className="px-2 py-2 text-Muted text-center truncate" title={item.created_by || ""}>
                          {item.created_by || "—"}
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

              <PaginationBar filters={filters} onChange={setFilters} totalCount={count} />
            </>
          )}
        </div>
      </div>

      {/* پاپ‌آپ جزئیات / ادیت */}
      <DetailsEditModal
        itemId={selectedItemId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEdit}
      />
    </>
  );
};

export default Production;