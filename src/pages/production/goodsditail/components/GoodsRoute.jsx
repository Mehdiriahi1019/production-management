// components/GoodsRoute.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateRouteThunk } from '../../../../features/production/goods/updateroute/updateroutethunk';
import { deleteRouteThunk } from '../../../../features/production/goods/deleteroute/deleteroutethunk';
import { addRouteThunk } from '../../../../features/production/goods/addroute/addroutethunk';
import { getServiceSelectThunk } from '../../../../features/production/goods/serviceselect/serviceselectthunk';

const TIME_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;

// کامپوننت ساده ورودی مدت زمان با فرمت HH:MM:SS
const DurationInput = ({ value, onChange, disabled, className }) => {
    const handleChange = (e) => {
        let val = e.target.value;
        val = val.replace(/[^0-9:]/g, '');
        
        if (val.length > 8) {
            val = val.slice(0, 8);
        }
        
        if (val.length === 2 && !val.includes(':')) {
            val = val + ':';
        } else if (val.length === 5 && !val.includes(':')) {
            val = val + ':';
        }
        
        onChange(val);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace') {
            const cursorPos = e.target.selectionStart;
            const val = e.target.value;
            
            if (cursorPos === 3 && val[2] === ':') {
                e.preventDefault();
                const newVal = val.slice(0, 2) + val.slice(3);
                onChange(newVal);
                e.target.setSelectionRange(2, 2);
            } else if (cursorPos === 6 && val[5] === ':') {
                e.preventDefault();
                const newVal = val.slice(0, 5) + val.slice(6);
                onChange(newVal);
                e.target.setSelectionRange(5, 5);
            }
        }
    };

    return (
        <input
            type="text"
            value={value || '00:00:00'}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={className}
            placeholder="00:00:00"
            maxLength="8"
            dir="ltr"
        />
    );
};

const SectionHeader = ({ icon, title }) => (
    <h4 className="flex items-center gap-2 text-xs font-medium text-Primary mb-3 border-b border-Card_border pb-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-Secondary/10 text-Secondary flex-shrink-0">
            <i className={`${icon} text-[11px]`} />
        </span>
        {title}
    </h4>
);

const RouteStepBadge = ({ order }) => (
    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-Secondary/10 text-Secondary text-[11px] font-semibold flex-shrink-0">
        {(order ?? 0).toLocaleString('fa-IR')}
    </span>
);

const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "—";
    if (dateTimeStr.includes(' ')) {
        const [date, time] = dateTimeStr.split(' ');
        return `${time} ${date}`;
    }
    return dateTimeStr;
};

const formatDuration = (timeStr) => {
    if (!timeStr || timeStr === '00:00:00') return '—';
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    
    let result = '';
    if (hours > 0) result += `${hours} ساعت `;
    if (minutes > 0) result += `${minutes} دقیقه `;
    if (seconds > 0) result += `${seconds} ثانیه`;
    if (result === '') return '—';
    return result.trim();
};

// ======== کامپوننت مودال افزودن مسیر ========
const AddRouteModal = ({ 
    isOpen, 
    onClose, 
    onAdd, 
    loading, 
    serviceList, 
    serviceLoading 
}) => {
    const [newServiceId, setNewServiceId] = useState('');
    const [newOrder, setNewOrder] = useState('');
    const [newProductionTime, setNewProductionTime] = useState('00:00:00');
    const modalRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleClose = () => {
        setNewServiceId('');
        setNewOrder('');
        setNewProductionTime('00:00:00');
        onClose();
    };

    const handleSubmit = () => {
        onAdd({
            serviceId: newServiceId,
            order: newOrder,
            productionTime: newProductionTime
        });
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div 
                ref={modalRef}
                className="w-full max-w-md rounded-xl border border-Card_border bg-Background shadow-lg p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4 border-b border-Card_border pb-3">
                    <h3 className="text-sm font-medium text-Primary">افزودن مسیر جدید</h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-Muted hover:text-Primary transition-colors"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-Muted">سرویس</label>
                        <select
                            value={newServiceId}
                            onChange={(e) => setNewServiceId(e.target.value)}
                            className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50"
                            disabled={loading}
                        >
                            <option value="">انتخاب سرویس</option>
                            {(serviceList || []).map((service) => (
                                <option key={service.id} value={service.id}>
                                    {service.display_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-Muted">مرحله تولید</label>
                        <select
                            value={newOrder}
                            onChange={(e) => setNewOrder(e.target.value)}
                            className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50"
                            disabled={loading}
                        >
                            <option value="">انتخاب مرحله</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-Muted">زمان تولید (مدت زمان)</label>
                        <DurationInput
                            value={newProductionTime}
                            onChange={setNewProductionTime}
                            disabled={loading}
                            className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50 font-mono text-center"
                        />
                        <span className="text-[10px] text-Muted">فرمت: HH:MM:SS (مثال: 00:20:30 برای 20 دقیقه و 30 ثانیه)</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || !newServiceId || !newOrder || newProductionTime === '00:00:00'}
                            className="flex-1 text-sm bg-Secondary text-white px-4 py-2 rounded-lg hover:bg-Secondary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin ml-1" />
                                    در حال افزودن...
                                </>
                            ) : (
                                'افزودن'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
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

const GoodsRoute = ({ goodsId, routes, onRouteChange }) => {
    const dispatch = useDispatch();
    const { loading: updateRouteLoading } = useSelector((state) => state.updateRoute);
    const { loading: deleteRouteLoading } = useSelector((state) => state.deleteRoute);
    const { loading: addRouteLoading } = useSelector((state) => state.addRoute);
    const { services: serviceList, loading: serviceLoading, loaded: serviceLoaded } = useSelector((state) => state.serviceSelect);
    const [editingRouteId, setEditingRouteId] = useState(null);
    const [editingServiceId, setEditingServiceId] = useState('');
    const [editingOrder, setEditingOrder] = useState('');
    const [editingProductionTime, setEditingProductionTime] = useState('00:00:00');
    const [updateMessage, setUpdateMessage] = useState(null);
    const [messageVisible, setMessageVisible] = useState(false);
    const [deletingRouteId, setDeletingRouteId] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (!serviceLoaded && !serviceLoading) {
            dispatch(getServiceSelectThunk());
        }
    }, [dispatch, serviceLoaded, serviceLoading]);

    const sortedRoutes = routes
        ? [...routes].sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0))
        : [];

    const getRouteMessage = (err) => {
        if (!err) return 'خطا در عملیات';
        if (typeof err === 'string') return err;
        if (err?.message?.fa) return err.message.fa;
        if (err?.fa) return err.fa;
        if (err?.detail) return err.detail;
        return 'خطا در عملیات';
    };

    const startEditing = (route) => {
        setEditingRouteId(route.id);
        const matchedService = (serviceList || []).find((s) => s.display_name === route.service);
        setEditingServiceId(matchedService?.id || '');
        setEditingOrder(route.sequence_order?.toString() || '');
        setEditingProductionTime(route.production_time_factor || '00:00:00');
    };

    const cancelEditing = () => {
        setEditingRouteId(null);
        setEditingServiceId('');
        setEditingOrder('');
        setEditingProductionTime('');
        setUpdateMessage(null);
    };

    const handleUpdateRoute = async (routeId) => {
        const currentRoute = routes.find(r => r.id === routeId);
        
        if (!currentRoute) {
            setUpdateMessage({ type: 'error', text: 'مسیر مورد نظر یافت نشد' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
            return;
        }

        if (!editingServiceId) {
            setUpdateMessage({ type: 'error', text: 'لطفاً سرویس را انتخاب کنید' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
            return;
        }

        if (!editingOrder || isNaN(editingOrder) || Number(editingOrder) < 1 || Number(editingOrder) > 3) {
            setUpdateMessage({ type: 'error', text: 'لطفاً شماره مرحله را بین 1 تا 3 انتخاب کنید' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
            return;
        }

        if (!editingProductionTime || editingProductionTime === '00:00:00') {
            setUpdateMessage({ type: 'error', text: 'لطفاً زمان تولید را وارد کنید' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
            return;
        }

        if (!TIME_REGEX.test(editingProductionTime)) {
            setUpdateMessage({ type: 'error', text: 'فرمت زمان باید HH:MM:SS باشد' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
            return;
        }

        try {
            await dispatch(updateRouteThunk({
                goodsId: goodsId,
                routeId: routeId,
                payload: {
                    service: editingServiceId,
                    sequence_order: Number(editingOrder),
                    production_time_factor: editingProductionTime,
                    updated_at: currentRoute.updated_at
                }
            })).unwrap();
            
            setUpdateMessage({ type: 'success', text: 'مسیر با موفقیت به‌روزرسانی شد' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => {
                    setUpdateMessage(null);
                    setEditingRouteId(null);
                    setEditingServiceId('');
                    setEditingOrder('');
                    setEditingProductionTime('');
                }, 300);
            }, 3000);
            
            if (onRouteChange) {
                onRouteChange();
            }
        } catch (err) {
            console.error('خطا در به‌روزرسانی مسیر:', err);
            setUpdateMessage({ type: 'error', text: getRouteMessage(err) });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
        }
    };

    const handleDeleteRoute = async (routeId) => {
        setDeletingRouteId(routeId);
        try {
            await dispatch(deleteRouteThunk({
                goodsId: goodsId,
                routeId: routeId
            })).unwrap();
            
            setUpdateMessage({ type: 'success', text: 'مسیر با موفقیت حذف شد' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 3000);
            
            if (onRouteChange) {
                onRouteChange();
            }
        } catch (err) {
            console.error('خطا در حذف مسیر:', err);
            setUpdateMessage({ type: 'error', text: getRouteMessage(err) });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
        } finally {
            setDeletingRouteId(null);
        }
    };

    const handleAddRoute = async (data) => {
        const { serviceId, order, productionTime } = data;

        if (!serviceId) {
            setUpdateMessage({ type: 'error', text: 'لطفاً سرویس را انتخاب کنید' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
            return;
        }

        if (!order || isNaN(order) || Number(order) < 1 || Number(order) > 3) {
            setUpdateMessage({ type: 'error', text: 'لطفاً شماره مرحله را بین 1 تا 3 انتخاب کنید' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
            return;
        }

        if (!productionTime || productionTime === '00:00:00') {
            setUpdateMessage({ type: 'error', text: 'لطفاً زمان تولید را وارد کنید' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
            return;
        }

        if (!TIME_REGEX.test(productionTime)) {
            setUpdateMessage({ type: 'error', text: 'فرمت زمان باید HH:MM:SS باشد' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
            return;
        }

        try {
            await dispatch(addRouteThunk({
                goodsId: goodsId,
                payload: {
                    service: serviceId,
                    sequence_order: Number(order),
                    production_time_factor: productionTime
                }
            })).unwrap();
            
            setUpdateMessage({ type: 'success', text: 'مسیر با موفقیت اضافه شد' });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 3000);
            
            if (onRouteChange) {
                onRouteChange();
            }
        } catch (err) {
            console.error('خطا در افزودن مسیر:', err);
            setUpdateMessage({ type: 'error', text: getRouteMessage(err) });
            setMessageVisible(true);
            setTimeout(() => {
                setMessageVisible(false);
                setTimeout(() => setUpdateMessage(null), 300);
            }, 4000);
        }
    };

    const Message = ({ type, text }) => {
        if (!text) return null;
        
        const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation';
        
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
                    <span className="text-xs">{text}</span>
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
        <div className="border border-Card_border rounded-xl p-4">
            <Message type={updateMessage?.type} text={updateMessage?.text} />

            <div className="flex items-center justify-between mb-3">
                <SectionHeader icon="fa-solid fa-route" title="مسیر تولید" />
                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1 text-xs text-Secondary hover:text-Secondary/80 transition-colors"
                >
                    <i className="fa-solid fa-plus text-[10px]" />
                    افزودن مسیر
                </button>
            </div>

            {/* دسکتاپ - جدول */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-Card_border bg-Input_bg">
                            <th className="px-3 py-2 text-center font-medium text-Muted">#</th>
                            <th className="px-3 py-2 text-center font-medium text-Muted">مرحله تولید</th>
                            <th className="px-3 py-2 text-center font-medium text-Muted">سرویس</th>
                            <th className="px-3 py-2 text-center font-medium text-Muted">زمان تولید</th>
                            <th className="px-3 py-2 text-center font-medium text-Muted">تاریخ ایجاد</th>
                            <th className="px-3 py-2 text-center font-medium text-Muted">ایجادکننده</th>
                            <th className="px-3 py-2 text-center font-medium text-Muted">به‌روزرسانی‌کننده</th>
                            <th className="px-3 py-2 text-center font-medium text-Muted">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-Card_border">
                        {sortedRoutes.map((route) => {
                            const isEditing = editingRouteId === route.id;
                            const isUpdating = isEditing && updateRouteLoading;
                            const isDeleting = deletingRouteId === route.id && deleteRouteLoading;

                            return (
                                <tr key={route.id} className="hover:bg-Input_bg/30 transition-colors">
                                    <td className="px-3 py-2 text-center text-Muted">
                                        {(route.sequence_order ?? 0).toLocaleString('fa-IR')}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        {isEditing ? (
                                            <select
                                                value={editingOrder}
                                                onChange={(e) => setEditingOrder(e.target.value)}
                                                className="w-12 text-center text-xs rounded-md border border-Card_border bg-Input_bg/40 px-1 py-1 text-Primary outline-none focus:border-Primary/50"
                                                disabled={isUpdating}
                                            >
                                                <option value="">انتخاب</option>
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                            </select>
                                        ) : (
                                            <RouteStepBadge order={route.sequence_order} />
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-center text-Primary font-medium">
                                        {isEditing ? (
                                            <select
                                                value={editingServiceId}
                                                onChange={(e) => setEditingServiceId(e.target.value)}
                                                className="w-full text-center text-xs rounded-md border border-Card_border bg-Input_bg/40 px-2 py-1 text-Primary outline-none focus:border-Primary/50"
                                                disabled={isUpdating || serviceLoading}
                                            >
                                                <option value="">
                                                    {serviceLoading ? 'در حال بارگذاری...' : 'انتخاب سرویس'}
                                                </option>
                                                {(serviceList || []).map((service) => (
                                                    <option key={service.id} value={service.id}>
                                                        {service.display_name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            route.service
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-center text-Muted">
                                        {isEditing ? (
                                            <DurationInput
                                                value={editingProductionTime}
                                                onChange={setEditingProductionTime}
                                                disabled={isUpdating}
                                                className="w-20 text-center text-xs rounded-md border border-Card_border bg-Input_bg/40 px-1 py-1 text-Primary outline-none focus:border-Primary/50 font-mono"
                                            />
                                        ) : (
                                            formatDuration(route.production_time_factor) || "—"
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-center text-Muted">
                                        {formatDateTime(route.created_at)}
                                    </td>
                                    <td className="px-3 py-2 text-center text-Muted">
                                        {route.created_by || "—"}
                                    </td>
                                    <td className="px-3 py-2 text-center text-Muted">
                                        {route.updated_by || "—"}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        {isEditing ? (
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateRoute(route.id)}
                                                    disabled={isUpdating}
                                                    className="text-xs bg-Secondary text-white px-2 py-1 rounded-md hover:bg-Secondary/90 transition-colors disabled:opacity-50"
                                                >
                                                    {isUpdating ? (
                                                        <i className="fa-solid fa-spinner fa-spin" />
                                                    ) : (
                                                        'ذخیره'
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelEditing}
                                                    disabled={isUpdating}
                                                    className="text-xs border border-Card_border px-2 py-1 rounded-md text-Muted hover:bg-Input_bg transition-colors disabled:opacity-50"
                                                >
                                                    انصراف
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(route)}
                                                    className="text-Muted hover:text-Primary transition-colors"
                                                >
                                                    <i className="fa-solid fa-pen text-xs" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteRoute(route.id)}
                                                    disabled={isDeleting}
                                                    className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                >
                                                    {isDeleting ? (
                                                        <i className="fa-solid fa-spinner fa-spin text-xs" />
                                                    ) : (
                                                        <i className="fa-solid fa-trash-can text-xs" />
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* موبایل - کارت */}
            <div className="sm:hidden flex flex-col gap-2">
                {sortedRoutes.map((route) => {
                    const isEditing = editingRouteId === route.id;
                    const isUpdating = isEditing && updateRouteLoading;
                    const isDeleting = deletingRouteId === route.id && deleteRouteLoading;

                    return (
                        <div
                            key={route.id}
                            className={`rounded-lg border border-Card_border bg-Input_bg/40 p-3 flex flex-col gap-2 ${isDeleting ? 'opacity-50' : ''}`}
                        >
                            {isEditing ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-Muted">مرحله:</span>
                                        <select
                                            value={editingOrder}
                                            onChange={(e) => setEditingOrder(e.target.value)}
                                            className="w-16 text-center text-xs rounded-md border border-Card_border bg-Input_bg/40 px-1 py-1 text-Primary outline-none focus:border-Primary/50"
                                            disabled={isUpdating}
                                        >
                                            <option value="">انتخاب</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-Muted">سرویس:</span>
                                        <select
                                            value={editingServiceId}
                                            onChange={(e) => setEditingServiceId(e.target.value)}
                                            className="flex-1 text-xs rounded-md border border-Card_border bg-Input_bg/40 px-2 py-1 text-Primary outline-none focus:border-Primary/50"
                                            disabled={isUpdating || serviceLoading}
                                        >
                                            <option value="">
                                                {serviceLoading ? 'در حال بارگذاری...' : 'انتخاب سرویس'}
                                            </option>
                                            {(serviceList || []).map((service) => (
                                                <option key={service.id} value={service.id}>
                                                    {service.display_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-Muted">زمان تولید:</span>
                                        <DurationInput
                                            value={editingProductionTime}
                                            onChange={setEditingProductionTime}
                                            disabled={isUpdating}
                                            className="flex-1 text-xs rounded-md border border-Card_border bg-Input_bg/40 px-2 py-1 text-Primary outline-none focus:border-Primary/50 font-mono text-center"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateRoute(route.id)}
                                            disabled={isUpdating}
                                            className="flex-1 text-xs bg-Secondary text-white px-2 py-1 rounded-md hover:bg-Secondary/90 transition-colors disabled:opacity-50"
                                        >
                                            {isUpdating ? (
                                                <i className="fa-solid fa-spinner fa-spin" />
                                            ) : (
                                                'ذخیره'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEditing}
                                            disabled={isUpdating}
                                            className="flex-1 text-xs border border-Card_border px-2 py-1 rounded-md text-Muted hover:bg-Input_bg transition-colors disabled:opacity-50"
                                        >
                                            انصراف
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <RouteStepBadge order={route.sequence_order} />
                                        <span className="text-sm text-Primary font-medium">
                                            {route.service}
                                        </span>
                                        <div className="mr-auto flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => startEditing(route)}
                                                className="text-Muted hover:text-Primary transition-colors"
                                            >
                                                <i className="fa-solid fa-pen text-xs" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteRoute(route.id)}
                                                disabled={isDeleting}
                                                className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                            >
                                                {isDeleting ? (
                                                    <i className="fa-solid fa-spinner fa-spin text-xs" />
                                                ) : (
                                                    <i className="fa-solid fa-trash-can text-xs" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-Muted">زمان تولید</span>
                                            <span className="text-Primary">
                                                {formatDuration(route.production_time_factor) || "—"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-Muted">تاریخ ایجاد</span>
                                            <span className="text-Primary">
                                                {formatDateTime(route.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-Muted">ایجادکننده</span>
                                            <span className="text-Primary">{route.created_by || "—"}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-Muted">به‌روزرسانی‌کننده</span>
                                            <span className="text-Primary">{route.updated_by || "—"}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* مودال افزودن مسیر */}
            <AddRouteModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddRoute}
                loading={addRouteLoading}
                serviceList={serviceList}
                serviceLoading={serviceLoading}
            />
        </div>
    );
};

export default GoodsRoute;