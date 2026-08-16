// pages/Devices.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { getDevicesListThunk } from '../../features/production/devices/devicesthunk';
import { clearDevicesError } from '../../features/production/devices/devicesslice';

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
`;

const DEFAULT_FILTERS = {
  search: "",
  is_active: "",
  created_at: "",
  created_at__gte: "",
  created_at__lte: "",
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

const buildParams = (filters) => {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params[key] = value;
    }
  });
  return params;
};

// ======== کامپوننت کارت موبایل ========
const MobileRowCard = ({ item, index }) => {
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
        <div className="flex flex-col gap-0.5 items-start">
          <span className="text-Muted">کد دستگاه</span>
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

  return (
    <div className="flex flex-col gap-2 p-2 border-b border-Card_border bg-Input_bg/30">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <i className="fa-solid fa-magnifying-glass absolute top-1/2 -translate-y-1/2 right-2 text-Muted text-xs" />
          <input
            type="text"
            value={filters.search}
            onChange={handleField("search")}
            placeholder="جستجوی دستگاه..."
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
const Devices = () => {
  const dispatch = useDispatch();
  const { devices, loading, error, total } = useSelector((state) => state.devicesList);

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
    dispatch(getDevicesListThunk(params));
  }, [dispatch, JSON.stringify(params)]);

  useEffect(() => {
    const nextParams = filtersToSearchParams(debouncedFilters);
    setSearchParams(nextParams, { replace: true });
  }, [JSON.stringify(debouncedFilters)]);

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  // نمایش خطا از سرور
  const getErrorMessage = (err) => {
    if (!err) return 'خطا در دریافت اطلاعات';
    if (typeof err === 'string') return err;
    if (err?.fa) return err.fa;
    if (err?.en) return err.en;
    if (err?.message?.fa) return err.message.fa;
    if (err?.message?.en) return err.message.en;
    return 'خطا در دریافت اطلاعات';
  };

  return (
    <>
      <style>{scrollbarStyles}</style>

      <div className="w-full px-2 sm:px-4">
        <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
          {/* هدر */}
          <div className="flex items-center justify-between gap-2 px-3 pt-3">
            <h3 className="text-sm font-medium text-Primary">لیست دستگاه‌ها</h3>
            <div className="flex items-center gap-2">
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
          ) : devices.length === 0 ? (
            <div className="flex items-center justify-center h-[150px]">
              <span className="text-sm text-Muted">
                <i className="fa-solid fa-inbox ml-1" />
                هیچ دستگاهی یافت نشد.
              </span>
            </div>
          ) : (
            <>
              {/* کارت‌های موبایل */}
              <div className="flex flex-col gap-2 p-2 sm:hidden">
                {devices.map((item, index) => (
                  <MobileRowCard
                    key={item.id}
                    item={item}
                    index={index}
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
                  </colgroup>
                  <thead>
                    <tr className="border-b border-Card_border bg-Input_bg">
                      <th className="px-2 py-2 text-center font-medium text-Muted">#</th>
                      <th className="px-2 py-2 text-center font-medium text-Muted truncate">نام دستگاه</th>
                      <th className="px-2 py-2 text-center font-medium text-Muted truncate">کد دستگاه</th>
                      <th className="px-2 py-2 text-center font-medium text-Muted truncate">تاریخ ایجاد</th>
                      <th className="px-2 py-2 text-center font-medium text-Muted truncate">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-Card_border">
                    {devices.map((item, index) => (
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
                            {item.is_active !== false ? 'فعال' : 'غیرفعال'}
                          </span>
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
    </>
  );
};

export default Devices;