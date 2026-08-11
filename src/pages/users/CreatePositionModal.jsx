// components/CreatePositionModal.jsx
import { useState } from "react";

const CreatePositionModal = ({ title, onClose, onSubmit }) => {
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(true);

    try {
      await onSubmit({ display_name: displayName, code });
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
        className="bg-Background border border-Card_border rounded-xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-sm font-medium text-Primary mb-4">{title}</h4>

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

          {generalError && <p className="text-xs text-red-500">{generalError}</p>}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="submit"
              disabled={submitting || !displayName.trim() || !code.trim()}
              className="flex-1 h-10 rounded-lg bg-Secondary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "در حال ثبت..." : "ثبت سمت"}
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

export default CreatePositionModal;