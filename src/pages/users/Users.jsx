import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { getUsersThunk } from "../../features/users/userslist/Usersthunk";

const FIELDS = [
  { key: "first_name", label: "نام" },
  { key: "last_name", label: "نام خانوادگی" },
  { key: "username", label: "نام کاربری", sortable: true },
  { key: "email", label: "ایمیل" },
  { key: "phone_number", label: "شماره موبایل" },
  { key: "is_active", label: "وضعیت حساب" },
  { key: "is_superuser", label: "سوپر یوزر" },
  { key: "last_login", label: "آخرین ورود", sortable: true },
  { key: "created_at", label: "تاریخ ثبت‌نام", sortable: true },
];

const BooleanIcon = ({ value }) =>
  value ? (
    <i className="fa-solid fa-check text-sm text-green-600" />
  ) : (
    <i className="fa-solid fa-xmark text-sm text-red-500" />
  );

// در مقادیر تاریخ/ساعت، جای دو بخش (تاریخ و ساعت) با هم عوض می‌شود
const swapDateTime = (value) => {
  const str = String(value).trim();
  const parts = str.split(" ").filter(Boolean);
  if (parts.length !== 2) return str;
  const [first, second] = parts;
  return `${second} ${first}`;
};

const formatValue = (key, value) => {
  if (key === "is_staff" || key === "is_superuser") {
    return value ? "بله" : "خیر";
  }
  if (!value && value !== 0) {
    return "—";
  }
  if (key === "last_login" || key === "created_at") {
    return swapDateTime(value);
  }
  return value;
};

const SortIcon = ({ active, direction }) => {
  if (!active) return <i className="fa-solid fa-sort text-[10px] text-Muted/50" />;
  return direction === "asc" ? (
    <i className="fa-solid fa-sort-up text-[10px] text-Secondary" />
  ) : (
    <i className="fa-solid fa-sort-down text-[10px] text-Secondary" />
  );
};

const EditButton = ({ userId }) => (
  <Link
    to={`/users/edit/${userId}`}
    className="w-7 h-7 flex items-center justify-center rounded-lg text-Muted hover:text-Secondary hover:bg-Secondary/10 transition-colors"
  >
    <i className="fa-solid fa-pen text-xs" />
  </Link>
);

const Users = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);

  const [searchParams, setSearchParams] = useSearchParams();

  // مقدار اولیه‌ی همه‌ی state ها از خود URL خونده می‌شه
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [isActive, setIsActive] = useState(searchParams.get("is_active") || ""); // "", "true", "false"
  const [ordering, setOrdering] = useState(searchParams.get("ordering") || ""); // e.g. "-created_at"

  // debounce سرچ
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 1000);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(() => {
    const p = {};
    if (search) p.search = search;
    if (isActive !== "") p.is_active = isActive;
    if (ordering) p.ordering = ordering;
    return p;
  }, [search, isActive, ordering]);

  // هر بار params تغییر کنه: هم درخواست به بک‌اند می‌ره، هم URL آپدیت می‌شه
  useEffect(() => {
    dispatch(getUsersThunk(params));
    setSearchParams(params, { replace: true });
  }, [dispatch, params, setSearchParams]);

  const toggleOrdering = (key) => {
    setOrdering((prev) => {
      if (prev === key) return `-${key}`;
      if (prev === `-${key}`) return "";
      return key;
    });
  };

  const getSortState = (key) => {
    if (ordering === key) return "asc";
    if (ordering === `-${key}`) return "desc";
    return null;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 py-4">
      {/* نوار جستجو و فیلترها */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-xs text-Muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="جستجو بر اساس نام، نام کاربری، ایمیل یا موبایل..."
            className="w-full bg-Input_bg border border-Card_border rounded-lg pr-9 pl-3 py-2 text-sm text-Primary placeholder:text-Muted text-[12px] focus:outline-none focus:ring-1 focus:ring-Secondary"
          />
        </div>

        <select
          value={isActive}
          onChange={(e) => setIsActive(e.target.value)}
          className="bg-Input_bg border text-[12px] border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus:outline-none focus:ring-1 focus:ring-Secondary"
        >
          <option value="">همه‌ی وضعیت‌ها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-Muted">در حال بارگذاری لیست کاربران...</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-red-500">{error?.message?.fa || "خطا در دریافت لیست کاربران"}</span>
        </div>
      )}

      {!loading && !error && (!users || users.length === 0) && (
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-Muted">هیچ کاربری یافت نشد.</span>
        </div>
      )}

      {!loading && !error && users && users.length > 0 && (
        <>
          {/* نمایش کارتی - موبایل */}
          <div className="md:hidden flex flex-col gap-4">
            {users.map((user) => {
              const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`;

              return (
                <div
                  key={user.username}
                  className="bg-Background border border-Card_border rounded-xl overflow-hidden"
                >
                  {/* هدر کارت */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-Card_border">
                    <div className="w-10 h-10 rounded-full bg-Secondary/15 text-Secondary flex items-center justify-center font-medium text-sm flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-Primary text-sm truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-Muted truncate">{user.username}</p>
                    </div>

                    <div className="mr-auto flex items-center gap-1.5 flex-shrink-0">
                      <EditButton userId={user.id} />
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full ${
                          user.is_active ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        <BooleanIcon value={user.is_active} />
                      </span>
                    </div>
                  </div>

                  {/* فیلدها */}
                  <div className="divide-y divide-Card_border">
                    {FIELDS.filter(({ key }) => key !== "first_name" && key !== "last_name" && key !== "is_active").map(
                      ({ key, label }) => (
                        <div key={key} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-Muted">{label}</span>
                          <span className="text-xs text-Primary font-medium">
                            {formatValue(key, user[key])}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* نمایش جدولی - دسکتاپ */}
          <div className="hidden md:block bg-Background border border-Card_border rounded-xl overflow-hidden">
            <table className="w-full text-xs table-fixed">
              <thead>
                <tr className="border-b border-Card_border">
                  {FIELDS.map(({ key, label, sortable }) => (
                    <th key={key} className="px-2 py-2.5 text-center font-medium text-Muted">
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleOrdering(key)}
                          className="inline-flex items-center gap-1 hover:text-Primary transition-colors"
                        >
                          {label}
                          <SortIcon active={ordering === key || ordering === `-${key}`} direction={getSortState(key)} />
                        </button>
                      ) : (
                        label
                      )}
                    </th>
                  ))}
                  <th className="px-2 py-2.5 text-center font-medium text-Muted w-14">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-Card_border">
                {users.map((user) => (
                  <tr key={user.username} className="hover:bg-Input_bg">
                    {FIELDS.map(({ key }) =>
                      key === "is_active" ? (
                        <td key={key} className="px-2 py-2.5 text-Primary text-center">
                          <div className="flex items-center justify-center">
                            <BooleanIcon value={user.is_active} />
                          </div>
                        </td>
                      ) : (
                        <td key={key} className="px-2 py-2.5 text-Primary text-center wrap-break-word">
                          {formatValue(key, user[key])}
                        </td>
                      )
                    )}
                    <td className="px-2 py-2.5 text-center">
                      <div className="flex items-center justify-center">
                        <EditButton userId={user.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Users;