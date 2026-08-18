// components/GoodsRoute.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateRouteThunk } from '../../../../features/production/goods/updateroute/updateroutethunk';
import { deleteRouteThunk } from '../../../../features/production/goods/deleteroute/deleteroutethunk';
import { getServiceSelectThunk } from '../../../../features/production/goods/serviceselect/serviceselectthunk';

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

const GoodsRoute = ({ goodsId, routes, onRouteChange }) => {
    const dispatch = useDispatch();
    const { loading: updateRouteLoading } = useSelector((state) => state.updateRoute);
    const { loading: deleteRouteLoading } = useSelector((state) => state.deleteRoute);
    const { services: serviceList, loading: serviceLoading, loaded: serviceLoaded } = useSelector((state) => state.serviceSelect);
    const [editingRouteId, setEditingRouteId] = useState(null);
    const [editingServiceId, setEditingServiceId] = useState('');
    const [editingOrder, setEditingOrder] = useState('');
    const [updateMessage, setUpdateMessage] = useState(null);
    const [deletingRouteId, setDeletingRouteId] = useState(null);

    useEffect(() => {
        if (!serviceLoaded && !serviceLoading) {
            dispatch(getServiceSelectThunk());
        }
    }, [dispatch, serviceLoaded, serviceLoading]);

    const sortedRoutes = routes
        ? [...routes].sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0))
        : [];

    if (sortedRoutes.length === 0) return null;

    const getRouteMessage = (err) => {
        if (!err) return 'خطا در به‌روزرسانی مسیر';
        if (typeof err === 'string') return err;
        if (err?.message?.fa) return err.message.fa;
        if (err?.fa) return err.fa;
        if (err?.detail) return err.detail;
        return 'خطا در به‌روزرسانی مسیر';
    };

    const startEditing = (route) => {
        setEditingRouteId(route.id);
        const matchedService = (serviceList || []).find((s) => s.display_name === route.service);
        setEditingServiceId(matchedService?.id || '');
        setEditingOrder(route.sequence_order?.toString() || '');
    };

    const cancelEditing = () => {
        setEditingRouteId(null);
        setEditingServiceId('');
        setEditingOrder('');
        setUpdateMessage(null);
    };

    const handleUpdateRoute = async (routeId) => {
        const currentRoute = routes.find(r => r.id === routeId);
        
        if (!currentRoute) {
            setUpdateMessage({ type: 'error', text: 'مسیر مورد نظر یافت نشد' });
            setTimeout(() => setUpdateMessage(null), 4000);
            return;
        }

        if (!editingServiceId) {
            setUpdateMessage({ type: 'error', text: 'لطفاً سرویس را انتخاب کنید' });
            setTimeout(() => setUpdateMessage(null), 4000);
            return;
        }

        if (!editingOrder || isNaN(editingOrder) || Number(editingOrder) < 1 || Number(editingOrder) > 3) {
            setUpdateMessage({ type: 'error', text: 'لطفاً شماره مرحله را بین 1 تا 3 انتخاب کنید' });
            setTimeout(() => setUpdateMessage(null), 4000);
            return;
        }

        try {
            await dispatch(updateRouteThunk({
                goodsId: goodsId,
                routeId: routeId,
                payload: {
                    service: editingServiceId,
                    sequence_order: Number(editingOrder),
                    updated_at: currentRoute.updated_at
                }
            })).unwrap();
            
            setUpdateMessage({ type: 'success', text: 'مسیر با موفقیت به‌روزرسانی شد' });
            setTimeout(() => setUpdateMessage(null), 4000);
            setEditingRouteId(null);
            setEditingServiceId('');
            setEditingOrder('');
            
            // فراخوانی تابع برای آپدیت لیست
            if (onRouteChange) {
                onRouteChange();
            }
        } catch (err) {
            console.error('خطا در به‌روزرسانی مسیر:', err);
            setUpdateMessage({ type: 'error', text: getRouteMessage(err) });
            setTimeout(() => setUpdateMessage(null), 4000);
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
            setTimeout(() => setUpdateMessage(null), 4000);
            
            // فراخوانی تابع برای آپدیت لیست
            if (onRouteChange) {
                onRouteChange();
            }
        } catch (err) {
            console.error('خطا در حذف مسیر:', err);
            setUpdateMessage({ type: 'error', text: getRouteMessage(err) });
            setTimeout(() => setUpdateMessage(null), 4000);
        } finally {
            setDeletingRouteId(null);
        }
    };

    const Message = ({ type, text }) => {
        if (!text) return null;
        
        const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation';
        
        return (
            <div className={`flex items-center justify-between p-2 rounded-lg border ${bgColor} mb-2`}>
                <div className="flex items-center gap-2">
                    <i className={`fa-solid ${icon}`} />
                    <span className="text-xs">{text}</span>
                </div>
                <button
                    type="button"
                    onClick={() => setUpdateMessage(null)}
                    className="text-current opacity-60 hover:opacity-100 transition-opacity"
                >
                    <i className="fa-solid fa-xmark text-xs" />
                </button>
            </div>
        );
    };

    return (
        <div className="border border-Card_border rounded-xl p-4">
            <SectionHeader icon="fa-solid fa-route" title="مسیر تولید" />

            {updateMessage && (
                <Message type={updateMessage.type} text={updateMessage.text} />
            )}

            {/* دسکتاپ - جدول */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-Card_border bg-Input_bg">
                            <th className="px-3 py-2 text-center font-medium text-Muted">#</th>
                            <th className="px-3 py-2 text-center font-medium text-Muted">مرحله تولید</th>
                            <th className="px-3 py-2 text-center font-medium text-Muted">سرویس</th>
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
                                            <span className="text-Muted">تاریخ به‌روزرسانی</span>
                                            <span className="text-Primary">
                                                {formatDateTime(route.updated_at)}
                                            </span>
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
        </div>
    );
};

export default GoodsRoute;