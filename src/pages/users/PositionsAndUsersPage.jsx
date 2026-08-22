// pages/PositionsAndUsersPage.jsx
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation, useSearchParams, useNavigate, Link } from "react-router-dom";
import { getPositionsListThunk } from "../../features/auth/positions/Positionslist/Positionsliststhunk";
import { resetPositionsList } from "../../features/auth/positions/Positionslist/Positionslistslice";
import { getUsersPositionThunk } from "../../features/auth/positions/Usersposition/Userspositionthunk";
import { getPositionDetailService } from "../../features/auth/positions/Positiondetail/Positiondetailservice";
import { getPositionDetailThunk } from "../../features/auth/positions/Positiondetail/Positiondetailthunk";
import { createPositionThunk } from "../../features/auth/positions/createposition/CreatePositionThunk";
import { updatePositionThunk } from "../../features/auth/positions/updatePosition/updatePositionThunk";
import { getPositionsThunk } from "../../features/auth/positions/Positionthunk";
import { getPermissionListThunk } from "../../features/auth/permission/permissionlist/permissionlistthunk";
import UserPermission from "./PositionPermission";
import PositionTree from "./PositionTree";
import UsersTable from "./UsersTable";
import CreatePositionModal from "./CreatePositionModal";
import EditPositionModal from "./EditPositionModal";

// ======== یه آیتم توی زیرمنوی فرزندها ========
const PositionSubmenuItem = ({ position, depth, dispatch, selectedId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState(null);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [childrenError, setChildrenError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchChildren = () => {
    setChildrenLoading(true);
    setChildrenError(null);

    return dispatch(getPositionsListThunk({ parent_id: position.id }))
      .unwrap()
      .then((res) => {
        setChildren(res?.data || []);
      })
      .catch((err) =>
        setChildrenError(err?.message?.fa || "خطا در دریافت زیرمجموعه‌ها")
      )
      .finally(() => setChildrenLoading(false));
  };

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const next = !isExpanded;
    setIsExpanded(next);

    if (next && children === null) {
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
    await fetchChildren();
    return result;
  };

  const isActive = selectedId === position.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md transition-colors ${isActive ? "bg-Secondary/10" : "hover:bg-Input_bg"
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
              className={`fas fa-chevron-${isExpanded ? "down" : "left"
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
      className={`border-b border-Card_border last:border-b-0 transition-colors ${isActive ? "bg-Secondary/5" : ""
        }`}
    >
      <div
        className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors ${isActive ? "bg-Secondary/10" : "hover:bg-Input_bg"
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
              className={`fas fa-chevron-${isExpanded ? "down" : "left"
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

  const usersPositionData = useSelector((state) => state.usersPosition.data);
  const usersPositionLoading = useSelector((state) => state.usersPosition.loading);
  const usersPositionError = useSelector((state) => state.usersPosition.error);
  const usersPositionLoaded = useSelector((state) => state.usersPosition.loaded);

  const [rootChildrenCache, setRootChildrenCache] = useState({});
  const [createModal, setCreateModal] = useState(null);
  const [editModal, setEditModal] = useState(null);

  const [positionDetail, setPositionDetail] = useState(null);
  const [positionDetailLoading, setPositionDetailLoading] = useState(false);
  const [positionDetailError, setPositionDetailError] = useState(null);

  const hasFetchedPositions = useRef(false);
  const hasFetchedUsersPosition = useRef(false);

  // ======== تابع enrich کردن دسترسی‌ها ========
  const enrichPositionWithPermissions = async (positionData) => {
    if (!positionData) return positionData;

    const rawPermissions = positionData.position_perm || positionData.permissions || [];

    const hasFullObjects = rawPermissions.some(p =>
      typeof p === "object" && p.display_name
    );

    if (hasFullObjects || rawPermissions.length === 0) {
      return positionData;
    }

    const permIds = rawPermissions
      .map((p) => {
        if (typeof p === "string") return p;
        if (typeof p === "number") return String(p);
        if (typeof p === "object") {
          return p.id || p.permission_id || p.permission?.id;
        }
        return null;
      })
      .filter(Boolean)
      .map(id => String(id));

    if (permIds.length === 0) {
      return positionData;
    }

    try {
      const result = await dispatch(getPermissionListThunk({ limit: 1000, offset: 0 })).unwrap();
      let allPermissions = [];

      if (result?.data && Array.isArray(result.data)) {
        allPermissions = result.data;
      } else if (Array.isArray(result)) {
        allPermissions = result;
      } else if (result?.results && Array.isArray(result.results)) {
        allPermissions = result.results;
      }

      const enrichedPermissions = allPermissions.filter(p =>
        permIds.includes(String(p.id)) ||
        permIds.includes(String(p.permission_id))
      );

      if (enrichedPermissions.length > 0) {
        return {
          ...positionData,
          position_perm: enrichedPermissions,
          permissions: enrichedPermissions,
        };
      }

      return positionData;
    } catch (error) {
      console.error('خطا در دریافت جزئیات دسترسی‌ها:', error);
      return positionData;
    }
  };

  useEffect(() => {
    if (!expandedId) {
      setRootChildrenCache({});
    }
  }, [expandedId]);

  // ======== بارگذاری پوزیشن‌ها برای لیست والدین ========
  useEffect(() => {
    if (!positionsLoaded && !positionsLoading && !hasFetchedPositions.current) {
      hasFetchedPositions.current = true;
      dispatch(getPositionsListThunk({ limit: 20, offset: 0 }));
    }
  }, [dispatch, positionsLoaded, positionsLoading]);

  // ======== بارگذاری همه پوزیشن‌ها برای سلکت والد در مودال ویرایش ========
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

  // ======== دریافت جزئیات پوزیشن با دسترسی‌های کامل ========
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
      .then(async (res) => {
        if (isMounted) {
          const positionData = res?.data || res;
          const enrichedData = await enrichPositionWithPermissions(positionData);
          setPositionDetail(enrichedData);
        }
      })
      .catch((err) => {
        if (isMounted)
          setPositionDetailError(err?.message?.fa || "خطا در دریافت جزئیات پوزیشن");
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
    setRootChildrenCache((prev) => ({
      ...prev,
      [positionId]: { data: null, loading: true, error: null },
    }));

    return dispatch(getPositionsListThunk({ parent_id: positionId }))
      .unwrap()
      .then((res) =>
        setRootChildrenCache((prev) => ({
          ...prev,
          [positionId]: { data: res?.data || [], loading: false, error: null },
        }))
      )
      .catch((err) =>
        setRootChildrenCache((prev) => ({
          ...prev,
          [positionId]: {
            data: [],
            loading: false,
            error: err?.message?.fa || "خطا در دریافت زیرمجموعه‌ها",
          },
        }))
      );
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

    if (!rootChildrenCache[position.id]) {
      fetchRootChildren(position.id);
    }
  };

  const handleBackToParents = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("expanded");
    setSearchParams(next);

    setRootChildrenCache({});
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
      fetchRootChildren(createModal.parentId);
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
    const enrichedData = await enrichPositionWithPermissions(updatedDetail?.data || updatedDetail);
    setPositionDetail(enrichedData);

    dispatch(resetPositionsList());
    dispatch(getPositionsListThunk({ limit: 20, offset: 0 }));

    return result;
  };

  // ======== تابع رفرش جزئیات پوزیشن ========
  const refreshPositionDetail = () => {
    if (positionId) {
      dispatch(getPositionDetailThunk(positionId));
    }
  };

  // ======== تابع حذف دسترسی از لیست محلی ========
  const handleDeletePermission = (permissionId) => {
    if (positionDetail) {
      const updatedPermissions = positionDetail.position_perm.filter(
        p => p.id !== permissionId
      );
      setPositionDetail({
        ...positionDetail,
        position_perm: updatedPermissions,
        permissions: updatedPermissions,
      });
    }
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
          <p className="text-xs text-Muted">لیست پوزیشن‌ها و کاربران</p>
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

      {/* نمایش اطلاعات پوزیشن انتخاب شده */}
      {positionId && activePosition && (
        <div className="mb-4 p-3 bg-Secondary/5 border border-Secondary/20 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs text-Muted">پوزیشن انتخاب شده:</span>
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
        {/* ستون چپ - درخت پوزیشن‌ها */}
        <div className="md:col-span-1">
          <PositionTree
            positions={positions}
            positionsLoading={positionsLoading}
            positionsError={positionsError}
            expandedId={expandedId}
            selectedId={positionId}
            onToggleRoot={handleToggleRoot}
            onAddChild={handleOpenCreateChildForRoot}
            childrenCache={rootChildrenCache}
            onBackToParents={handleBackToParents}
            onOpenCreateRoot={handleOpenCreateRoot}
          />
        </div>

        {/* ستون راست - جزئیات پوزیشن یا جدول کاربران */}
        <div className="md:col-span-2">
          {positionId ? (
            <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-Card_border">
                <h3 className="text-sm font-medium text-Primary">جزئیات پوزیشن</h3>
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

                  {/* دسترسی‌های این پوزیشن */}
                  <div className="pt-3 border-t border-Card_border">
                    <h4 className="text-xs font-medium text-Primary mb-2">دسترسی‌های این سمت</h4>
                    <UserPermission
                      permissions={positionDetail.position_perm || []}
                      loading={positionDetailLoading}
                      error={positionDetailError}
                      positionId={positionDetail?.id}
                      onPermissionChange={refreshPositionDetail}
                      onDeleteSuccess={handleDeletePermission}
                    />
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

      {/* مودال ساخت پوزیشن */}
      {createModal && (
        <CreatePositionModal
          title={
            createModal.parentId === null
              ? "افزودن پوزیشن جدید"
              : `افزودن زیرمجموعه برای «${createModal.parentLabel}»`
          }
          onClose={() => setCreateModal(null)}
          onSubmit={handleCreatePositionSubmit}
        />
      )}

      {/* مودال ویرایش پوزیشن */}
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