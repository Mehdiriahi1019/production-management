// pages/Goods.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import * as DatePickerModule from "react-multi-date-picker";
import * as persianModule from "react-date-object/calendars/persian";
import * as persian_faModule from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import { getGoodsListThunk } from '../../features/production/goods/goodslist/goodslistthunk';
import { getTemplateThunk } from '../../features/production/goods/template/templatethunk';
import { uploadGoodsThunk } from '../../features/production/goods/uploade/uploadethunk';
import { clearUploadStatus } from '../../features/production/goods/uploade/uploadeslice';

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

const datePickerStyles = `
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

// ======== کامپوننت کارت موبایل ========
const MobileCard = ({ item, index }) => {
    const infoTooltip = [
        `تاریخ ایجاد: ${item.created_at || "—"}`,
        `ایجاد شده توسط: ${item.created_by || "—"}`,
        `تاریخ به‌روزرسانی: ${item.updated_at || "—"}`,
        `به‌روزرسانی شده توسط: ${item.updated_by || "—"}`,
    ].join("\n");

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
                        className="text-Muted hover:text-Primary transition-colors"
                        aria-label="ویرایش"
                    >
                        <i className="fa-solid fa-pen text-xs" />
                    </button>
                    <i
                        className="fa-solid fa-circle-exclamation text-Muted hover:text-Primary transition-colors cursor-help text-xs"
                        title={infoTooltip}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                <div className="flex flex-col gap-0.5 items-start">
                    <span className="text-Muted">کد تکنیکال</span>
                    <span className="text-Primary font-mono text-right w-full" dir="ltr">
                        {item.sn_code || "—"}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5 items-start">
                    <span className="text-Muted">کد انبار</span>
                    <span className="text-Primary font-mono text-right w-full" dir="ltr">
                        {item.warehouse_code || "—"}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5 col-span-2 items-start">
                    <span className="text-Muted">وضعیت</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        item.is_active !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                    }`}>
                        {item.is_active !== false ? 'فعال' : 'غیرفعال'}
                    </span>
                </div>
            </div>
        </div>
    );
};

const Goods = () => {
    const dispatch = useDispatch();
    const { goods, loading, error, total } = useSelector((state) => state.goodsList);
    const { loading: uploadLoading, success: uploadSuccess, error: uploadError } = useSelector((state) => state.upload);

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
        dispatch(getGoodsListThunk(params));
    }, [dispatch, JSON.stringify(params)]);

    useEffect(() => {
        const nextParams = filtersToSearchParams(debouncedFilters);
        setSearchParams(nextParams, { replace: true });
    }, [JSON.stringify(debouncedFilters)]);

    useEffect(() => {
        if (uploadSuccess || uploadError) {
            const timer = setTimeout(() => {
                dispatch(clearUploadStatus());
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [uploadSuccess, uploadError, dispatch]);

    const handleReset = () => setFilters(DEFAULT_FILTERS);

    const handleDownloadTemplate = async () => {
        try {
            const response = await dispatch(getTemplateThunk()).unwrap();
            const url = window.URL.createObjectURL(
                new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            );
            const link = document.createElement('a');
            link.href = url;
            link.download = 'template_goods.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('خطا در دانلود تمپلیت:', error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ];
            if (!validTypes.includes(file.type)) {
                alert('لطفاً فایل اکسل (xlsx یا xls) انتخاب کنید');
                e.target.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('حجم فایل نباید بیشتر از 5 مگابایت باشد');
                e.target.value = '';
                return;
            }
            dispatch(uploadGoodsThunk(file));
        }
        e.target.value = '';
    };

    const handleField = (key) => (e) => {
        const value = e.target.value;
        setFilters({ ...filters, [key]: value, offset: 0 });
    };

    const handleSingleDate = (key) => (dateObject) => {
        setFilters({ ...filters, [key]: formatDate(dateObject), offset: 0 });
    };

    const getErrorMessage = (err) => {
        if (typeof err === 'string') return err;
        if (err?.message?.fa) return err.message.fa;
        if (err?.fa) return err.fa;
        if (err?.detail) return err.detail;
        return 'خطا در دریافت اطلاعات';
    };

    const currentPage = Math.floor(filters.offset / filters.limit) + 1;
    const totalPages = Number(total) > 0 ? Math.ceil(Number(total) / filters.limit) : 0;
    const hasNextPage = totalPages > 0
        ? currentPage < totalPages
        : goods.length === filters.limit;

    return (
        <>
            <style>{datePickerStyles}</style>

            <div className="w-full px-2 sm:px-4">
                <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
                    {/* هدر */}
                    <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-3">
                        <h3 className="text-sm font-medium text-Primary">لیست کالاها</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-Secondary text-white text-xs font-medium rounded-lg hover:bg-Secondary/90 transition-colors whitespace-nowrap"
                            >
                                <i className="fas fa-plus text-[10px]" />
                                افزودن کالا
                            </button>

                            <label className={`flex items-center gap-1.5 px-3 py-1.5 bg-Input_bg border border-Card_border text-Primary text-xs font-medium rounded-lg hover:bg-Input_bg/70 transition-colors cursor-pointer whitespace-nowrap ${uploadLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploadLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin text-[10px]" />
                                        در حال آپلود...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-file-excel text-[10px] text-green-600" />
                                        آپلود اکسل
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={uploadLoading}
                                />
                            </label>

                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-Input_bg border border-Card_border text-Primary text-xs font-medium rounded-lg hover:bg-Input_bg/70 transition-colors whitespace-nowrap"
                            >
                                <i className="fas fa-download text-[10px] text-blue-600" />
                                دریافت تمپلیت
                            </button>

                            <span className="text-xs text-Muted bg-Input_bg px-2 py-0.5 rounded-full flex-shrink-0">
                                {total?.toLocaleString('fa-IR') || 0} مورد
                            </span>
                        </div>
                    </div>

                    {/* فیلترها */}
                    <div className="flex flex-col gap-2 p-2 border-b border-Card_border bg-Input_bg/30">
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="relative flex-1 min-w-[160px]">
                                <i className="fa-solid fa-magnifying-glass absolute top-1/2 -translate-y-1/2 right-2 text-Muted text-xs" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={handleField("search")}
                                    placeholder="جستجوی کالا..."
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
                                onClick={handleReset}
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

                    {/* نمایش خطاها */}
                    {uploadError && (
                        <div className="px-3 pb-2 pt-2">
                            <span className="text-xs text-red-500">
                                <i className="fa-solid fa-triangle-exclamation ml-1" />
                                {typeof uploadError === 'string' ? uploadError : uploadError?.message || 'خطا در آپلود فایل'}
                            </span>
                        </div>
                    )}
                    {uploadSuccess && (
                        <div className="px-3 pb-2 pt-2">
                            <span className="text-xs text-green-500">
                                <i className="fa-solid fa-check-circle ml-1" />
                                فایل با موفقیت آپلود شد
                            </span>
                        </div>
                    )}

                    {/* لیست کالاها */}
                    {loading ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <span className="text-sm text-Muted">
                                <i className="fa-solid fa-spinner fa-spin ml-1" />
                                در حال بارگذاری...
                            </span>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <span className="text-sm text-red-500">
                                <i className="fa-solid fa-triangle-exclamation ml-1" />
                                {getErrorMessage(error)}
                            </span>
                        </div>
                    ) : goods.length === 0 ? (
                        <div className="flex items-center justify-center h-[300px] border-t border-Card_border">
                            <span className="text-sm text-Muted">
                                <i className="fa-solid fa-inbox ml-1" />
                                هیچ کالایی یافت نشد.
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* کارت‌های موبایل */}
                            <div className="flex flex-col gap-2 p-2 sm:hidden">
                                {goods.map((item, index) => (
                                    <MobileCard
                                        key={item.id}
                                        item={item}
                                        index={index}
                                    />
                                ))}
                            </div>

                            {/* جدول دسکتاپ */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-Card_border bg-Input_bg">
                                            <th className="px-3 py-2 text-center font-medium text-Muted">#</th>
                                            <th className="px-3 py-2 text-center font-medium text-Muted">نام</th>
                                            <th className="px-3 py-2 text-center font-medium text-Muted">کد تکنیکال</th>
                                            <th className="px-3 py-2 text-center font-medium text-Muted">کد انبار</th>
                                            <th className="px-3 py-2 text-center font-medium text-Muted">وضعیت</th>
                                            <th className="px-3 py-2 text-center font-medium text-Muted">ویرایش</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-Card_border">
                                        {goods.map((item, index) => {
                                            const infoTooltip = [
                                                `تاریخ ایجاد: ${item.created_at || "—"}`,
                                                `ایجاد شده توسط: ${item.created_by || "—"}`,
                                                `تاریخ به‌روزرسانی: ${item.updated_at || "—"}`,
                                                `به‌روزرسانی شده توسط: ${item.updated_by || "—"}`,
                                            ].join("\n");

                                            return (
                                                <tr key={item.id} className="hover:bg-Input_bg/30 transition-colors">
                                                    <td className="px-3 py-2 text-center text-Muted">
                                                        {(index + 1).toLocaleString("fa-IR")}
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-Primary">
                                                        {item.display_name || item.name || "—"}
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-Primary font-mono" dir="ltr">
                                                        {item.sn_code || "—"}
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-Primary font-mono" dir="ltr">
                                                        {item.warehouse_code || "—"}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                            item.is_active !== false
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {item.is_active !== false ? 'فعال' : 'غیرفعال'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                className="text-Muted hover:text-Primary transition-colors"
                                                                aria-label="ویرایش"
                                                            >
                                                                <i className="fa-solid fa-pen" />
                                                            </button>
                                                            <i
                                                                className="fa-solid fa-circle-exclamation text-Muted hover:text-Primary transition-colors cursor-help"
                                                                title={infoTooltip}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* صفحه‌بندی */}
                    {goods.length > 0 && (
                        <div className="flex items-center justify-between gap-2 p-2 border-t border-Card_border text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-Muted">تعداد در صفحه:</span>
                                <select
                                    value={filters.limit}
                                    onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value), offset: 0 })}
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
                                    onClick={() => setFilters({ ...filters, offset: Math.max(0, filters.offset - filters.limit) })}
                                    disabled={filters.offset === 0}
                                    className="rounded-md border border-Card_border px-2 py-1 text-Muted disabled:opacity-40 hover:bg-Input_bg transition-colors"
                                >
                                    قبلی
                                </button>
                                <span className="text-Muted">
                                    صفحه {currentPage}
                                    {totalPages > 0 ? ` از ${totalPages}` : ""}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setFilters({ ...filters, offset: filters.offset + filters.limit })}
                                    disabled={!hasNextPage}
                                    className="rounded-md border border-Card_border px-2 py-1 text-Muted disabled:opacity-40 hover:bg-Input_bg transition-colors"
                                >
                                    بعدی
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Goods;