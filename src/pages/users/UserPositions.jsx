// components/UserPositions.jsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getPositionsThunk } from "../../features/auth/positions/Positionthunk";
import { assignPositionsThunk } from "../../features/auth/positions/assignposition/Assignpositionsthunk";
import { unassignPositionsThunk } from "../../features/auth/positions/Unassignpositions/Unassignpositionsthunk";

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

// NOTE: positions no longer come from getPositionsThunk() filtered by user_id.
// That thunk returns the GLOBAL list of positions (for the <select> options),
// whose items don't even have a user_id field, so the old filter always
// returned []. The user's own positions come from the user-details endpoint
// (user.positions), same as before the components were split — so this
// component now receives `user` as a prop and reads from it, and calls
// `onPositionsChange` (or `refetchUser`) after mutations so the parent can
// resync from the server.
const UserPositions = ({ userId, user, onUserPositionsChange, refetchUser }) => {
  const dispatch = useDispatch();

  const userPositions = user?.positions || [];

  const [showAddPosition, setShowAddPosition] = useState(false);
  const [isAddingPosition, setIsAddingPosition] = useState(false);

  const [positionOptions, setPositionOptions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState(null);
  const [assignError, setAssignError] = useState(null);
  const [removingPositionId, setRemovingPositionId] = useState(null);
  const [removePositionError, setRemovePositionError] = useState(null);

  const [draftPositionId, setDraftPositionId] = useState("");
  const [draftIsPrimary, setDraftIsPrimary] = useState(false);
  const [pendingPositions, setPendingPositions] = useState([]);

  const [selectedPositions, setSelectedPositions] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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

  const selectablePositions = positionOptions.filter(
    (pos) =>
      !userPositions.some((up) => up.id === pos.id) &&
      !pendingPositions.some((pp) => pp.position_id === pos.id)
  );

  const handleAddDraftPosition = () => {
    if (!draftPositionId) return;

    const positionData = positionOptions.find((p) => p.id === draftPositionId);
    if (!positionData) return;

    setPendingPositions((prev) => {
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

    setDraftPositionId("");
    setDraftIsPrimary(false);
  };

  const handleRemovePendingPosition = (positionId) => {
    setPendingPositions((prev) => prev.filter((p) => p.position_id !== positionId));
  };

  const handleConfirmPositions = async () => {
    if (pendingPositions.length === 0) return;

    setIsAddingPosition(true);
    setAssignError(null);

    const positionsPayload = pendingPositions.map(({ position_id, is_primary }) => ({
      position_id,
      is_primary,
    }));

    try {
      await dispatch(
        assignPositionsThunk({ userId, positions: positionsPayload })
      ).unwrap();

      // Resync from server instead of guessing the shape locally.
      if (refetchUser) {
        await refetchUser();
      } else if (onUserPositionsChange) {
        const positionsToAdd = pendingPositions.map((p) => ({
          id: p.position_id,
          display_name: p.display_name,
          code: p.code,
          is_primary: p.is_primary,
          start_date: new Date().toLocaleDateString("fa-IR"),
          end_date: null,
        }));
        onUserPositionsChange([...userPositions, ...positionsToAdd]);
      }

      setShowAddPosition(false);
      setPendingPositions([]);
      setDraftPositionId("");
      setDraftIsPrimary(false);
    } catch (err) {
      setAssignError(extractErrorMessage(err, "خطا در افزودن سمت"));
    } finally {
      setIsAddingPosition(false);
    }
  };

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
      await dispatch(unassignPositionsThunk(selectedPositions)).unwrap();

      if (refetchUser) {
        await refetchUser();
      } else if (onUserPositionsChange) {
        onUserPositionsChange(userPositions.filter((p) => !selectedPositions.includes(p.id)));
      }
      setSelectedPositions([]);
    } catch (err) {
      setRemovePositionError(extractErrorMessage(err, "خطا در حذف سمت‌ها"));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleRemovePosition = async (positionId) => {
    setRemovingPositionId(positionId);
    setRemovePositionError(null);

    try {
      await dispatch(unassignPositionsThunk([positionId])).unwrap();

      if (refetchUser) {
        await refetchUser();
      } else if (onUserPositionsChange) {
        onUserPositionsChange(userPositions.filter((p) => p.id !== positionId));
      }
      setSelectedPositions((prev) => prev.filter((id) => id !== positionId));
    } catch (err) {
      setRemovePositionError(extractErrorMessage(err, "خطا در حذف سمت"));
    } finally {
      setRemovingPositionId(null);
    }
  };

  return (
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
                      <span className="text-Primary flex-1">{p.display_name}</span>
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
  );
};

export default UserPositions;