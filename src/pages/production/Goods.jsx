// pages/Goods.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import * as DatePickerModule from "react-multi-date-picker";
import * as persianModule from "react-date-object/calendars/persian";
import * as persian_faModule from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import { getGoodsListThunk } from '../../features/production/goods/goodslist/goodslistthunk';
import { getTemplateThunk } from '../../features/production/goods/template/templatethunk';
import { uploadGoodsThunk } from '../../features/production/goods/uploade/uploadethunk';
import { clearUploadStatus } from '../../features/production/goods/uploade/uploadeslice';
import { createGoodsThunk } from '../../features/production/goods/creategoods/creategoodsthunk';
import { clearCreateGoodsStatus } from '../../features/production/goods/creategoods/creategoodsslice';
import { getServiceSelectThunk } from '../../features/production/goods/serviceselect/serviceselectthunk';

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

const MobileCard = React.memo(({ item, index, openTooltipId, setOpenTooltipId }) => {
    const showTooltip = openTooltipId === item.id;
    const infoTooltip = [
        `تاریخ ایجاد: ${item.created_at || "—"}`,
        `ایجاد شده توسط: ${item.created_by || "—"}`,
        `تاریخ به‌روزرسانی: ${item.updated_at || "—"}`,
        `به‌روزرسانی شده توسط: ${item.updated_by || "—"}`,
    ].join("\n");

    const handleToggleTooltip = (e) => {
        e.stopPropagation();
        setOpenTooltipId(showTooltip ? null : item.id);
    };

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
                    <Link
                        to={`/productionpage/goods/goodsditail/${item.id}`}
                        className="text-Muted hover:text-Primary transition-colors"
                        aria-label="ویرایش"
                    >
                        <i className="fa-solid fa-pen text-xs" />
                    </Link>
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
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.is_active !== false
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {item.is_active !== false ? 'فعال' : 'غیرفعال'}
                    </span>
                </div>
            </div>
        </div>
    );
});

MobileCard.displayName = 'MobileCard';

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

const CreateGoodsModal = ({
    modalRef,
    createMessage,
    setCreateMessage,
    newGoods,
    setNewGoods,
    createLoading,
    fileInputRef,
    selectedFiles,
    handleFileSelect,
    removeFile,
    goodsRoutes,
    handleAddRoute,
    handleRouteChange,
    handleRemoveRoute,
    serviceList,
    handleCreateGoods,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div
                ref={modalRef}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-Card_border bg-Background shadow-lg p-6"
            >
                <div className="flex items-center justify-between mb-4 border-b border-Card_border pb-3">
                    <h3 className="text-sm font-medium text-Primary">ایجاد کالا</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-Muted hover:text-Primary transition-colors"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                {createMessage && (
                    <div className={`flex items-center justify-between p-2 rounded-lg border mb-4 ${createMessage.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                        <div className="flex items-center gap-2">
                            <i className={`fa-solid ${createMessage.type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation'}`} />
                            <span className="text-xs">{createMessage.text}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCreateMessage(null)}
                            className="text-current opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <i className="fa-solid fa-xmark text-xs" />
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] text-Muted">نام کالا *</label>
                            <input
                                type="text"
                                value={newGoods.display_name}
                                onChange={(e) => setNewGoods({ ...newGoods, display_name: e.target.value })}
                                className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50"
                                disabled={createLoading}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] text-Muted">عنوان</label>
                            <input
                                type="text"
                                value={newGoods.title}
                                onChange={(e) => setNewGoods({ ...newGoods, title: e.target.value })}
                                className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50"
                                disabled={createLoading}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] text-Muted">کد تکنیکال *</label>
                            <input
                                type="text"
                                value={newGoods.sn_code}
                                onChange={(e) => setNewGoods({ ...newGoods, sn_code: e.target.value })}
                                className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50"
                                disabled={createLoading}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] text-Muted">کد انبار</label>
                            <input
                                type="text"
                                value={newGoods.warehouse_code}
                                onChange={(e) => setNewGoods({ ...newGoods, warehouse_code: e.target.value })}
                                className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50"
                                disabled={createLoading}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-Muted">زمان تولید (مدت زمان ساخت)</label>
                        <input
                            type="text"
                            value={newGoods.production_time_factor || "00:00:00"}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9:]/g, '');
                                setNewGoods({ ...newGoods, production_time_factor: value })
                            }}
                            placeholder="HH:MM:SS"
                            className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50"
                            disabled={createLoading}
                        />
                        <span className="text-[10px] text-Muted">فرمت: ساعت:دقیقه:ثانیه (مثال: 00:25:30)</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-Muted">فایل ها</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="text-xs text-Muted file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-Secondary file:text-white hover:file:bg-Secondary/90"
                            disabled={createLoading}
                        />
                        {selectedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center gap-1 bg-Input_bg px-2 py-1 rounded-md">
                                        <span className="text-[10px] text-Primary">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <i className="fa-solid fa-xmark text-xs" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] text-Muted">مسیرهای تولید</label>
                            <button
                                type="button"
                                onClick={handleAddRoute}
                                className="text-xs text-Secondary hover:text-Secondary/80 transition-colors"
                                disabled={createLoading || goodsRoutes.length >= 3}
                            >
                                <i className="fa-solid fa-plus ml-1" />
                                افزودن مسیر
                            </button>
                        </div>
                        {goodsRoutes.length === 0 ? (
                            <div className="text-xs text-Muted text-center py-4 border border-dashed border-Card_border rounded-lg">
                                <i className="fa-solid fa-plus ml-1 text-[10px]" />
                                برای افزودن مسیر، دکمه "افزودن مسیر" را بزنید
                            </div>
                        ) : (
                            goodsRoutes.map((route, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <select
                                        value={route.service}
                                        onChange={(e) => handleRouteChange(index, 'service', e.target.value)}
                                        className="flex-1 text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50"
                                        disabled={createLoading}
                                    >
                                        <option value="">انتخاب سرویس</option>
                                        {(serviceList || []).map((service) => (
                                            <option key={service.id} value={service.id}>
                                                {service.display_name}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={route.sequence_order}
                                        onChange={(e) => handleRouteChange(index, 'sequence_order', Number(e.target.value))}
                                        className="w-20 text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50"
                                        disabled={createLoading}
                                        min="1"
                                        max="3"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRoute(index)}
                                        className="text-red-400 hover:text-red-600 transition-colors"
                                        disabled={createLoading || goodsRoutes.length <= 1}
                                    >
                                        <i className="fa-solid fa-trash-can text-xs" />
                                    </button>
                                </div>
                            ))
                        )}
                        {goodsRoutes.length >= 3 && (
                            <span className="text-[10px] text-Muted text-center">حداکثر ۳ مسیر می‌توانید اضافه کنید</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-Card_border">
                        <button
                            type="button"
                            onClick={handleCreateGoods}
                            disabled={createLoading}
                            className="flex-1 text-sm bg-Secondary text-white px-4 py-2 rounded-lg hover:bg-Secondary/90 transition-colors disabled:opacity-50"
                        >
                            {createLoading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin ml-1" />
                                    در حال ایجاد...
                                </>
                            ) : (
                                'ایجاد'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={createLoading}
                            className="flex-1 text-sm border border-Card_border px-4 py-2 rounded-lg text-Primary hover:bg-Input_bg transition-colors disabled:opacity-50"
                        >
                            انصراف
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Goods = () => {
    const dispatch = useDispatch();
    const { goods, loading, error, total } = useSelector((state) => state.goodsList);
    const { loading: uploadLoading, success: uploadSuccess, error: uploadError } = useSelector((state) => state.upload);
    const { loading: createLoading, success: createSuccess, error: createError } = useSelector((state) => state.createGoods);
    const { services: serviceList, loaded: serviceLoaded, loading: serviceLoading } = useSelector((state) => state.serviceSelect);

    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams));
    const [debouncedFilters, setDebouncedFilters] = useState(filters);
    const [openTooltipId, setOpenTooltipId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGoods, setNewGoods] = useState({
        display_name: '',
        title: '',
        sn_code: '',
        warehouse_code: '',
        production_time_factor: '00:00:00',
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [goodsRoutes, setGoodsRoutes] = useState([]);
    const [createMessage, setCreateMessage] = useState(null);
    const [uploadMessage, setUploadMessage] = useState(null);
    const fileInputRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        if (!serviceLoaded && !serviceLoading) {
            dispatch(getServiceSelectThunk());
        }
    }, [dispatch, serviceLoaded, serviceLoading]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
        }, 400);
        return () => clearTimeout(timer);
    }, [filters]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                setShowCreateModal(false);
                setCreateMessage(null);
            }
        };

        if (showCreateModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCreateModal]);

    const params = useMemo(() => buildParams(debouncedFilters), [debouncedFilters]);

    useEffect(() => {
        dispatch(getGoodsListThunk(params));
    }, [dispatch, JSON.stringify(params)]);

    useEffect(() => {
        const nextParams = filtersToSearchParams(debouncedFilters);
        setSearchParams(nextParams, { replace: true });
    }, [JSON.stringify(debouncedFilters)]);

    useEffect(() => {
        if (uploadSuccess) {
            setUploadMessage({ type: 'success', text: 'فایل با موفقیت آپلود شد' });
            setTimeout(() => {
                setUploadMessage(null);
                dispatch(clearUploadStatus());
                dispatch(getGoodsListThunk(params));
            }, 4000);
        }
    }, [uploadSuccess, dispatch, params]);

    useEffect(() => {
        if (uploadError) {
            let errorText = 'خطا در آپلود فایل';
            if (typeof uploadError === 'string') {
                errorText = uploadError;
            } else if (uploadError?.detail) {
                errorText = uploadError.detail;
            } else if (uploadError?.message) {
                errorText = typeof uploadError.message === 'string' ? uploadError.message : uploadError.message?.fa || uploadError.message?.en || 'خطا در آپلود فایل';
            }
            setUploadMessage({ type: 'error', text: errorText });
            setTimeout(() => {
                setUploadMessage(null);
                dispatch(clearUploadStatus());
            }, 4000);
        }
    }, [uploadError, dispatch]);

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

    useEffect(() => {
        if (createSuccess) {
            setCreateMessage({ type: 'success', text: 'کالا با موفقیت ایجاد شد' });
            setTimeout(() => {
                setCreateMessage(null);
                dispatch(clearCreateGoodsStatus());
                dispatch(getGoodsListThunk(params));
                setShowCreateModal(false);
                setNewGoods({
                    display_name: '',
                    title: '',
                    sn_code: '',
                    warehouse_code: '',
                    production_time_factor: '00:00:00',
                });
                setSelectedFiles([]);
                setGoodsRoutes([]);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }, 2000);
        }
    }, [createSuccess, dispatch, params]);

    useEffect(() => {
        if (createError) {
            let errorText = 'خطا در ایجاد کالا';
            if (typeof createError === 'string') {
                errorText = createError;
            } else if (createError?.detail) {
                errorText = createError.detail;
            } else if (createError?.message) {
                errorText = typeof createError.message === 'string' ? createError.message : createError.message?.fa || createError.message?.en || 'خطا در ایجاد کالا';
            }
            setCreateMessage({ type: 'error', text: errorText });
            setTimeout(() => {
                setCreateMessage(null);
            }, 4000);
        }
    }, [createError]);

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
                setUploadMessage({ type: 'error', text: 'لطفاً فایل اکسل (xlsx) انتخاب کنید' });
                setTimeout(() => setUploadMessage(null), 4000);
                e.target.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setUploadMessage({ type: 'error', text: 'حجم فایل نباید بیشتر از 5 مگابایت باشد' });
                setTimeout(() => setUploadMessage(null), 4000);
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

    const handleCreateGoods = async () => {
        if (!newGoods.display_name.trim()) {
            setCreateMessage({ type: 'error', text: 'لطفاً نام کالا را وارد کنید' });
            setTimeout(() => setCreateMessage(null), 4000);
            return;
        }

        if (!newGoods.sn_code.trim()) {
            setCreateMessage({ type: 'error', text: 'لطفاً کد تکنیکال را وارد کنید' });
            setTimeout(() => setCreateMessage(null), 4000);
            return;
        }

        if (goodsRoutes.length === 0) {
            setCreateMessage({ type: 'error', text: 'لطفاً حداقل یک مسیر تولید اضافه کنید' });
            setTimeout(() => setCreateMessage(null), 4000);
            return;
        }

        const invalidRoutes = goodsRoutes.some(r => !r.service);
        if (invalidRoutes) {
            setCreateMessage({ type: 'error', text: 'لطفاً برای همه مسیرها سرویس انتخاب کنید' });
            setTimeout(() => setCreateMessage(null), 4000);
            return;
        }

        try {
            await dispatch(createGoodsThunk({
                display_name: newGoods.display_name,
                title: newGoods.title || newGoods.display_name,
                sn_code: newGoods.sn_code,
                warehouse_code: newGoods.warehouse_code || '',
                production_time_factor: newGoods.production_time_factor || '00:00:00',
                files: selectedFiles,
                goods_routes: goodsRoutes
            })).unwrap();
        } catch (err) {
            console.error('خطا در ایجاد کالا:', err);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
        e.target.value = '';
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddRoute = () => {
        setGoodsRoutes(prev => [...prev, { service: '', sequence_order: prev.length + 1 }]);
    };

    const handleRouteChange = (index, field, value) => {
        setGoodsRoutes(prev => prev.map((route, i) =>
            i === index ? { ...route, [field]: value } : route
        ));
    };

    const handleRemoveRoute = (index) => {
        setGoodsRoutes(prev => prev.filter((_, i) => i !== index));
    };

    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setCreateMessage(null);
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
                    <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-3">
                        <h3 className="text-sm font-medium text-Primary">لیست کالاها</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
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

                    {uploadMessage && (
                        <div className="px-3 pb-2 pt-0">
                            <div className={`flex items-center gap-2 p-2 rounded-lg border ${uploadMessage.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                                }`}>
                                <i className={`fa-solid ${uploadMessage.type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation'}`} />
                                <span className="text-xs">{uploadMessage.text}</span>
                            </div>
                        </div>
                    )}

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

                    {loading && goods.length === 0 ? (
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
                        <div className={`transition-opacity duration-150 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex flex-col gap-2 p-2 lg:hidden">
                                {goods.map((item, index) => (
                                    <MobileCard
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        openTooltipId={openTooltipId}
                                        setOpenTooltipId={setOpenTooltipId}
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
                                    <table className="w-full min-w-[720px] text-xs">
                                        <thead className="sticky top-0 z-10">
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
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.is_active !== false
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {item.is_active !== false ? 'فعال' : 'غیرفعال'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Link
                                                                    to={`/productionpage/goods/goodsditail/${item.id}`}
                                                                    className="text-Muted hover:text-Primary transition-colors"
                                                                    aria-label="ویرایش"
                                                                >
                                                                    <i className="fa-solid fa-pen" />
                                                                </Link>
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

            {showCreateModal && (
                <CreateGoodsModal
                    modalRef={modalRef}
                    createMessage={createMessage}
                    setCreateMessage={setCreateMessage}
                    newGoods={newGoods}
                    setNewGoods={setNewGoods}
                    createLoading={createLoading}
                    fileInputRef={fileInputRef}
                    selectedFiles={selectedFiles}
                    handleFileSelect={handleFileSelect}
                    removeFile={removeFile}
                    goodsRoutes={goodsRoutes}
                    handleAddRoute={handleAddRoute}
                    handleRouteChange={handleRouteChange}
                    handleRemoveRoute={handleRemoveRoute}
                    serviceList={serviceList}
                    handleCreateGoods={handleCreateGoods}
                    onClose={handleCloseCreateModal}
                />
            )}
        </>
    );
};

export default Goods;