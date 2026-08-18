import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProfileThunk } from "../../features/auth/profile/profileThunk";
import { editService } from "../../features/auth/profile/editprofile/editService";

const FIELDS = [
  { key: "first_name", label: "نام" },
  { key: "last_name", label: "نام خانوادگی" },
  { key: "username", label: "نام کاربری" },
  { key: "email", label: "ایمیل" },
  { key: "phone_number", label: "شماره موبایل" },
  { key: "is_active", label: "وضعیت حساب" },
  { key: "last_login", label: "آخرین ورود" },
];

const EDITABLE_FIELDS = [
  { key: "first_name", label: "نام", type: "text" },
  { key: "last_name", label: "نام خانوادگی", type: "text" },
  { key: "email", label: "ایمیل", type: "email" },
  { key: "phone_number", label: "شماره موبایل", type: "text" },
];

const PASSWORD_FIELD = { key: "password", label: "رمز عبور جدید", type: "password" };

const formatValue = (key, value) => {
  if (key === "is_active") {
    return value ? "فعال" : "غیرفعال";
  }
  if (!value && value !== 0) {
    return "—";
  }
  return value;
};

const Profile = () => {
  const dispatch = useDispatch();

  const { profile, loading, error } = useSelector((state) => state.profile);

  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    dispatch(getProfileThunk());
  }, [dispatch]);

  const handleEditClick = () => {
    setFormValues({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || "",
      phone_number: profile.phone_number || "",
      password: "",
    });
    setIsEditing(true);
    setSaveError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormValues({});
    setSaveError(null);
  };

  const handleChange = (key, value) => {
    if (key === "phone_number") {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 11) {
        setFormValues((prev) => ({ ...prev, [key]: numericValue }));
      }
    } else {
      setFormValues((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      if (formValues.phone_number && formValues.phone_number.length !== 11) {
        setSaveError("شماره موبایل باید دقیقاً ۱۱ رقم باشد");
        setIsSaving(false);
        return;
      }

      const payload = {};

      if (formValues.first_name !== profile.first_name) {
        payload.first_name = formValues.first_name;
      }

      if (formValues.last_name !== profile.last_name) {
        payload.last_name = formValues.last_name;
      }

      if (formValues.email !== profile.email) {
        payload.email = formValues.email;
      }

      if (formValues.phone_number !== profile.phone_number) {
        payload.phone_number = formValues.phone_number;
      }

      if (formValues.password && formValues.password.trim().length > 0) {
        payload.password = formValues.password;
      }

      if (Object.keys(payload).length === 0) {
        setSaveError("هیچ تغییری در اطلاعات اعمال نشده است");
        setIsSaving(false);
        return;
      }

      await editService(payload);
      await dispatch(getProfileThunk());
      setIsEditing(false);
      setFormValues({});
      console.log("پروفایل با موفقیت ویرایش شد");

    } catch (error) {
      console.error("خطا در ویرایش پروفایل:", error);

      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat().join(' | ');
          setSaveError(errorMessages);
        } else {
          setSaveError(errorData?.message || "خطا در ویرایش پروفایل");
        }
      } else {
        setSaveError("خطا در ارتباط با سرور");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-16">
        <span className="text-sm text-Muted">در حال بارگذاری اطلاعات پروفایل...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-16">
        <span className="text-sm text-red-500">{error?.message?.fa || "خطا در دریافت اطلاعات پروفایل"}</span>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`;

  return (
    <div dir="rtl" className="w-full max-w-3xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-Secondary/15 text-Secondary flex items-center justify-center font-medium text-base flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-medium text-Primary text-base">
            {profile.first_name} {profile.last_name}
          </p>
          <p className="text-sm text-Muted">{profile.username}</p>
        </div>

        <span
          className={`mr-auto text-xs px-2.5 py-1 rounded-full font-medium ${
            profile.is_active
              ? "bg-Secondary/15 text-Secondary"
              : "bg-Disabled text-Muted"
          }`}
        >
          {profile.is_active ? "فعال" : "غیرفعال"}
        </span>

        {!isEditing && (
          <button
            type="button"
            onClick={handleEditClick}
            aria-label="ویرایش پروفایل"
            className="w-8 h-8 flex items-center justify-center rounded-full text-Muted hover:text-Secondary hover:bg-Secondary/10 transition-colors flex-shrink-0"
          >
            <i className="fa-regular fa-pen-to-square text-sm" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-Background border border-Card_border rounded-xl p-4 flex flex-col gap-3">
          {EDITABLE_FIELDS.map(({ key, label, type }) => {
            if (key === "phone_number") {
              return (
                <div key={key} className="flex flex-col gap-1">
                  <label htmlFor={key} className="text-xs text-Muted">
                    {label}
                  </label>
                  <input
                    id={key}
                    type="text"
                    value={formValues[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    maxLength={11}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="مثلاً 09123456789"
                    className="w-full h-11 bg-Input_bg border border-Input_border rounded-md px-3 text-Primary outline-none focus:border-Secondary transition-colors ltr text-left"
                    disabled={isSaving}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text');
                      if (!/^\d+$/.test(pasted)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-Muted">
                      {formValues[key]?.length || 0}/۱۱ رقم
                    </span>
                    {formValues[key]?.length === 11 && (
                      <span className="text-[10px] text-green-600">
                        ✓ تعداد ارقام صحیح است
                      </span>
                    )}
                    {formValues[key]?.length > 0 && formValues[key]?.length < 11 && (
                      <span className="text-[10px] text-orange-500">
                        باید ۱۱ رقم وارد کنید
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={key} className="flex flex-col gap-1">
                <label htmlFor={key} className="text-xs text-Muted">
                  {label}
                </label>
                <input
                  id={key}
                  type={type}
                  value={formValues[key] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full h-11 bg-Input_bg border border-Input_border rounded-md px-3 text-Primary outline-none focus:border-Secondary transition-colors"
                  disabled={isSaving}
                />
              </div>
            );
          })}

          <div className="flex flex-col gap-1">
            <label htmlFor={PASSWORD_FIELD.key} className="text-xs text-Muted">
              {PASSWORD_FIELD.label}
            </label>
            <input
              id={PASSWORD_FIELD.key}
              type={PASSWORD_FIELD.type}
              value={formValues.password || ""}
              onChange={(e) => handleChange(PASSWORD_FIELD.key, e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full h-11 bg-Input_bg border border-Input_border rounded-md px-3 text-Primary outline-none focus:border-Secondary transition-colors"
              disabled={isSaving}
            />
            <span className="text-[10px] text-Muted">
              اگه نمی‌خوای رمز عبور تغییر کنه، این فیلد رو خالی بذار.
            </span>
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
              {saveError}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 h-11 rounded-lg bg-Secondary hover:bg-Secondary_pressed text-white text-sm font-medium transition-colors ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 h-11 rounded-lg border border-Card_border text-Primary text-sm font-medium hover:bg-Input_bg transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="md:hidden bg-Background border border-Card_border rounded-xl divide-y divide-Card_border">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-Muted">{label}</span>
                <span className="text-sm text-Primary font-medium">
                  {formatValue(key, profile[key])}
                </span>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-Background border border-Card_border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-Card_border">
                {FIELDS.map(({ key, label }) => (
                  <tr key={key} className="hover:bg-Input_bg">
                    <td className="px-5 py-3 text-Muted w-1/3">{label}</td>
                    <td className="px-5 py-3 text-Primary font-medium">
                      {formatValue(key, profile[key])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {profile.positions && profile.positions.length > 0 && (
            <div className="mt-4 bg-Background border border-Card_border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-Card_border">
                <h3 className="text-sm font-medium text-Primary">سمت‌ها</h3>
              </div>
              <div className="divide-y divide-Card_border">
                {profile.positions.map((position) => (
                  <div key={position.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-Primary">
                          {position.display_name}
                        </span>
                        <span className="mr-2 text-xs text-Muted">
                          ({position.code})
                        </span>
                      </div>
                      {position.is_primary && (
                        <span className="text-xs bg-Secondary/15 text-Secondary px-2 py-0.5 rounded-full">
                          اصلی
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-Muted">
                      <span>
                        شروع: {position.start_date}
                      </span>
                      {position.end_date ? (
                        <span>پایان: {position.end_date}</span>
                      ) : (
                        <span className="text-green-600">فعلی</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.positions?.length === 0 && (
            <p className="text-xs text-Muted mt-3">هیچ سمتی برای این کاربر ثبت نشده است.</p>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;