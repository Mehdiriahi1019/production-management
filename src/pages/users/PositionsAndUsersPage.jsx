// pages/PositionsAndUsersPage.jsx
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation, useSearchParams, useNavigate, Link } from "react-router-dom";
import { getPositionsListThunk } from "../../features/auth/positions/Positionslist/Positionsliststhunk";
import { resetPositionsList } from "../../features/auth/positions/Positionslist/Positionslistslice";
import { getUsersThunk } from "../../features/users/userslist/Usersthunk";
import { getUsersPositionThunk } from "../../features/auth/positions/Usersposition/Userspositionthunk";
import { getPositionDetailService } from "../../features/auth/positions/Positiondetail/Positiondetailservice";
import { createPositionThunk } from "../../features/auth/positions/createposition/CreatePositionThunk";
import { updatePositionThunk } from "../../features/auth/positions/updatePosition/updatePositionThunk";
import { getPositionsThunk } from "../../features/auth/positions/Positionthunk";

// ======== کامپوننت‌های جداشده ========
import PositionTree from "./PositionTree";
import UsersTable from "./UsersTable";
import CreatePositionModal from "./CreatePositionModal";

// ======== مودال ویرایش سمت ========
// ======== مودال ویرایش سمت ========
// ======== مودال ویرایش سمت ========
const EditPositionModal = ({ position, onClose, onSubmit }) => {
  const dispatch = useDispatch();

  const allPositions = useSelector((state) => state.positions?.positions || []);
  const positionsLoading = useSelector((state) => state.positions?.loading || false);
  const positionsLoaded = useSelector((state) => state.positions?.loaded || false);

  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [parentId, setParentId] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  useEffect(() => {
    if (!positionsLoaded && !positionsLoading) {
      dispatch(getPositionsThunk());
    }
  }, [dispatch, positionsLoaded, positionsLoading]);

  useEffect(() => {
    if (position) {
      setDisplayName(position.display_name || "");
      setCode(position.code || "");

      // ======== اگر parent وجود داشت، در لیست allPositions پیدا کن ========
      const parentValue = position.parent || position.parent_id;
      if (parentValue) {
        const foundParent = allPositions.find((p) => p.id === parentValue);
        setParentId(foundParent ? foundParent.id : null);
      } else {
        setParentId(null);
      }

      setIsActive(position.is_active !== undefined ? position.is_active : true);
    }
  }, [position, allPositions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(true);

    const payload = {
      display_name: displayName,
      code: code,
      is_active: isActive,
    };

    // ======== اگر parentId null باشه، null ارسال میشه ========
    payload.parent_id = parentId;

    if (position) {
      if (position.updated_at) {
        payload.updated_at = position.updated_at;
      }
      if (position.updated_by) {
        payload.updated_by = position.updated_by;
      }
    }

    console.log("payload:", payload);

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const nextFieldErrors = {};
      Object.entries(err || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) nextFieldErrors[key] = value.join("، ");
      });
      setFieldErrors(nextFieldErrors);
      if (err?.message?.fa) setGeneralError(err.message.fa);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-Background border border-Card_border rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-sm font-medium text-Primary mb-4">ویرایش سمت</h4>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-Muted">عنوان سمت</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={submitting}
              className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus:outline-none focus:ring-1 focus:ring-Secondary"
            />
            {fieldErrors.display_name && (
              <span className="text-[11px] text-red-500">{fieldErrors.display_name}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-Muted">کد</label>
            <input
              type="text"
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
              className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary text-left focus:outline-none focus:ring-1 focus:ring-Secondary"
            />
            {fieldErrors.code && (
              <span className="text-[11px] text-red-500">{fieldErrors.code}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-Muted">وضعیت</label>
            <select
              value={isActive ? "true" : "false"}
              onChange={(e) => setIsActive(e.target.value === "true")}
              disabled={submitting}
              className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus:outline-none focus:ring-1 focus:ring-Secondary"
            >
              <option value="true">فعال</option>
              <option value="false">غیرفعال</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-Muted">والد</label>
            <select
              value={parentId === null ? "" : parentId}
              onChange={(e) => {
                const value = e.target.value;
                // ======== اگر مقدار خالی بود، null بذار ========
                setParentId(value === "" ? null : value);
              }}
              disabled={submitting}
              className="bg-Input_bg border border-Card_border rounded-lg px-3 py-2 text-sm text-Primary focus:outline-none focus:ring-1 focus:ring-Secondary"
            >
              <option value="">بدون والد</option>
              {allPositions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name} ({p.code})
                </option>
              ))}
            </select>
            {fieldErrors.parent_id && (
              <span className="text-[11px] text-red-500">{fieldErrors.parent_id}</span>
            )}
          </div>

          {generalError && <p className="text-xs text-red-500">{generalError}</p>}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="submit"
              disabled={submitting || !displayName.trim() || !code.trim()}
              className="flex-1 h-10 rounded-lg bg-Secondary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "در حال ویرایش..." : "ویرایش سمت"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-10 rounded-lg border border-Card_border text-Primary text-sm font-medium hover:bg-Input_bg transition-colors"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ======== یه آیتم توی زیرمنوی فرزندها ========
// ======== فرزندها دیگه از ریداکس خونده می‌شن (نه state لوکال) ========
// ======== پس با collapse/expand مجدد یا remount شدن، دوباره فچ نمی‌زنه ========
const PositionSubmenuItem = ({ position, depth, dispatch, selectedId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const childState = useSelector(
    (state) => state.positionsList.childrenByParent[position.id]
  );
  const children = childState?.data ?? null;
  const childrenLoading = childState?.loading ?? false;
  const childrenLoaded = childState?.loaded ?? false;
  const childrenError = childState?.error?.message?.fa || childState?.error || null;

  const fetchChildren = () => {
    return dispatch(getPositionsListThunk({ parent_id: position.id })).unwrap();
  };

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const next = !isExpanded;
    setIsExpanded(next);

    // ======== فقط اگه توی ریداکس لود نشده بود (یا در حال لود نبود)، درخواست بزن ========
    if (next && !childrenLoaded && !childrenLoading) {
      fetchChildren();
    }
  };

  const handleAddChildClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCreateModal(true);
  };

  const handleCreateChild = async (values) => {
    const result = await dispatch(
      createPositionThunk({ ...values, parent_id: position.id })
    ).unwrap();

    setIsExpanded(true);
    await fetchChildren(); // بعد از ساخت فرزند جدید، باید دوباره فچ بشه چون داده تغییر کرده
    return result;
  };

  const isActive = selectedId === position.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md transition-colors ${
          isActive ? "bg-Secondary/10" : "hover:bg-Input_bg"
        }`}
      >
        <button
          type="button"
          onClick={handleToggle}
          className="w-5 h-5 flex items-center justify-center rounded text-Muted hover:text-Secondary hover:bg-Secondary/10 transition-colors flex-shrink-0"
        >
          {childrenLoading ? (
            <i className="fas fa-spinner fa-spin text-[10px]" />
          ) : (
            <i
              className={`fas fa-chevron-${
                isExpanded ? "down" : "left"
              } text-[10px]`}
            />
          )}
        </button>

        <Link
          to={`/positionsanduserspage/${position.id}`}
          state={{ position }}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          <span className="text-xs text-Muted flex-shrink-0">{position.code || "—"}</span>
          <span className="text-xs text-Primary truncate">
            {position.display_name || "—"}
          </span>

          {!position.is_active && (
            <span className="text-[10px] text-Muted bg-Disabled px-1.5 py-0.5 rounded-full flex-shrink-0">
              غیرفعال
            </span>
          )}

          {isActive && (
            <span className="text-[10px] text-Secondary bg-Secondary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
              انتخاب شده
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={handleAddChildClick}
          className="w-5 h-5 flex items-center justify-center rounded text-Muted hover:text-Secondary hover:bg-Secondary/10 transition-colors flex-shrink-0"
        >
          <i className="fas fa-plus text-[10px]" />
        </button>
      </div>

      {isExpanded && (
        <div
          className="mr-2 border-r-2 border-Card_border pr-3"
          style={{ marginRight: `${depth * 4}px` }}
        >
          {childrenError && (
            <p className="text-xs text-red-500 py-1">{childrenError}</p>
          )}

          {!childrenLoading && !childrenError && children?.length === 0 && (
            <p className="text-xs text-Muted py-1">زیرمجموعه‌ای ندارد.</p>
          )}

          {!childrenLoading && !childrenError && children?.map((child) => (
            <PositionSubmenuItem
              key={child.id}
              position={child}
              depth={depth + 1}
              dispatch={dispatch}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePositionModal
          title={`افزودن زیرمجموعه برای «${position.display_name}»`}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateChild}
        />
      )}
    </div>
  );
};

// ======== ردیف والدِ اصلی ========
const PositionRootItem = ({
  position,
  dispatch,
  selectedId,
  isExpanded,
  onToggle,
  onAddChild,
  childrenData,
}) => {
  const isActive = selectedId === position.id;
  const { data: children, loading: childrenLoading, error: childrenError } =
    childrenData || { data: null, loading: false, error: null };

  return (
    <div
      className={`border-b border-Card_border last:border-b-0 transition-colors ${
        isActive ? "bg-Secondary/5" : ""
      }`}
    >
      <div
        className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors ${
          isActive ? "bg-Secondary/10" : "hover:bg-Input_bg"
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle(position);
          }}
          className="w-5 h-5 flex items-center justify-center rounded text-Muted hover:text-Secondary hover:bg-Secondary/10 transition-colors flex-shrink-0"
        >
          {childrenLoading ? (
            <i className="fas fa-spinner fa-spin text-[10px]" />
          ) : (
            <i
              className={`fas fa-chevron-${
                isExpanded ? "down" : "left"
              } text-[10px]`}
            />
          )}
        </button>

        <Link
          to={`/positionsanduserspage/${position.id}`}
          state={{ position }}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          <span className="text-xs text-Muted flex-shrink-0">{position.code || "—"}</span>
          <span className="text-sm text-Primary font-medium truncate">
            {position.display_name || "—"}
          </span>

          {!position.is_active && (
            <span className="text-[10px] text-Muted bg-Disabled px-1.5 py-0.5 rounded-full flex-shrink-0">
              غیرفعال
            </span>
          )}

          {isActive && (
            <span className="text-[10px] text-Secondary bg-Secondary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
              انتخاب شده
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddChild(position);
          }}
          className="w-5 h-5 flex items-center justify-center rounded text-Muted hover:text-Secondary hover:bg-Secondary/10 transition-colors flex-shrink-0"
        >
          <i className="fas fa-plus text-[10px]" />
        </button>
      </div>

      {isExpanded && (
        <div className="px-3 pb-2">
          <div className="bg-Input_bg/40 border border-Card_border rounded-lg px-3 py-2 mr-4">
            {childrenLoading && (
              <p className="text-xs text-Muted py-1">در حال بارگذاری...</p>
            )}

            {!childrenLoading && childrenError && (
              <p className="text-xs text-red-500 py-1">{childrenError}</p>
            )}

            {!childrenLoading && !childrenError && children?.length === 0 && (
              <p className="text-xs text-Muted py-1">زیرمجموعه‌ای ندارد.</p>
            )}

            {!childrenLoading && !childrenError && children?.map((child) => (
              <PositionSubmenuItem
                key={child.id}
                position={child}
                depth={1}
                dispatch={dispatch}
                selectedId={selectedId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PositionsAndUsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { positionId } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const expandedId = searchParams.get("expanded");

  const positions = useSelector((state) => state.positionsList.positions);
  const positionsLoading = useSelector((state) => state.positionsList.loading);
  const positionsError = useSelector((state) => state.positionsList.error);
  const positionsLoaded = useSelector((state) => state.positionsList.loaded);

  // ======== کش فرزندان هر پوزیشن، حالا از ریداکس (نه state لوکال) ========
  // پس با collapse/expand، از بین نمی‌ره و دوباره فچ نمی‌زنه
  const childrenByParent = useSelector((state) => state.positionsList.childrenByParent);

  const usersPositionData = useSelector((state) => state.usersPosition.data);
  const usersPositionLoading = useSelector((state) => state.usersPosition.loading);
  const usersPositionError = useSelector((state) => state.usersPosition.error);
  const usersPositionLoaded = useSelector((state) => state.usersPosition.loaded);

  const [createModal, setCreateModal] = useState(null);
  const [editModal, setEditModal] = useState(null);

  const [positionDetail, setPositionDetail] = useState(null);
  const [positionDetailLoading, setPositionDetailLoading] = useState(false);
  const [positionDetailError, setPositionDetailError] = useState(null);

  const hasFetchedPositions = useRef(false);
  const hasFetchedUsersPosition = useRef(false);

  // ======== بارگذاری سمت‌ها برای لیست والدین ========
  useEffect(() => {
    if (!positionsLoaded && !positionsLoading && !hasFetchedPositions.current) {
      hasFetchedPositions.current = true;
      dispatch(getPositionsListThunk({ limit: 20, offset: 0 }));
    }
  }, [dispatch, positionsLoaded, positionsLoading]);

  // ======== بارگذاری همه سمت‌ها برای سلکت والد در مودال ویرایش ========
  useEffect(() => {
    if (!positionsLoaded && !positionsLoading) {
      dispatch(getPositionsThunk());
    }
  }, [dispatch, positionsLoaded, positionsLoading]);

  useEffect(() => {
    if (!usersPositionLoaded && !usersPositionLoading && !hasFetchedUsersPosition.current) {
      hasFetchedUsersPosition.current = true;
      dispatch(getUsersPositionThunk());
    }
  }, [dispatch, usersPositionLoaded, usersPositionLoading]);

  useEffect(() => {
    if (!positionId) {
      setPositionDetail(null);
      setPositionDetailError(null);
      return;
    }

    let isMounted = true;
    setPositionDetailLoading(true);
    setPositionDetailError(null);

    getPositionDetailService(positionId)
      .then((res) => {
        if (isMounted) setPositionDetail(res?.data || res);
      })
      .catch((err) => {
        if (isMounted)
          setPositionDetailError(err?.message?.fa || "خطا در دریافت جزئیات سمت");
      })
      .finally(() => {
        if (isMounted) setPositionDetailLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [positionId]);

  const getPositionName = (positionId) => {
    if (!positionId) return "—";

    const findPosition = (list, id) => {
      for (const item of list) {
        if (item.id === id) {
          return item.display_name;
        }
        if (item.children && item.children.length > 0) {
          const found = findPosition(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const name = findPosition(positions, positionId);
    return name || "—";
  };

  const fetchRootChildren = (positionId) => {
    return dispatch(getPositionsListThunk({ parent_id: positionId })).unwrap();
  };

  const handleToggleRoot = (position) => {
    const next = new URLSearchParams(searchParams);

    if (expandedId === position.id) {
      next.delete("expanded");
      setSearchParams(next);
      return;
    }

    next.set("expanded", position.id);
    setSearchParams(next);

    const existing = childrenByParent[position.id];
    // ======== فقط اگه توی ریداکس نبود یا لود/در حال لود نبود، فچ بزن ========
    if (!existing || (!existing.loaded && !existing.loading)) {
      fetchRootChildren(position.id);
    }
  };

  const handleBackToParents = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("expanded");
    setSearchParams(next);

    // ======== بازگشت واقعی به ریشه: این‌جا کش فرزندان هم پاک می‌شه (داخل resetPositionsList) ========
    dispatch(resetPositionsList());
    dispatch(getPositionsListThunk({ limit: 20, offset: 0 }));

    if (positionId) {
      navigate("/positionsanduserspage");
    }
  };

  const handleBack = () => {
    if (expandedId) {
      const next = new URLSearchParams(searchParams);
      next.delete("expanded");
      setSearchParams(next);
    }
    navigate(-1);
  };

  const handleOpenCreateRoot = () => {
    setCreateModal({ parentId: null, parentLabel: null });
  };

  const handleOpenCreateChildForRoot = (position) => {
    setCreateModal({ parentId: position.id, parentLabel: position.display_name });
  };

  const handleCreatePositionSubmit = async (values) => {
    const payload = { ...values };
    if (createModal.parentId) {
      payload.parent_id = createModal.parentId;
    }

    const result = await dispatch(createPositionThunk(payload)).unwrap();

    if (createModal.parentId === null) {
      dispatch(resetPositionsList());
      dispatch(getPositionsListThunk({ limit: 20, offset: 0 }));
    } else {
      const next = new URLSearchParams(searchParams);
      next.set("expanded", createModal.parentId);
      setSearchParams(next);
      fetchRootChildren(createModal.parentId); // داده عوض شده، باید دوباره فچ بشه
    }

    return result;
  };

  const handleOpenEditModal = () => {
    if (positionDetail) {
      setEditModal({
        positionId: positionId,
        positionDetail: positionDetail,
      });
    }
  };

  const handleEditPositionSubmit = async (data) => {
    const result = await dispatch(
      updatePositionThunk({
        id: editModal.positionId,
        data: data,
      })
    ).unwrap();

    const updatedDetail = await getPositionDetailService(editModal.positionId);
    setPositionDetail(updatedDetail?.data || updatedDetail);

    dispatch(resetPositionsList());
    dispatch(getPositionsListThunk({ limit: 20, offset: 0 }));

    return result;
  };

  const activePosition =
    location.state?.position ||
    positions.find((p) => p.id === positionId) ||
    null;

  const displayUsers =
    usersPositionData && Array.isArray(usersPositionData) ? usersPositionData : [];

  return (
    <div dir="rtl" className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      {/* هدر صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-base font-medium text-Primary">مدیریت سازمان</h1>
          <p className="text-xs text-Muted">لیست سمت‌ها و کاربران</p>
        </div>

        {(positionId || expandedId) && (
          <button
            type="button"
            onClick={handleBack}
            className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-Card_border text-Muted hover:text-Secondary hover:border-Secondary/30 transition-colors text-xs"
          >
            <i className="fas fa-arrow-right text-xs" />
            بازگشت
          </button>
        )}
      </div>

      {/* نمایش اطلاعات سمت انتخاب شده */}
      {positionId && activePosition && (
        <div className="mb-4 p-3 bg-Secondary/5 border border-Secondary/20 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs text-Muted">سمت انتخاب شده:</span>
              <span className="mr-2 text-sm font-medium text-Primary">
                {activePosition.display_name}
              </span>
              <span className="mr-2 text-xs text-Muted">
                ({activePosition.code})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* دو ستون */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ستون چپ - درخت سمت‌ها */}
        <div className="md:col-span-1">
          <PositionTree
            positions={positions}
            positionsLoading={positionsLoading}
            positionsError={positionsError}
            expandedId={expandedId}
            selectedId={positionId}
            onToggleRoot={handleToggleRoot}
            onAddChild={handleOpenCreateChildForRoot}
            childrenCache={childrenByParent}
            onBackToParents={handleBackToParents}
            onOpenCreateRoot={handleOpenCreateRoot}
          />
        </div>

        {/* ستون راست - جزئیات سمت یا جدول کاربران */}
        <div className="md:col-span-2">
          {positionId ? (
            <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-Card_border">
                <h3 className="text-sm font-medium text-Primary">جزئیات سمت</h3>
              </div>

              {positionDetailLoading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="text-sm text-Muted">در حال بارگذاری...</span>
                </div>
              ) : positionDetailError ? (
                <div className="flex items-center justify-center py-16">
                  <span className="text-sm text-red-500">
                    <i className="fas fa-exclamation-circle ml-1" />
                    {positionDetailError}
                  </span>
                </div>
              ) : positionDetail ? (
                <div className="p-3 sm:p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-Input_bg/30 rounded-lg">
                      <span className="text-xs text-Muted">کد</span>
                      <p className="text-sm text-Primary font-medium">
                        {positionDetail.code || "—"}
                      </p>
                    </div>
                    <div className="p-3 bg-Input_bg/30 rounded-lg">
                      <span className="text-xs text-Muted">عنوان</span>
                      <p className="text-sm text-Primary font-medium">
                        {positionDetail.display_name || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-Input_bg/30 rounded-lg">
                      <span className="text-xs text-Muted">وضعیت</span>
                      <p className="text-sm font-medium">
                        {positionDetail.is_active ? (
                          <span className="text-green-500">
                            <i className="fas fa-check-circle ml-1" />
                            فعال
                          </span>
                        ) : (
                          <span className="text-red-500">
                            <i className="fas fa-times-circle ml-1" />
                            غیرفعال
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-Input_bg/30 rounded-lg">
                      <span className="text-xs text-Muted">والد</span>
                      <p className="text-sm text-Primary font-medium">
                        {getPositionName(positionDetail.parent) !== "—"
                          ? getPositionName(positionDetail.parent)
                          : positionDetail.parent || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-Input_bg/30 rounded-lg">
                      <span className="text-xs text-Muted">تاریخ ایجاد</span>
                      <p className="text-sm text-Primary font-medium">
                        {positionDetail.created_at || "—"}
                      </p>
                    </div>
                    <div className="p-3 bg-Input_bg/30 rounded-lg">
                      <span className="text-xs text-Muted">ایجاد شده توسط</span>
                      <p className="text-sm text-Primary font-medium truncate">
                        {positionDetail.created_by || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-Input_bg/30 rounded-lg">
                      <span className="text-xs text-Muted">بروزرسانی شده توسط</span>
                      <p className="text-sm text-Primary font-medium truncate">
                        {positionDetail.updated_by || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-Card_border">
                    <button
                      onClick={handleOpenEditModal}
                      className="px-4 py-2 bg-Secondary text-white text-xs font-medium rounded-lg hover:bg-Secondary/90 transition-colors"
                    >
                      <i className="fas fa-edit ml-1" />
                      ویرایش
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <UsersTable
              users={displayUsers}
              usersLoading={usersPositionLoading}
              usersError={usersPositionError}
              getPositionName={getPositionName}
              title="کاربران"
              showPositions={true}
            />
          )}
        </div>
      </div>

      {/* مودال ساخت سمت */}
      {createModal && (
        <CreatePositionModal
          title={
            createModal.parentId === null
              ? "افزودن سمت جدید"
              : `افزودن زیرمجموعه برای «${createModal.parentLabel}»`
          }
          onClose={() => setCreateModal(null)}
          onSubmit={handleCreatePositionSubmit}
        />
      )}

      {/* مودال ویرایش سمت */}
      {editModal && (
        <EditPositionModal
          position={editModal.positionDetail}
          onClose={() => setEditModal(null)}
          onSubmit={handleEditPositionSubmit}
        />
      )}
    </div>
  );
};

export default PositionsAndUsersPage;