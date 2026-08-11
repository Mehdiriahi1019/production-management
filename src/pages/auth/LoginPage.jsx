import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { loginUser } from "../../features/auth/login/loginThunk";
import { clearError } from "../../features/auth/login/loginSlice";

// استخراج پیام خطا از فرمت‌های مختلف:
// رشته، آرایه، آبجکت دوزبانه {en, fa}، یا آبجکت validation با چند فیلد {username: {en, fa}, password: {en, fa}}
const extractErrorMessage = (err) => {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (Array.isArray(err)) return extractErrorMessage(err[0]);

  if (typeof err === "object") {
    if (typeof err.fa === "string") return err.fa;
    if (typeof err.en === "string") return err.en;
    if (typeof err.message === "string") return err.message;
    if (typeof err.detail !== "undefined") return extractErrorMessage(err.detail);

    const keys = Object.keys(err);
    if (keys.length > 0) {
      return extractErrorMessage(err[keys[0]]);
    }
  }

  return String(err);
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.login);

  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }

    if (error) {
      dispatch(clearError());
    }

    if (formError) {
      setFormError(null);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = "نام کاربری الزامی است";
    }

    if (!formData.password) {
      errors.password = "رمز عبور الزامی است";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormError(null);
    console.log("📤 Sending data to server:", formData);

    try {
      const result = await dispatch(loginUser(formData)).unwrap();
      console.log("✅ ورود موفق:", result);
      toast.success("ورود با موفقیت انجام شد!");
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ خطا در ورود:", err);

      // فقط همون پیامی که واقعاً از سرور (یا از خودِ خطا) اومده نشون داده می‌شه.
      // هیچ متن دستی/ساختگی اینجا تولید نمی‌شه.
      if (typeof err === "object" && err !== null) {
        // فرمت خطاهای فیلدبه‌فیلد به‌صورت تو در تو: {errors: {username: {...}, password: {...}}}
        if (err.errors && typeof err.errors === "object") {
          let matchedField = false;

          if (err.errors.username) {
            setValidationErrors((prev) => ({
              ...prev,
              username: extractErrorMessage(err.errors.username)
            }));
            matchedField = true;
          }
          if (err.errors.password) {
            setValidationErrors((prev) => ({
              ...prev,
              password: extractErrorMessage(err.errors.password)
            }));
            matchedField = true;
          }

          // اگه errors فیلدهای دیگه‌ای غیر از username/password داشت
          // (مثلاً non_field_errors)، همون پیام واقعی سرور نمایش داده می‌شه
          if (!matchedField) {
            setFormError(extractErrorMessage(err.errors));
          }
        }
        // فرمت مسطح: {username: {...}, password: {...}}
        else if (err.username || err.password) {
          if (err.username) {
            setValidationErrors((prev) => ({
              ...prev,
              username: extractErrorMessage(err.username)
            }));
          }
          if (err.password) {
            setValidationErrors((prev) => ({
              ...prev,
              password: extractErrorMessage(err.password)
            }));
          }
        }
        // هر شکل دیگه‌ای از آبجکت خطا: {message: {en, fa}}، {detail: ...}،
        // یا حتی مستقیماً {en, fa} (بدون پوشش اضافه).
        // extractErrorMessage خودش همه‌ی این حالت‌ها رو پوشش می‌ده.
        else {
          const msg = extractErrorMessage(err);
          if (msg) {
            setFormError(msg);
          }
        }
      } else if (err) {
        // err یک رشته‌ست (مثلاً همون error.message خام که از loginThunk رسیده)
        setFormError(extractErrorMessage(err));
      }
    }
  };

  return (
    <div
      className="w-full h-dvh overflow-hidden bg-Signin_background text-Primary flex items-center justify-center p-4 md:p-8"
      dir="rtl"
    >
      <div className="w-full max-w-sm md:max-w-md bg-Background border border-Card_border rounded-2xl shadow-lg flex flex-col p-6 md:p-8">
        <h1 className="text-xl md:text-2xl font-bold">
          به جمع ما
          <br /> خوش آمدید
        </h1>

        <h2 className="text-sm mt-2 text-Muted">
          حساب کاربری ندارید؟{" "}
          <span className="cursor-pointer text-Secondary hover:text-Secondary_hover transition-colors">
            <Link to={"/register"}>ثبت نام</Link>
          </span>
        </h2>

        <form onSubmit={handleSubmit} className="flex mt-6 flex-col gap-4">
          {/* نمایش خطای کلی */}
          {formError && (
            <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {formError}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-xs text-Muted">
              نام کاربری
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              className={`w-full h-11 bg-Input_bg border rounded-md px-3 text-Primary outline-none transition-colors ${
                validationErrors.username
                  ? "border-red-500 focus:border-red-500"
                  : "border-Input_border focus:border-Secondary"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            />
            {validationErrors.username && (
              <span className="text-[10px] text-red-500">{validationErrors.username}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-xs text-Muted">
              رمز عبور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              className={`w-full h-11 bg-Input_bg border rounded-md px-3 text-Primary outline-none transition-colors ${
                validationErrors.password
                  ? "border-red-500 focus:border-red-500"
                  : "border-Input_border focus:border-Secondary"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            />
            {validationErrors.password && (
              <span className="text-[10px] text-red-500">{validationErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-11 rounded-lg bg-Secondary hover:bg-Secondary_pressed text-white text-sm font-medium transition-colors ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "در حال ورود..." : "ورود"}
          </button>

          <div className="flex flex-col sm:flex-row w-full justify-between items-center gap-2"></div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;