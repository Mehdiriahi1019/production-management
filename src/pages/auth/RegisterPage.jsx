import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { registerUser } from "../../features/auth/register/registerThunk";
import { clearError } from "../../features/auth/register/registerSlice";

// استخراج پیام خطا از فرمت‌های مختلف:
// رشته، آرایه، آبجکت دوزبانه {en, fa}، یا آبجکت validation با چند فیلد {username: {en, fa}, email: {en, fa}}
const extractErrorMessage = (err) => {
  if (!err) return undefined;
  if (typeof err === 'string') return err;
  if (Array.isArray(err)) return extractErrorMessage(err[0]);

  if (typeof err === 'object') {
    // حالت آبجکت دوزبانه‌ی مستقیم: {en, fa}
    if (typeof err.fa === 'string') return err.fa;
    if (typeof err.en === 'string') return err.en;
    if (typeof err.message === 'string') return err.message;
    if (typeof err.detail !== 'undefined') return extractErrorMessage(err.detail);

    // حالت آبجکت validation با چند فیلد: {username: {en, fa}, email: {en, fa}}
    const keys = Object.keys(err);
    if (keys.length > 0) {
      return extractErrorMessage(err[keys[0]]);
    }
  }

  return String(err);
};

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    password2: ""
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    if (error) {
      dispatch(clearError());
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = "نام کاربری الزامی است";
    } else if (formData.username.length < 3) {
      errors.username = "نام کاربری باید حداقل ۳ کاراکتر باشد";
    }
    
    if (!formData.first_name.trim()) {
      errors.first_name = "نام الزامی است";
    }
    
    if (!formData.last_name.trim()) {
      errors.last_name = "نام خانوادگی الزامی است";
    }
    
    if (!formData.email.trim()) {
      errors.email = "ایمیل الزامی است";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "ایمیل معتبر نیست";
    }
    
    if (!formData.phone_number.trim()) {
      errors.phone_number = "شماره تلفن الزامی است";
    } else if (!/^09[0-9]{9}$/.test(formData.phone_number)) {
      errors.phone_number = "شماره تلفن معتبر نیست (مثال: 09123456789)";
    }
    
    if (!formData.password) {
      errors.password = "رمز عبور الزامی است";
    } else if (formData.password.length < 8) {
      errors.password = "رمز عبور باید حداقل ۸ کاراکتر باشد";
    }
    
    if (!formData.password2) {
      errors.password2 = "تکرار رمز عبور الزامی است";
    } else if (formData.password !== formData.password2) {
      errors.password2 = "رمز عبور با تکرار آن مطابقت ندارد";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // ارسال همه دیتا به سرور (با password2)
    const submitData = formData;
    console.log("📤 Sending data to server:", submitData);
    
    try {
      const result = await dispatch(registerUser(submitData)).unwrap();
      console.log('✅ ثبت‌نام موفق:', result);
      toast.success('ثبت‌نام با موفقیت انجام شد!');
      navigate('/');
      
    } catch (err) {
      console.error('❌ خطا در ثبت‌نام:', err);
      
      // مدیریت خطاهای برگشتی از سرور
      if (typeof err === 'object' && err !== null) {
        if (err.username) {
          setValidationErrors(prev => ({ ...prev, username: extractErrorMessage(err.username) }));
        }
        if (err.email) {
          setValidationErrors(prev => ({ ...prev, email: extractErrorMessage(err.email) }));
        }
        if (err.phone_number) {
          setValidationErrors(prev => ({ ...prev, phone_number: extractErrorMessage(err.phone_number) }));
        }
        if (err.password) {
          setValidationErrors(prev => ({ ...prev, password: extractErrorMessage(err.password) }));
        }
        if (err.password2) {
          setValidationErrors(prev => ({ ...prev, password2: extractErrorMessage(err.password2) }));
        }
        if (err.first_name) {
          setValidationErrors(prev => ({ ...prev, first_name: extractErrorMessage(err.first_name) }));
        }
        if (err.last_name) {
          setValidationErrors(prev => ({ ...prev, last_name: extractErrorMessage(err.last_name) }));
        }
        if (err.detail) {
          alert(extractErrorMessage(err.detail));
        }
      } else {
        alert(extractErrorMessage(err) || 'خطایی رخ داد، دوباره تلاش کنید');
      }
    }
  };

  return (
    <div
      className="w-full min-h-dvh bg-Signin_background text-Primary flex items-center justify-center p-3 sm:p-4 md:p-8"
      dir="rtl"
    >
      <div className="w-full max-w-[400px] sm:max-w-md lg:max-w-lg bg-Background border border-Card_border rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mx-2 sm:mx-0">

        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
          ساخت حساب
          <br />
          کاربری جدید
        </h1>

        <h2 className="text-xs sm:text-sm mt-2 text-Muted">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <span className="cursor-pointer text-Secondary hover:text-Secondary_hover transition-colors">
            <Link to="/">
              ورود
            </Link>
          </span>
        </h2>

        {/* نمایش پیام موفقیت */}
        {success && (
          <div className="mt-3 p-2 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
            ثبت‌نام با موفقیت انجام شد! در حال انتقال به صفحه ورود...
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex mt-4 sm:mt-6 flex-col gap-2 sm:gap-3"
        >
          {/* نام و نام خانوادگی */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs text-Muted">
                نام
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={loading}
                className={`w-full h-9 sm:h-10 bg-Input_bg border rounded-md px-2 sm:px-3 text-sm sm:text-base text-Primary outline-none transition-colors ${
                  validationErrors.first_name ? 'border-red-500 focus:border-red-500' : 'border-Input_border focus:border-Secondary'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {validationErrors.first_name && (
                <span className="text-[10px] text-red-500">{validationErrors.first_name}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs text-Muted">
                نام خانوادگی
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={loading}
                className={`w-full h-9 sm:h-10 bg-Input_bg border rounded-md px-2 sm:px-3 text-sm sm:text-base text-Primary outline-none transition-colors ${
                  validationErrors.last_name ? 'border-red-500 focus:border-red-500' : 'border-Input_border focus:border-Secondary'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {validationErrors.last_name && (
                <span className="text-[10px] text-red-500">{validationErrors.last_name}</span>
              )}
            </div>
          </div>

          {/* نام کاربری و تلفن */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs text-Muted">
                نام کاربری
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                className={`w-full h-9 sm:h-10 bg-Input_bg border rounded-md px-2 sm:px-3 text-sm sm:text-base text-Primary outline-none transition-colors ${
                  validationErrors.username ? 'border-red-500 focus:border-red-500' : 'border-Input_border focus:border-Secondary'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {validationErrors.username && (
                <span className="text-[10px] text-red-500">{validationErrors.username}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs text-Muted">
                شماره تلفن
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                disabled={loading}
                className={`w-full h-9 sm:h-10 bg-Input_bg border rounded-md px-2 sm:px-3 text-sm sm:text-base text-Primary outline-none transition-colors ${
                  validationErrors.phone_number ? 'border-red-500 focus:border-red-500' : 'border-Input_border focus:border-Secondary'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {validationErrors.phone_number && (
                <span className="text-[10px] text-red-500">{validationErrors.phone_number}</span>
              )}
            </div>
          </div>

          {/* ایمیل */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] sm:text-xs text-Muted">
              ایمیل
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className={`w-full h-9 sm:h-10 bg-Input_bg border rounded-md px-2 sm:px-3 text-sm sm:text-base text-Primary outline-none transition-colors ${
                validationErrors.email ? 'border-red-500 focus:border-red-500' : 'border-Input_border focus:border-Secondary'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {validationErrors.email && (
              <span className="text-[10px] text-red-500">{validationErrors.email}</span>
            )}
          </div>

          {/* رمز عبور */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs text-Muted">
                رمز عبور
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className={`w-full h-9 sm:h-10 bg-Input_bg border rounded-md px-2 sm:px-3 text-sm sm:text-base text-Primary outline-none transition-colors ${
                  validationErrors.password ? 'border-red-500 focus:border-red-500' : 'border-Input_border focus:border-Secondary'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {validationErrors.password && (
                <span className="text-[10px] text-red-500">{validationErrors.password}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs text-Muted">
                تکرار رمز عبور
              </label>
              <input
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                disabled={loading}
                className={`w-full h-9 sm:h-10 bg-Input_bg border rounded-md px-2 sm:px-3 text-sm sm:text-base text-Primary outline-none transition-colors ${
                  validationErrors.password2 ? 'border-red-500 focus:border-red-500' : 'border-Input_border focus:border-Secondary'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {validationErrors.password2 && (
                <span className="text-[10px] text-red-500">{validationErrors.password2}</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-9 sm:h-10 rounded-lg bg-Secondary hover:bg-Secondary_pressed text-white text-sm font-medium transition-colors mt-1 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;