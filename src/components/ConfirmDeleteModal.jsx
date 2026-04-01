function ConfirmDeleteModal({ pendingDelete, onCancel, onConfirm }) {
  if (!pendingDelete) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_rgba(16,33,61,0.24)]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-red-600">
          Confirm deletion
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-ink-950">
          Remove {pendingDelete.courseName}?
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This sends a request to{' '}
          <span className="font-semibold">DELETE /api/courses/{pendingDelete.id}</span>.
          Make sure this course should really be removed from the catalog.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Delete course
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal
