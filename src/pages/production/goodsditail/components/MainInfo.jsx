// components/goodsditail/components/MainInfo.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateGoodsThunk } from '../../../../features/production/goods/goodsupdate/goodsupdatethunk';
import { clearGoodsUpdateStatus } from '../../../../features/production/goods/goodsupdate/goodsupdateslice';
import { getGoodsDitailThunk } from '../../../../features/production/goods/goodsditail/goodsditailthunk';

const SectionHeader = ({ icon, title }) => (
    <h4 className="flex items-center gap-2 text-xs font-medium text-Primary mb-3 border-b border-Card_border pb-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-Secondary/10 text-Secondary flex-shrink-0">
            <i className={`${icon} text-[11px]`} />
        </span>
        {title}
    </h4>
);

const StatusBadge = ({ active }) => (
    <span className={`inline-flex items-center gap-1.5 w-fit text-[10px] px-2 py-0.5 rounded-full ${
        active !== false
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
    }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${active !== false ? 'bg-green-500' : 'bg-red-500'}`} />
        {active !== false ? 'فعال' : 'غیرفعال'}
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

const Message = ({ type, text, onClose }) => {
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
                onClick={onClose}
                className="text-current opacity-60 hover:opacity-100 transition-opacity"
            >
                <i className="fa-solid fa-xmark text-xs" />
            </button>
        </div>
    );
};

const InfoField = ({ label, value, mono = false, editable = false, fieldKey, isEditing, formValues, onChange, disabled }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[11px] text-Muted">{label}</span>
        {editable && isEditing ? (
            <input
                type="text"
                value={formValues[fieldKey] || ''}
                onChange={onChange(fieldKey)}
                disabled={disabled}
                className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-2 py-1 text-Primary outline-none focus:border-Primary/50"
            />
        ) : (
            <span className={`text-sm text-Primary text-right ${mono ? 'font-mono' : 'font-medium'}`}>
                {value || "—"}
            </span>
        )}
    </div>
);

const MainInfo = ({ item, onUpdate }) => {
    const dispatch = useDispatch();
    const { loading: updateLoading, success: updateSuccess, error: updateError } = useSelector((state) => state.goodsUpdate);
    const [isEditing, setIsEditing] = useState(false);
    const [formValues, setFormValues] = useState({});
    const [updateMessage, setUpdateMessage] = useState(null);

    useEffect(() => {
        if (item) {
            setFormValues({
                display_name: item.display_name || '',
                title: item.title || '',
                sn_code: item.sn_code || '',
                warehouse_code: item.warehouse_code || '',
                updated_at: item.updated_at || '',
            });
        }
    }, [item]);

    useEffect(() => {
        if (updateSuccess) {
            setUpdateMessage({ type: 'success', text: 'اطلاعات با موفقیت به‌روزرسانی شد' });
            setTimeout(() => {
                setUpdateMessage(null);
                dispatch(clearGoodsUpdateStatus());
                dispatch(getGoodsDitailThunk(item.id));
                setIsEditing(false);
                if (onUpdate) onUpdate();
            }, 2000);
        }
    }, [updateSuccess, dispatch, item?.id, onUpdate]);

    useEffect(() => {
        if (updateError) {
            let errorText = 'خطا در به‌روزرسانی اطلاعات';
            
            if (typeof updateError === 'string') {
                errorText = updateError;
            } else if (updateError?.errors?.fa) {
                errorText = updateError.errors.fa;
            } else if (updateError?.errors) {
                const firstKey = Object.keys(updateError.errors)[0];
                if (firstKey) {
                    const firstError = updateError.errors[firstKey];
                    if (typeof firstError === 'string') {
                        errorText = firstError;
                    } else if (firstError?.fa) {
                        errorText = firstError.fa;
                    } else if (firstError?.en) {
                        errorText = firstError.en;
                    } else {
                        errorText = String(firstError);
                    }
                }
            } else if (updateError?.fa) {
                errorText = updateError.fa;
            } else if (updateError?.detail) {
                errorText = updateError.detail;
            } else if (updateError?.message) {
                errorText = typeof updateError.message === 'string' 
                    ? updateError.message 
                    : updateError.message?.fa || updateError.message?.en || 'خطا در به‌روزرسانی اطلاعات';
            }
            
            setUpdateMessage({ type: 'error', text: errorText });
            setTimeout(() => {
                setUpdateMessage(null);
            }, 4000);
        }
    }, [updateError]);

    const handleFieldChange = (key) => (e) => {
        setFormValues((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleSave = async () => {
        // فقط فیلدهایی که تغییر کرده‌اند
        const payload = {};
        const original = item;
        
        if (formValues.display_name !== original.display_name) {
            payload.display_name = formValues.display_name;
        }
        if (formValues.title !== original.title) {
            payload.title = formValues.title;
        }
        if (formValues.sn_code !== original.sn_code) {
            payload.sn_code = formValues.sn_code;
        }
        if (formValues.warehouse_code !== original.warehouse_code) {
            payload.warehouse_code = formValues.warehouse_code;
        }

        // اگر هیچ فیلدی تغییر نکرده بود
        if (Object.keys(payload).length === 0) {
            setUpdateMessage({ type: 'error', text: 'هیچ تغییری اعمال نشده است' });
            setTimeout(() => setUpdateMessage(null), 3000);
            return;
        }

        // حتماً updated_at ارسال شود
        payload.updated_at = formValues.updated_at;

        try {
            await dispatch(updateGoodsThunk({
                id: item.id,
                payload: payload
            })).unwrap();
        } catch (err) {
            console.error('خطا در به‌روزرسانی:', err);
        }
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setFormValues({
            display_name: item.display_name || '',
            title: item.title || '',
            sn_code: item.sn_code || '',
            warehouse_code: item.warehouse_code || '',
            updated_at: item.updated_at || '',
        });
        setUpdateMessage(null);
    };

    return (
        <div className="border border-Card_border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <SectionHeader icon="fa-solid fa-info-circle" title="اطلاعات اصلی" />
                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 text-xs text-Secondary hover:text-Secondary/80 transition-colors"
                    >
                        <i className="fa-solid fa-pen text-[10px]" />
                        ویرایش
                    </button>
                )}
            </div>

            {updateMessage && (
                <Message type={updateMessage.type} text={updateMessage.text} onClose={() => setUpdateMessage(null)} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField 
                    label="نام کالا" 
                    value={item.display_name || item.title} 
                    editable={true} 
                    fieldKey="display_name" 
                    isEditing={isEditing}
                    formValues={formValues}
                    onChange={handleFieldChange}
                    disabled={updateLoading}
                />
                <InfoField 
                    label="عنوان" 
                    value={item.title} 
                    editable={true} 
                    fieldKey="title" 
                    isEditing={isEditing}
                    formValues={formValues}
                    onChange={handleFieldChange}
                    disabled={updateLoading}
                />
                <InfoField 
                    label="کد تکنیکال" 
                    value={item.sn_code} 
                    mono 
                    editable={true} 
                    fieldKey="sn_code" 
                    isEditing={isEditing}
                    formValues={formValues}
                    onChange={handleFieldChange}
                    disabled={updateLoading}
                />
                <InfoField 
                    label="کد انبار" 
                    value={item.warehouse_code} 
                    mono 
                    editable={true} 
                    fieldKey="warehouse_code" 
                    isEditing={isEditing}
                    formValues={formValues}
                    onChange={handleFieldChange}
                    disabled={updateLoading}
                />
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-Muted">وضعیت</span>
                    <StatusBadge active={item.is_active} />
                </div>
                <InfoField label="تاریخ ایجاد" value={formatDateTime(item.created_at)} />
                <InfoField label="ایجادکننده" value={item.created_by} />
                <InfoField label="به‌روزرسانی‌کننده" value={item.updated_by} />
            </div>

            {isEditing && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-Card_border">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={updateLoading}
                        className="flex-1 text-sm bg-Secondary text-white px-4 py-2 rounded-lg hover:bg-Secondary/90 transition-colors disabled:opacity-50"
                    >
                        {updateLoading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin ml-1" />
                                در حال ذخیره...
                            </>
                        ) : (
                            'ذخیره تغییرات'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={updateLoading}
                        className="flex-1 text-sm border border-Card_border px-4 py-2 rounded-lg text-Primary hover:bg-Input_bg transition-colors disabled:opacity-50"
                    >
                        انصراف
                    </button>
                </div>
            )}
        </div>
    );
};

export default MainInfo;