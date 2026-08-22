// pages/EditUserPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { editUserThunk } from "../../features/users/usersedit/EditUserthunk";
import { getUserDetailsThunk } from "../../features/auth/profile/Userprofile/userditailthunk";
import { resetUserDetails } from "../../features/auth/profile/Userprofile/UserditailSlice";
import UserPositions from "./UserPositions";
import UserPermissions from "./UserPermissions";

// The backend sends error text as { fa, en } under different keys depending
// on the endpoint (message / errors / detail), or sometimes a plain string.
// This always resolves to the exact server string (fa first), and only uses
// the fallback when the server genuinely sent nothing usable.
const extractErrorMessage = (err, fallback) => {
  if (!err) return fallback;
  if (typeof err === "string") return err;

  const pickString = (value) => {
    if (typeof value === "string" && value.trim()) return value;
    if (value && typeof value === "object") {
      if (typeof value.fa === "string" && value.fa.trim()) return value.fa;
      if (typeof value.en === "string" && value.en.trim()) return value.en;
    }
    return null;
  };

  return (
    pickString(err.message) ||
    pickString(err.errors) ||
    pickString(err.detail) ||
    fallback
  );
};

const READONLY_FIELDS = [
  { key: "username", label: "نام کاربری" },
  { key: "is_active", label: "وضعیت حساب" },
  { key: "last_login", label: "آخرین ورود" },
];

const swapDateTime = (value) => {
  const str = String(value).trim();
  const parts = str.split(" ").filter(Boolean);
  if (parts.length !== 2) return str;
  const [first, second] = parts;
  return `${second} ${first}`;
};

const formatValue = (key, value) => {
  if (key === "is_active") {
    return value ? "فعال" : "غیر فعال";
  }
  if (!value && value !== 0) {
    return "—";
  }
  if (key === "last_login") {
    return swapDateTime(value);
  }
  return value;
};

const EditUserPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.userDetails.user);
  const userLoading = useSelector((state) => state.userDetails.loading);
  const userError = useSelector((state) => state.userDetails.error);

  // Positions/permissions live on `user` (from getUserDetailsThunk), same as
  // before the split. UserPositions/UserPermissions call this after any
  // add/remove mutation so they always reflect the server state.
  const refetchUser = useCallback(() => {
    return dispatch(getUserDetailsThunk(id)).unwrap().catch(() => {});
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(getUserDetailsThunk(id));
    return () => {
      dispatch(resetUserDetails());
    };
  }, [id, dispatch]);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
  });

  const [originalFormData, setOriginalFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (user) {
      const userData = {
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        password: "",
      };
      setFormData(userData);
      setOriginalFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
      });
    }
  }, [user]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handlePhoneChange = (e) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    if (numericValue.length <= 11) {
      handleChange("phone_number")({ target: { value: numericValue } });
    }
  };

  const applyServerError = (err) => {
    if (!err) {
      setGeneralError(null);
      return;
    }

    setGeneralError(extractErrorMessage(err, null));

    const nextFieldErrors = {};
    Object.entries(err).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        nextFieldErrors[key] = value.join("، ");
      }
    });
    setFieldErrors(nextFieldErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    if (formData.phone_number && formData.phone_number.length !== 11) {
      setFieldErrors({ phone_number: "شماره موبایل باید دقیقاً ۱۱ رقم باشد" });
      return;
    }

    setIsSubmitting(true);

    const payload = {};

    if (formData.first_name !== originalFormData.first_name) {
      payload.first_name = formData.first_name;
    }
    if (formData.last_name !== originalFormData.last_name) {
      payload.last_name = formData.last_name;
    }
    if (formData.email !== originalFormData.email) {
      payload.email = formData.email;
    }
    if (formData.phone_number !== originalFormData.phone_number) {
      payload.phone_number = formData.phone_number;
    }
    if (formData.password && formData.password.trim() !== "") {
      payload.password = formData.password;
    }

    if (Object.keys(payload).length === 0) {
      setSuccessMessage("هیچ تغییری اعمال نشده است");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await dispatch(editUserThunk({ id, payload })).unwrap();
      setSuccessMessage(result?.message?.fa || "تغییرات با موفقیت ذخیره شد");

      setOriginalFormData({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
      });

      // رفرش کاربر بدون ریست کردن state
      await dispatch(getUserDetailsThunk(id)).unwrap();
    } catch (err) {
      applyServerError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading && !user) {
    return (
      <div dir="rtl" className="w-full max-w-2xl mx-auto px-4 py-10 text-center">
        <span className="text-sm text-Muted">در حال بارگذاری اطلاعات کاربر...</span>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div dir="rtl" className="w-full max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-sm text-Muted mb-4">
          {userError?.message?.fa || "کاربر مورد نظر یافت نشد."}
        </p>
        <Link to="/users" className="text-sm text-Secondary hover:underline">
          بازگشت به لیست کاربران
        </Link>
      </div>
    );
  }

  const visibleReadonlyFields = READONLY_FIELDS.filter(
    ({ key }) => user[key] !== undefined && user[key] !== null
  );

  return (
    <div dir="rtl" className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/users"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-Muted hover:text-Primary hover:bg-Input_bg transition-colors flex-shrink-0"
        >
          <i className="fa-solid fa-arrow-right text-sm" />
        </Link>
        <div>
          <h1 className="text-base font-medium text-Primary">ویرایش کاربر</h1>
          <p className="text-xs text-Muted">{user.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          {visibleReadonlyFields.length > 0 && (
            <div className="bg-Background border border-Card_border rounded-xl divide-y divide-Card_border mb-4">
              {visibleReadonlyFields.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-Muted">{label}</span>
                  <span className="text-xs text-Primary font-medium">
                    {formatValue(key, user[key])}
                  </span>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-Background border border-Card_border rounded-xl p-5 flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-Muted">نام</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange("first_name")}
                  disabled={isSubmitting}
                  className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus:outline-none focus:ring-1 focus:ring-Secondary"
                />
                {fieldErrors.first_name && (
                  <span className="text-[11px] text-red-500">{fieldErrors.first_name}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-Muted">نام خانوادگی</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange("last_name")}
                  disabled={isSubmitting}
                  className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus:outline-none focus:ring-1 focus:ring-Secondary"
                />
                {fieldErrors.last_name && (
                  <span className="text-[11px] text-red-500">{fieldErrors.last_name}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-Muted">ایمیل</label>
              <input
                type="email"
                dir="ltr"
                value={formData.email}
                onChange={handleChange("email")}
                disabled={isSubmitting}
                className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary text-left focus:outline-none focus:ring-1 focus:ring-Secondary"
              />
              {fieldErrors.email && (
                <span className="text-[11px] text-red-500">{fieldErrors.email}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-Muted">شماره موبایل</label>
              <input
                type="text"
                dir="ltr"
                value={formData.phone_number}
                onChange={handlePhoneChange}
                maxLength={11}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="مثلاً 09123456789"
                disabled={isSubmitting}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (!/^\d+$/.test(pasted)) {
                    e.preventDefault();
                  }
                }}
                className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary text-left focus:outline-none focus:ring-1 focus:ring-Secondary"
              />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-Muted">
                  {formData.phone_number?.length || 0}/۱۱ رقم
                </span>
                {formData.phone_number?.length === 11 && (
                  <span className="text-[10px] text-green-600">✓ تعداد ارقام صحیح است</span>
                )}
                {formData.phone_number?.length > 0 && formData.phone_number?.length < 11 && (
                  <span className="text-[10px] text-orange-500">باید11 رقم وارد کنید</span>
                )}
              </div>
              {fieldErrors.phone_number && (
                <span className="text-[11px] text-red-500">{fieldErrors.phone_number}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-Muted">
                رمز عبور جدید
                <span className="text-Muted/70 font-normal"> (اختیاری)</span>
              </label>
              <input
                type="password"
                dir="ltr"
                value={formData.password}
                onChange={handleChange("password")}
                placeholder="خالی بگذارید تا تغییر نکند"
                autoComplete="new-password"
                disabled={isSubmitting}
                className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary text-left placeholder:text-Muted focus:outline-none focus:ring-1 focus:ring-Secondary"
              />
              {fieldErrors.password && (
                <span className="text-[11px] text-red-500">{fieldErrors.password}</span>
              )}
            </div>

            {generalError && <p className="text-xs text-red-500">{generalError}</p>}
            {successMessage && <p className="text-xs text-green-600">{successMessage}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Link
                to="/users"
                className="px-4 py-2 rounded-lg text-xs font-medium text-Muted hover:bg-Input_bg transition-colors"
              >
                انصراف
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-Secondary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <UserPositions userId={id} user={user} refetchUser={refetchUser} />
          <UserPermissions userId={id} user={user} refetchUser={refetchUser} />
        </div>
      </div>
    </div>
  );
};

export default EditUserPage;