// pages/ProductionOrder.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import * as DatePickerModule from "react-multi-date-picker";
import * as persianModule from "react-date-object/calendars/persian";
import * as persian_faModule from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import { getOrderListThunk } from '../../features/production/productionorder/orderlist/orderlistthunk';
import { updateStatusThunk } from '../../features/production/productionorder/updatestatus/updatestatusthunk';
import { clearUpdateStatusState } from '../../features/production/productionorder/updatestatus/updatestatusslice';
import CreateProductionOrderModal from './CreateProductionOrderModal';

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

const formatDateToPersian = (dateString) => {
    if (!dateString) return "—";
    try {
        const parts = dateString.split(' ');
        const dateParts = parts[0].split('-');
        if (dateParts.length === 3) {
            return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        }
        return dateString;
    } catch {
        return dateString;
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

const MobileRowCard = React.memo(({ item, index, openTooltipId, setOpenTooltipId, onStatusChange, updatingStatus }) => {
    const showTooltip = openTooltipId === item.id;
    const infoTooltip = [
        `تاریخ ایجاد: ${formatDateToPersian(item.created_at)}`,
        `ایجاد شده توسط: ${item.created_by || "—"}`,
    ].join("\n");

    const handleToggleTooltip = (e) => {
        e.stopPropagation();
        setOpenTooltipId(showTooltip ? null : item.id);
    };

    const isUpdating = updatingStatus === item.id;
    const isCompleted = item.status === 'completed';

    return (
        <div className="rounded-lg border border-Card_border bg-Input_bg/40 p-3 flex flex-col gap-2" dir="rtl">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-Primary font-medium truncate">
                    {item.product || item.display_name || item.order_number || "—"}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-Muted">
                        {(index + 1).toLocaleString("fa-IR")}
                    </span>
                    <div className="relative" data-tooltip-root>
                        <i
                            className="fa-solid fa-circle-exclamation text-Muted hover:text-Primary transition-colors cursor-help text-xs"
                            onClick={handleToggleTooltip}
                            onMouseEnter={() => {
                                if (window.innerWidth > 640) {
                                    setOpenTooltipId(item.id);
                                }
                            }}
                            onMouseLeave={() => {
                                if (window.innerWidth > 640) {
                                    setOpenTooltipId(null);
                                }
                            }}
                        />
                        {showTooltip && (
                            <div className="absolute bottom-full left-0 mb-2 bg-Background border border-Card_border text-Primary text-[10px] rounded-lg px-3 py-2 whitespace-pre-line w-48 z-20 shadow-lg">
                                {infoTooltip}
                                <div className="absolute top-full left-2 border-4 border-transparent border-t-Card_border" />
                                <div className="absolute top-full left-2 -mt-[1px] border-[3px] border-transparent border-t-Background" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                <div className="flex flex-col gap-0.5 items-start">
                    <span className="text-Muted">شماره سفارش</span>
                    <span className="text-Primary font-mono text-right w-full">
                        {item.order_number || item.code || "—"}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5 items-start">
                    <span className="text-Muted">رنگ</span>
                    <span className="text-Primary text-right w-full">
                        {item.color || "—"}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5 items-start">
                    <span className="text-Muted">ورق</span>
                    <span className="text-Primary text-right w-full">
                        {item.sheet || "—"}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5 items-start">
                    <span className="text-Muted">تعداد</span>
                    <span className="text-Primary text-right w-full">
                        {item.order_qty || "—"}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5 items-start">
                    <span className="text-Muted">تاریخ ایجاد</span>
                    <span className="text-Muted text-right w-full">
                        {formatDateToPersian(item.created_at)}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5 items-start">
                    <span className="text-Muted">وضعیت</span>
                    <div className="flex items-center gap-1">
                        <select
                            value={item.status || 'pending'}
                            onChange={(e) => onStatusChange(item.id, e.target.value, item.updated_at)}
                            disabled={isUpdating || isCompleted}
                            className={`text-[10px] px-2 py-0.5 rounded-full border-0 outline-none cursor-pointer ${
                                isCompleted ? 'bg-green-100 text-green-700' :
                                item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                            } ${isUpdating ? 'opacity-50' : ''}`}
                        >
                            <option value="pending" className="bg-yellow-100 text-yellow-700">در انتظار</option>
                            <option value="in_progress" className="bg-blue-100 text-blue-700">در حال انجام</option>
                            <option value="completed" className="bg-green-100 text-green-700">تکمیل شده</option>
                        </select>
                        {isUpdating && (
                            <i className="fa-solid fa-spinner fa-spin text-xs text-Muted" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

MobileRowCard.displayName = 'MobileRowCard';

const FiltersBar = ({ filters, onChange, onReset }) => {
    const handleField = (key) => (e) => {
        const value = e.target.value;
        onChange({ ...filters, [key]: value, offset: 0 });
    };

    const handleSingleDate = (key) => (dateObject) => {
        onChange({ ...filters, [key]: formatDate(dateObject), offset: 0 });
    };

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
                <div className="relative flex-1 min-w-[160px]">
                    <i className="fa-solid fa-magnifying-glass absolute top-1/2 -translate-y-1/2 right-2 text-Muted text-xs" />
                    <input
                        type="text"
                        value={filters.search}
                        onChange={handleField("search")}
                        placeholder="جستجوی سفارش..."
                        className="w-full text-xs rounded-md border border-Card_border bg-Background pr-7 pl-2 py-1.5 text-Primary outline-none focus:border-Primary/50"
                    />
                </div>

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

const PaginationBar = React.memo(({ filters, onChange, totalCount }) => {
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
        <div className="flex-shrink-0 flex items-center justify-between gap-2 p-2 border-t border-Card_border bg-Background text-xs">
            <div className="flex items-center gap-2">
                <span className="text-Muted">تعداد در صفحه:</span>
                <select
                    value={limit}
                    onChange={changeLimit}
                    className="rounded-md border border-Card_border bg-Background px-2 py-1 text-Primary outline-none"
                >
                    {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                            {n.toLocaleString()}
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
                    صفحه {currentPage}
                    {totalPages > 0 ? ` از ${totalPages}` : ""}
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
});

PaginationBar.displayName = 'PaginationBar';

// ======== کامپوننت اصلی ========
const ProductionOrder = () => {
    const dispatch = useDispatch();
    const { orders = [], loading, error, total = 0 } = useSelector((state) => state.orderList || {});
    const { loading: updateLoading } = useSelector((state) => state.updateStatus || { loading: false });

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
        dispatch(getOrderListThunk(params));
    }, [dispatch, JSON.stringify(params)]);

    useEffect(() => {
        const nextParams = filtersToSearchParams(debouncedFilters);
        setSearchParams(nextParams, { replace: true });
    }, [JSON.stringify(debouncedFilters)]);

    const handleReset = () => setFilters(DEFAULT_FILTERS);

    const getErrorMessage = (err) => {
        if (typeof err === 'string') return err;
        if (err?.message?.fa) return err.message.fa;
        if (err?.fa) return err.fa;
        if (err?.detail) return err.detail;
        return 'خطا در دریافت اطلاعات';
    };

    const [openTooltipId, setOpenTooltipId] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [updateMessage, setUpdateMessage] = useState(null);
    const [messageVisible, setMessageVisible] = useState(false);

    useEffect(() => {
        if (openTooltipId === null) return;
        const handleClickOutside = (e) => {
            if (!e.target.closest('[data-tooltip-root]')) {
                setOpenTooltipId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openTooltipId]);

    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleCreateOrder = () => {
        setShowCreateModal(true);
    };

    const showMessage = (text, type = 'success') => {
        setUpdateMessage({ text, type });
        setMessageVisible(true);
        
        setTimeout(() => {
            setMessageVisible(false);
            setTimeout(() => {
                setUpdateMessage(null);
            }, 300);
        }, 4000);
    };

    const handleStatusChange = async (orderId, newStatus, updatedAt) => {
        const order = orders.find(o => o.id === orderId);
        if (!order || order.status === 'completed' || updatingStatus === orderId) return;

        setUpdatingStatus(orderId);
        
        try {
            await dispatch(updateStatusThunk({
                orderId: orderId,
                data: {
                    status: newStatus,
                    updated_at: updatedAt
                }
            })).unwrap();
            
            showMessage('وضعیت سفارش با موفقیت تغییر کرد', 'success');
            await dispatch(getOrderListThunk(params));
        } catch (err) {
            let errorText = 'خطا در تغییر وضعیت سفارش';
            if (err?.message?.fa) errorText = err.message.fa;
            else if (err?.fa) errorText = err.fa;
            else if (err?.detail) errorText = err.detail;
            else if (err?.message) errorText = err.message;
            else if (typeof err === 'string') errorText = err;
            
            showMessage(errorText, 'error');
            console.error('خطا در به‌روزرسانی وضعیت:', err);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const Message = () => {
        if (!updateMessage) return null;
        
        const bgColor = updateMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700';
        const icon = updateMessage.type === 'success' 
            ? 'fa-check-circle' 
            : 'fa-triangle-exclamation';
        
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

    return (
        <>
            <style>{scrollbarStyles}</style>

            <div className="w-full px-2 sm:px-4">
                <Message />

                <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-3">
                        <h3 className="text-sm font-medium text-Primary">لیست سفارشات</h3>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCreateOrder}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-Secondary text-white text-xs font-medium rounded-lg hover:bg-Secondary/90 transition-colors"
                            >
                                <i className="fas fa-plus text-[10px]" />
                                ساخت دستور تولید جدید
                            </button>
                            <span className="text-xs text-Muted bg-Input_bg px-2 py-0.5 rounded-full flex-shrink-0">
                                {total?.toLocaleString('fa-IR') || 0} مورد
                            </span>
                        </div>
                    </div>

                    <FiltersBar filters={filters} onChange={setFilters} onReset={handleReset} />

                    {loading && orders.length === 0 ? (
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
                    ) : orders.length === 0 ? (
                        <div className="flex items-center justify-center h-[300px] border-t border-Card_border">
                            <span className="text-sm text-Muted">
                                <i className="fa-solid fa-inbox ml-1" />
                                هیچ سفارشی یافت نشد.
                            </span>
                        </div>
                    ) : (
                        <div className={`transition-opacity duration-150 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex flex-col gap-2 p-2 lg:hidden">
                                {orders.map((item, index) => (
                                    <MobileRowCard
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        openTooltipId={openTooltipId}
                                        setOpenTooltipId={setOpenTooltipId}
                                        onStatusChange={handleStatusChange}
                                        updatingStatus={updatingStatus}
                                    />
                                ))}
                            </div>
                            <div className="lg:hidden">
                                <PaginationBar 
                                    filters={filters} 
                                    onChange={setFilters} 
                                    totalCount={total} 
                                />
                            </div>

                            <div className="hidden lg:flex lg:flex-col">
                                <div className="overflow-x-auto overflow-y-auto max-h-[380px]">
                                    <table className="w-full min-w-[1000px] text-xs">
                                        <thead className="sticky top-0 z-10">
                                            <tr className="border-b border-Card_border bg-Input_bg">
                                                <th className="px-3 py-2 text-center font-medium text-Muted">#</th>
                                                <th className="px-3 py-2 text-center font-medium text-Muted">کالا</th>
                                                <th className="px-3 py-2 text-center font-medium text-Muted">شماره سفارش</th>
                                                <th className="px-3 py-2 text-center font-medium text-Muted">رنگ</th>
                                                <th className="px-3 py-2 text-center font-medium text-Muted">ورق</th>
                                                <th className="px-3 py-2 text-center font-medium text-Muted">تعداد</th>
                                                <th className="px-3 py-2 text-center font-medium text-Muted">اولویت</th>
                                                <th className="px-3 py-2 text-center font-medium text-Muted">وضعیت</th>
                                                <th className="px-3 py-2 text-center font-medium text-Muted">اطلاعات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-Card_border">
                                            {orders.map((item, index) => {
                                                const infoTooltip = [
                                                    `تاریخ ایجاد: ${formatDateToPersian(item.created_at)}`,
                                                    `ایجاد شده توسط: ${item.created_by || "—"}`,
                                                ].join("\n");

                                                const isUpdating = updatingStatus === item.id;
                                                const isCompleted = item.status === 'completed';

                                                return (
                                                    <tr key={item.id} className="hover:bg-Input_bg/30 transition-colors">
                                                        <td className="px-3 py-2 text-center text-Muted">
                                                            {(index + 1).toLocaleString("fa-IR")}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-Primary">
                                                            {item.product || item.display_name || "—"}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-Primary font-mono">
                                                            {item.order_number || item.code || "—"}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-Primary">
                                                            {item.color || "—"}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-Primary">
                                                            {item.sheet || "—"}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-Primary">
                                                            {item.order_qty || "—"}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                                item.order_type === 'high' ? 'bg-red-100 text-red-700' :
                                                                item.order_type === 'normal' ? 'bg-green-100 text-green-700' :
                                                                item.order_type === 'low' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                {item.order_type === 'high' ? 'بالا' :
                                                                 item.order_type === 'normal' ? 'معمولی' :
                                                                 item.order_type === 'low' ? 'کم' :
                                                                 item.order_type || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <select
                                                                    value={item.status || 'pending'}
                                                                    onChange={(e) => handleStatusChange(item.id, e.target.value, item.updated_at)}
                                                                    disabled={isUpdating || isCompleted}
                                                                    className={`text-[10px] px-2 py-0.5 rounded-full border-0 outline-none cursor-pointer ${
                                                                        isCompleted ? 'bg-green-100 text-green-700' :
                                                                        item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                                    } ${isUpdating ? 'opacity-50' : ''}`}
                                                                >
                                                                    <option value="pending" className="bg-yellow-100 text-yellow-700">در انتظار</option>
                                                                    <option value="in_progress" className="bg-blue-100 text-blue-700">در حال انجام</option>
                                                                    <option value="completed" className="bg-green-100 text-green-700">تکمیل شده</option>
                                                                </select>
                                                                {isUpdating && (
                                                                    <i className="fa-solid fa-spinner fa-spin text-xs text-Muted" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <i
                                                                className="fa-solid fa-circle-exclamation text-Muted hover:text-Primary transition-colors cursor-help"
                                                                title={infoTooltip}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <PaginationBar 
                                    filters={filters} 
                                    onChange={setFilters} 
                                    totalCount={total} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <CreateProductionOrderModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    dispatch(getOrderListThunk(params));
                }}
            />
        </>
    );
};

export default ProductionOrder;