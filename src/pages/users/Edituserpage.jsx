import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { editUserThunk } from "../../features/users/usersedit/EditUserthunk";
import { getUserDetailsThunk } from "../../features/auth/profile/Userprofile/userditailthunk";
import { resetUserDetails } from "../../features/auth/profile/Userprofile/UserditailSlice";
import { getPositionsThunk } from "../../features/auth/positions/Positionthunk";
import { assignPositionsThunk } from "../../features/auth/positions/assignposition/Assignpositionsthunk";
import { unassignPositionsThunk } from "../../features/auth/positions/Unassignpositions/Unassignpositionsthunk";

// فیلدهای غیرقابل‌ویرایشی که endpoint جزئیات کاربر برمی‌گردونه
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
    return value ? "بله" : "خیر";
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

  // اطلاعات کاربر از اسلایس userDetails خونده می‌شه
  const user = useSelector((state) => state.userDetails.user);
  const userLoading = useSelector((state) => state.userDetails.loading);
  const userError = useSelector((state) => state.userDetails.error);

  useEffect(() => {
    dispatch(getUserDetailsThunk(id));

    // موقع خروج از صفحه، دیتای کاربر قبلی از state پاک بشه
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  // State برای سمت‌ها
  const [userPositions, setUserPositions] = useState([]);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [isAddingPosition, setIsAddingPosition] = useState(false);

  // لیست سمت‌های قابل انتخاب که از API میاد
  const [positionOptions, setPositionOptions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState(null);
  // خطای مخصوص ارسال (assign) سمت‌ها به سرور
  const [assignError, setAssignError] = useState(null);
  // id سمتی که در حال حذف شدنه (برای غیرفعال کردن دکمه‌ی همون ردیف)
  const [removingPositionId, setRemovingPositionId] = useState(null);
  const [removePositionError, setRemovePositionError] = useState(null);

  // مقدار فعلیِ سلکت + چک‌باکس (قبل از این‌که با دکمه‌ی «افزودن سمت» به لیست اضافه بشه)
  const [draftPositionId, setDraftPositionId] = useState("");
  const [draftIsPrimary, setDraftIsPrimary] = useState(false);

  // لیست موقتِ سمت‌هایی که با دکمه‌ی «افزودن سمت» ساخته شدن و آماده‌ی ارسال به سرورن
  const [pendingPositions, setPendingPositions] = useState([]);

  // State برای حذف چندتایی
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        password: "",
      });
      setUserPositions(user.positions || []);
    }
  }, [user]);

  // موقع باز شدن پاپ‌آپ، لیست سمت‌ها رو از API می‌گیریم
  useEffect(() => {
    if (!showAddPosition) return;

    let isCancelled = false;
    setPositionsLoading(true);
    setPositionsError(null);

    dispatch(getPositionsThunk())
      .unwrap()
      .then((data) => {
        if (!isCancelled) setPositionOptions(data || []);
      })
      .catch((err) => {
        if (!isCancelled) setPositionsError(err?.message?.fa || null);
      })
      .finally(() => {
        if (!isCancelled) setPositionsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [showAddPosition, dispatch]);

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

    if (err.message?.fa) {
      setGeneralError(err.message.fa);
    }

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

    const payload = { ...formData };
    if (!payload.password) delete payload.password;

    try {
      const result = await dispatch(editUserThunk({ id, payload })).unwrap();
      setSuccessMessage(result?.message?.fa);
    } catch (err) {
      applyServerError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // سمت‌هایی که هنوز نه به کاربر اضافه شدن و نه توی لیست موقت هستن
  const selectablePositions = positionOptions.filter(
    (pos) =>
      !userPositions.some((up) => up.id === pos.id) &&
      !pendingPositions.some((pp) => pp.position_id === pos.id)
  );

  // با دکمه‌ی «افزودن سمت»، مقدار فعلی سلکت + چک‌باکس به لیست موقت اضافه می‌شه
  const handleAddDraftPosition = () => {
    if (!draftPositionId) return;

    const positionData = positionOptions.find((p) => p.id === draftPositionId);
    if (!positionData) return;

    setPendingPositions((prev) => {
      // فقط یکی از کل ردیف‌ها می‌تونه اصلی باشه؛ اگه این یکی اصلیه، بقیه غیر اصلی بشن
      const next = draftIsPrimary
        ? prev.map((p) => ({ ...p, is_primary: false }))
        : prev;

      return [
        ...next,
        {
          position_id: positionData.id,
          display_name: positionData.display_name,
          code: positionData.code,
          is_primary: draftIsPrimary,
        },
      ];
    });

    // فرم رو برای انتخاب سمت بعدی ریست کن
    setDraftPositionId("");
    setDraftIsPrimary(false);
  };

  const handleRemovePendingPosition = (positionId) => {
    setPendingPositions((prev) => prev.filter((p) => p.position_id !== positionId));
  };

  // تایید نهایی: کل لیست موقت رو یکجا به سرور می‌فرسته
  const handleConfirmPositions = async () => {
    if (pendingPositions.length === 0) {
      return;
    }

    setIsAddingPosition(true);
    setAssignError(null);

    // فرمتی که سرور می‌خواد: [{ position_id, is_primary }, ...]
    const positionsPayload = pendingPositions.map(({ position_id, is_primary }) => ({
      position_id,
      is_primary,
    }));

    try {
      await dispatch(
        assignPositionsThunk({ userId: id, positions: positionsPayload })
      ).unwrap();

      // بعد از موفقیت، سمت‌های تازه‌اضافه‌شده رو توی نمای محلی هم نشون می‌دیم
      const positionsToAdd = pendingPositions.map((p) => ({
        id: p.position_id,
        display_name: p.display_name,
        code: p.code,
        is_primary: p.is_primary,
        start_date: new Date().toLocaleDateString("fa-IR"),
        end_date: null,
      }));

      setUserPositions((prev) => [...prev, ...positionsToAdd]);
      setShowAddPosition(false);
      setPendingPositions([]);
      setDraftPositionId("");
      setDraftIsPrimary(false);
    } catch (err) {
      setAssignError(err?.message?.fa || null);
    } finally {
      setIsAddingPosition(false);
    }
  };

  // هندلرهای حذف چندتایی
  const handleToggleSelectPosition = (positionId) => {
    setSelectedPositions((prev) => {
      if (prev.includes(positionId)) {
        return prev.filter((id) => id !== positionId);
      } else {
        return [...prev, positionId];
      }
    });
  };

  const handleSelectAllPositions = () => {
    if (selectedPositions.length === userPositions.length) {
      setSelectedPositions([]);
    } else {
      setSelectedPositions(userPositions.map((p) => p.id));
    }
  };

  const handleBulkDeletePositions = async () => {
    if (selectedPositions.length === 0) return;

    setIsBulkDeleting(true);
    setRemovePositionError(null);

    try {
      // حذف چندتایی با ارسال آرایه‌ای از idها
      await dispatch(unassignPositionsThunk(selectedPositions)).unwrap();
      
      // حذف از لیست محلی
      setUserPositions((prev) => prev.filter((p) => !selectedPositions.includes(p.id)));
      setSelectedPositions([]);
    } catch (err) {
      setRemovePositionError(err?.message?.fa || "خطا در حذف سمت‌ها");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleRemovePosition = async (positionId) => {
    setRemovingPositionId(positionId);
    setRemovePositionError(null);

    try {
      await dispatch(unassignPositionsThunk([positionId])).unwrap();
      setUserPositions((prev) => prev.filter((p) => p.id !== positionId));
      // اگر این سمت در لیست انتخاب شده بود، از لیست انتخاب حذفش کن
      setSelectedPositions((prev) => prev.filter((id) => id !== positionId));
    } catch (err) {
      setRemovePositionError(err?.message?.fa || "خطا در حذف سمت");
    } finally {
      setRemovingPositionId(null);
    }
  };

  if (userLoading) {
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

  return (
    <div dir="rtl" className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* هدر صفحه */}
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

      {/* دو ستون */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ستون راست - اطلاعات کاربر */}
        <div>
          <div className="bg-Background border border-Card_border rounded-xl divide-y divide-Card_border mb-4">
            {READONLY_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-Muted">{label}</span>
                <span className="text-xs text-Primary font-medium">
                  {formatValue(key, user[key])}
                </span>
              </div>
            ))}
          </div>

          {/* فرم */}
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
                  <span className="text-[10px] text-orange-500">باید ۱۱ رقم وارد کنید</span>
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

            {/* دکمه‌ها */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Link
                to="/users"
                className="px-4 py-2 rounded-lg text-xs font-medium text-Muted hover:bg-Input_bg transition-colors"
              >
                انصراف
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !!successMessage}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-Secondary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </form>
        </div>

        {/* ستون چپ - سمت‌ها */}
        <div>
          <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-Card_border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-Primary">سمت‌ها</h3>
                {userPositions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllPositions}
                    className="text-xs text-Muted hover:text-Secondary transition-colors"
                  >
                    {selectedPositions.length === userPositions.length ? "لغو انتخاب همه" : "انتخاب همه"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedPositions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDeletePositions}
                    disabled={isBulkDeleting}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    {isBulkDeleting ? (
                      <i className="fa-solid fa-spinner fa-spin" />
                    ) : (
                      `حذف (${selectedPositions.length})`
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddPosition(true)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-Muted hover:text-Secondary hover:bg-Secondary/10 transition-colors"
                >
                  <i className="fa-solid fa-plus text-xs" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-Card_border">
              {removePositionError && (
                <div className="px-4 py-2 text-xs text-red-500 text-center">
                  {removePositionError}
                </div>
              )}
              {userPositions.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-Muted">
                  هیچ سمتی برای این کاربر ثبت نشده است.
                </div>
              ) : (
                userPositions.map((position) => (
                  <div key={position.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedPositions.includes(position.id)}
                          onChange={() => handleToggleSelectPosition(position.id)}
                          className="w-4 h-4 accent-Secondary rounded"
                        />
                        <span className="text-sm font-medium text-Primary">
                          {position.display_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {position.is_primary && (
                          <span className="text-xs bg-Secondary/15 text-Secondary px-2 py-0.5 rounded-full">
                            اصلی
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePosition(position.id)}
                          disabled={removingPositionId === position.id || isBulkDeleting}
                          className="text-Muted hover:text-red-500 transition-colors disabled:opacity-40"
                        >
                          {removingPositionId === position.id ? (
                            <i className="fa-solid fa-spinner fa-spin text-xs" />
                          ) : (
                            <i className="fa-regular fa-trash-can text-xs" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-Muted">
                      <span>شروع: {position.start_date}</span>
                      {position.end_date ? (
                        <span>پایان: {position.end_date}</span>
                      ) : (
                        <span className="text-green-600">فعلی</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* پاپ‌آپ افزودن سمت */}
          {showAddPosition && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
              <div className="bg-Background border border-Card_border rounded-xl p-6 max-w-md w-full">
                <h4 className="text-sm font-medium text-Primary mb-4">افزودن سمت جدید</h4>

                <div className="flex flex-col gap-3">
                  {positionsLoading && (
                    <p className="text-xs text-Muted text-center py-4">
                      در حال دریافت لیست سمت‌ها...
                    </p>
                  )}

                  {!positionsLoading && positionsError && (
                    <p className="text-xs text-red-500 text-center py-4">{positionsError}</p>
                  )}

                  {!positionsLoading && !positionsError && (
                    <>
                      {/* سلکت سمت + چک‌باکس اصلی بودن */}
                      <div className="flex items-end gap-2">
                        <div className="flex flex-col gap-1.5 flex-1">
                          <label className="text-xs text-Muted">سمت</label>
                          <select
                            value={draftPositionId}
                            onChange={(e) => setDraftPositionId(e.target.value)}
                            className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus:outline-none focus:ring-1 focus:ring-Secondary"
                          >
                            <option value="">یک سمت انتخاب کنید...</option>
                            {selectablePositions.map((pos) => (
                              <option key={pos.id} value={pos.id}>
                                {pos.display_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <label className="flex items-center gap-1.5 pb-2.5 text-xs text-Muted whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={draftIsPrimary}
                            onChange={(e) => setDraftIsPrimary(e.target.checked)}
                            className="w-4 h-4 accent-Secondary"
                          />
                          اصلی
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddDraftPosition}
                        disabled={!draftPositionId}
                        className="h-9 rounded-lg border border-Card_border text-Primary text-xs font-medium hover:bg-Input_bg transition-colors disabled:opacity-50"
                      >
                        + افزودن سمت
                      </button>
                    </>
                  )}

                  {pendingPositions.length > 0 && (
                    <div className="flex flex-col gap-1 border border-Card_border rounded-lg p-2 max-h-48 overflow-y-auto">
                      {pendingPositions.map((p) => (
                        <div
                          key={p.position_id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm"
                        >
                          <span className="text-Primary flex-1">
                            {p.display_name}
                          </span>
                          {p.is_primary && (
                            <span className="text-[10px] bg-Secondary/15 text-Secondary px-2 py-0.5 rounded-full">
                              اصلی
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePendingPosition(p.position_id)}
                            className="text-Muted hover:text-red-500 transition-colors"
                          >
                            <i className="fa-solid fa-xmark text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {assignError && (
                    <p className="text-xs text-red-500 text-center">{assignError}</p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleConfirmPositions}
                      disabled={isAddingPosition || pendingPositions.length === 0}
                      className="flex-1 h-10 rounded-lg bg-Secondary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isAddingPosition
                        ? "در حال ارسال..."
                        : `تایید (${pendingPositions.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPosition(false);
                        setPendingPositions([]);
                        setDraftPositionId("");
                        setDraftIsPrimary(false);
                        setAssignError(null);
                      }}
                      className="flex-1 h-10 rounded-lg border border-Card_border text-Primary text-sm font-medium hover:bg-Input_bg transition-colors"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditUserPage;