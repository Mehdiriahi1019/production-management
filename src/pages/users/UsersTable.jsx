// components/UsersTable.jsx
import { Link } from "react-router-dom";

// ======== فیلدهای کاربر برای نمایش کارتی (فقط فیلدهایی که از API برمی‌گردن) ========
const USER_FIELDS = [
  { key: "username", label: "نام کاربری" },
  { key: "first_name", label: "نام" },
  { key: "last_name", label: "نام خانوادگی" },
];

// ======== تابع فرمت کردن مقادیر ========
const formatUserValue = (key, value) => {
  if (!value && value !== 0) {
    return "—";
  }
  return value;
};

// ======== کامپوننت اصلی جدول کاربران ========
const UsersTable = ({
  users,
  usersLoading,
  usersError,
  getPositionName,
  title = "کاربران",
  showPositions = true,
}) => {
  return (
    <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-Card_border">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-Primary">{title}</h3>

          <span className="text-xs text-Muted bg-Input_bg px-2 py-0.5 rounded-full flex-shrink-0">
            {users.length.toLocaleString("fa-IR")}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 min-h-[400px]">
        {/* لودینگ */}
        {usersLoading && users.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <span className="text-sm text-Muted">در حال بارگذاری لیست کاربران...</span>
          </div>
        )}

        {/* خطا */}
        {!usersLoading && usersError && (
          <div className="flex items-center justify-center py-16">
            <span className="text-sm text-red-500">
              <i className="fas fa-exclamation-circle ml-1" />
              {usersError?.message?.fa || "خطا در دریافت لیست کاربران"}
            </span>
          </div>
        )}

        {/* خالی */}
        {!usersLoading && !usersError && users.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <span className="text-sm text-Muted">
              <i className="fas fa-inbox ml-1" />
              هیچ کاربری یافت نشد.
            </span>
          </div>
        )}

        {/* لیست کاربران */}
        {!usersLoading && !usersError && users.length > 0 && (
          <>
            {/* ======== نمایش کارتی - موبایل ======== */}
            <div className="lg:hidden flex flex-col gap-4">
              {users.map((user) => {
                const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`;
                const positions = user.positions || [];

                return (
                  <div
                    key={user.id}
                    className="bg-Background border border-Card_border rounded-xl overflow-hidden"
                  >
                    {/* هدر کارت */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-Card_border">
                      <div className="w-10 h-10 rounded-full bg-Secondary/15 text-Secondary flex items-center justify-center font-medium text-sm flex-shrink-0">
                        {initials || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-Primary text-sm truncate">
                          {user.first_name || "—"} {user.last_name || ""}
                        </p>
                        <p className="text-xs text-Muted truncate">{user.username}</p>
                      </div>

                      <div className="mr-auto flex items-center gap-1.5 flex-shrink-0">
                        <Link
                          to={`/users/edit/${user.id}`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-Muted hover:text-Secondary hover:bg-Secondary/10 transition-colors"
                        >
                          <i className="fas fa-pen text-xs" />
                        </Link>
                      </div>
                    </div>

                    {/* فیلدها */}
                    <div className="divide-y divide-Card_border">
                      {USER_FIELDS.map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-Muted">{label}</span>
                          <span className="text-xs text-Primary font-medium">
                            {formatUserValue(key, user[key])}
                          </span>
                        </div>
                      ))}
                      {/* نمایش سمت‌ها */}
                      {showPositions && (
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-Muted">سمت‌ها</span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {positions.length > 0 ? (
                              positions.map((pos) => (
                                <span
                                  key={pos.id}
                                  className="text-[10px] bg-Secondary/10 text-Secondary px-2 py-0.5 rounded-full"
                                >
                                  {pos.display_name || getPositionName?.(pos.id) || "—"}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-Muted">—</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ======== نمایش جدولی - دسکتاپ ======== */}
            <div className="hidden lg:block">
              <table className="w-full text-xs table-fixed">
                <thead>
                  <tr className="border-b border-Card_border bg-Input_bg">
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-Muted">
                      <i className="fas fa-user ml-1" />
                      نام کاربری
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-Muted">
                      <i className="fas fa-id-card ml-1" />
                      نام و نام خانوادگی
                    </th>
                    {showPositions && (
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-Muted">
                        <i className="fas fa-briefcase ml-1" />
                        سمت‌ها
                      </th>
                    )}
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-Muted w-14">
                      عملیات
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-Card_border">
                  {users.map((user) => {
                    const positions = user.positions || [];
                    return (
                      <tr key={user.id} className="hover:bg-Input_bg transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-Secondary/20 flex items-center justify-center text-Secondary text-xs font-medium flex-shrink-0">
                              {user.first_name?.[0] || user.username?.[0] || "?"}
                            </div>
                            <span className="text-xs text-Primary truncate">
                              {user.username || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs text-Primary truncate block">
                            {user.first_name || "—"} {user.last_name || ""}
                          </span>
                        </td>
                        {showPositions && (
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {positions.length > 0 ? (
                                positions.map((pos) => (
                                  <span
                                    key={pos.id}
                                    className="text-[10px] bg-Secondary/10 text-Secondary px-2 py-0.5 rounded-full"
                                  >
                                    {pos.display_name || getPositionName?.(pos.id) || "—"}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-Muted">—</span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-center">
                          <Link
                            to={`/users/edit/${user.id}`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-Muted hover:text-Secondary hover:bg-Secondary/10 transition-colors"
                          >
                            <i className="fas fa-pen text-xs" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UsersTable;