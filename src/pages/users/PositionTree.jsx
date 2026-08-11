// components/PositionTree.jsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { getPositionsListThunk } from "../../features/auth/positions/Positionslist/Positionsliststhunk";
import { createPositionThunk } from "../../features/auth/positions/createposition/CreatePositionThunk";
import CreatePositionModal from "./CreatePositionModal";

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
        console.log('📦 فرزندان دریافت شدند برای:', position.display_name, res?.data);
        setChildren(res?.data || []);
      })
      .catch((err) => {
        console.error('❌ خطا در دریافت فرزندان:', err);
        setChildrenError(err?.message?.fa || "خطا در دریافت زیرمجموعه‌ها");
      })
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

          {!childrenLoading && !childrenError && children && children.length > 0 && (
            <div className="space-y-0.5">
              {children.map((child) => (
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

            {!childrenLoading && !childrenError && children && children.length > 0 && (
              <div className="space-y-0.5">
                {children.map((child) => (
                  <PositionSubmenuItem
                    key={child.id}
                    position={child}
                    depth={1}
                    dispatch={dispatch}
                    selectedId={selectedId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ======== کامپوننت اصلی درخت سمت‌ها ========
const PositionTree = ({
  positions,
  positionsLoading,
  positionsError,
  expandedId,
  selectedId,
  onToggleRoot,
  onAddChild,
  childrenCache,
  onBackToParents,
  onOpenCreateRoot,
}) => {
  const dispatch = useDispatch();
  
  const showSkeleton = positionsLoading && positions.length === 0;
  const showError = !positionsLoading && positionsError;
  const showEmpty = !positionsLoading && !positionsError && positions.length === 0;
  const showList = !positionsLoading && !positionsError && positions.length > 0;

  return (
    <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-Card_border">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-Primary">
            {expandedId ? "زیرمجموعه‌ها" : "سمت‌ها"}
          </h3>

          <span className="text-xs text-Muted bg-Input_bg px-2 py-0.5 rounded-full flex-shrink-0">
            {positions.length.toLocaleString("fa-IR")}
          </span>
        </div>

        {expandedId && (
          <button
            type="button"
            onClick={onBackToParents}
            className="mt-3 w-full h-9 flex items-center justify-center gap-1.5 rounded-lg border border-Card_border text-Primary text-xs font-medium hover:bg-Input_bg transition-colors"
          >
            <i className="fas fa-sync-alt text-xs" />
            بازگشت به لیست والدها
          </button>
        )}

        {!expandedId && (
          <button
            type="button"
            onClick={onOpenCreateRoot}
            className="mt-3 w-full h-9 flex items-center justify-center gap-1.5 rounded-lg border border-Card_border text-Primary text-xs font-medium hover:bg-Input_bg transition-colors"
          >
            <i className="fas fa-plus text-xs" />
            افزودن سمت
          </button>
        )}
      </div>

      <div className="max-h-[400px] md:max-h-[600px] overflow-y-auto">
        {showSkeleton && (
          <div className="divide-y divide-Card_border">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-3 py-2.5"
              >
                <div className="w-5 h-5 flex-shrink-0">
                  <div className="w-full h-full bg-Input_bg rounded animate-pulse"></div>
                </div>
                <div className="h-4 bg-Input_bg rounded animate-pulse w-12"></div>
                <div className="h-4 bg-Input_bg rounded animate-pulse flex-1"></div>
              </div>
            ))}
          </div>
        )}

        {showError && (
          <div className="px-3 py-6 text-center text-xs text-red-500">
            <i className="fas fa-exclamation-circle ml-1" />
            {positionsError?.message?.fa ||
              "خطا در دریافت لیست سمت‌ها"}
          </div>
        )}

        {showEmpty && (
          <div className="px-3 py-6 text-center text-xs text-Muted">
            <i className="fas fa-inbox ml-1" />
            هیچ سمتی ثبت نشده است.
          </div>
        )}

        {showList && (
          <div className="divide-y divide-Card_border">
            {positions.map((position) => (
              <PositionRootItem
                key={position.id}
                position={position}
                dispatch={dispatch}
                selectedId={selectedId}
                isExpanded={expandedId === position.id}
                onToggle={onToggleRoot}
                onAddChild={onAddChild}
                childrenData={childrenCache[position.id]}
              />
            ))}
          </div>
        )}

        {positionsLoading && positions.length > 0 && (
          <div className="divide-y divide-Card_border opacity-60">
            {positions.map((position) => (
              <PositionRootItem
                key={position.id}
                position={position}
                dispatch={dispatch}
                selectedId={selectedId}
                isExpanded={expandedId === position.id}
                onToggle={onToggleRoot}
                onAddChild={onAddChild}
                childrenData={childrenCache[position.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionTree;