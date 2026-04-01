import DetailItem from './DetailItem.jsx'

function CourseDetailsCard({ onLoadIntoForm, onCopyCourseId, selectedCourse }) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink-950">Course details</h2>
          <p className="mt-1 text-sm text-slate-600">
            Detailed view for a single course record.
          </p>
        </div>
        {selectedCourse ? (
          <button
            type="button"
            onClick={onLoadIntoForm}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Load into form
          </button>
        ) : null}
      </div>
      {selectedCourse ? (
        <div className="mt-5 space-y-4 rounded-[1.5rem] bg-slate-50 p-4">
          <DetailItem label="Course name" value={selectedCourse.courseName} />
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Course ID
                </p>
                <p className="mt-2 break-all text-sm text-slate-700">
                  {selectedCourse.id || 'Not provided'}
                </p>
              </div>
              {selectedCourse.id ? (
                <button
                  type="button"
                  onClick={onCopyCourseId}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
                >
                  Copy ID
                </button>
              ) : null}
            </div>
          </div>
          <DetailItem
            label="Supervisor ID"
            value={selectedCourse.supervisorId || 'Not assigned yet'}
          />
          <DetailItem label="Created" value={selectedCourse.createdAtLabel} />
          <DetailItem label="Last updated" value={selectedCourse.updatedAtLabel} />
          <DetailItem label="Description" value={selectedCourse.description} multiLine />
        </div>
      ) : (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Pick a course from the list or fetch one by ID to inspect it here.
        </div>
      )}
    </section>
  )
}

export default CourseDetailsCard
