import React from 'react';

const SectionHeader = ({ icon, title }) => (
    <h4 className="flex items-center gap-2 text-xs font-medium text-Primary mb-3 border-b border-Card_border pb-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-Secondary/10 text-Secondary flex-shrink-0">
            <i className={`${icon} text-[11px]`} />
        </span>
        {title}
    </h4>
);

const InfoField = ({ label, value, mono = false }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[11px] text-Muted">{label}</span>
        <span
            className={`text-sm text-Primary text-right ${mono ? 'font-mono' : 'font-medium'}`}
        >
            {value || "—"}
        </span>
    </div>
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

// تابع تبدیل تاریخ به فرمت شمسی با ساعت (ساعت سپس تاریخ)
const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "—";
    if (dateTimeStr.includes(' ')) {
        const [date, time] = dateTimeStr.split(' ');
        return `${time} ${date}`;
    }
    return dateTimeStr;
};

const formatTime = (timeString) => {
    if (!timeString) return "—";
    return timeString;
};

const MainInfo = ({ item }) => {
    return (
        <div className="border border-Card_border rounded-xl p-4">
            <SectionHeader icon="fa-solid fa-info-circle" title="اطلاعات اصلی" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField label="نام کالا" value={item.display_name || item.title} />
                <InfoField label="کد تکنیکال" value={item.sn_code} mono />
                <InfoField label="کد انبار" value={item.warehouse_code} mono />
                <InfoField label="زمان تولید" value={formatTime(item.production_time_factor)} mono />
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-Muted">وضعیت</span>
                    <StatusBadge active={item.is_active} />
                </div>
                <InfoField label="تاریخ ایجاد" value={formatDateTime(item.created_at)} />
                <InfoField label="ایجادکننده" value={item.created_by} />
                <InfoField label="به‌روزرسانی‌کننده" value={item.updated_by} />
            </div>
        </div>
    );
};

export default MainInfo;