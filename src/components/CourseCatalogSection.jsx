function CourseCatalogSection({
  filteredCourses,
  handleCreateMode,
  handleCourseLookup,
  handleCourseLookupFromList,
  handleEditMode,
  isLoadingCourses,
  isLoadingDetail,
  lastSyncedAtLabel,
  loadAllCourses,
  lookupId,
  searchTerm,
  setLookupId,
  setPendingDelete,
  setSearchTerm,
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-950">Course catalog</h2>
          <p className="mt-1 text-sm text-slate-600">
            Browse all courses returned by <span className="font-semibold">GET /api/courses</span>.
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Last synced: {lastSyncedAtLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAllCourses()}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
        >
          {isLoadingCourses ? 'Refreshing...' : 'Refresh courses'}
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="search">
            Search courses
          </label>
          <input
            id="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by course name, description, or ID"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </div>

        <form className="flex-1" onSubmit={handleCourseLookup}>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="lookupId">
            Get course by ID
          </label>
          <div className="flex gap-3">
            <input
              id="lookupId"
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
              placeholder="Paste a course ID"
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isLoadingDetail}
              className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoadingDetail ? 'Loading...' : 'Open'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
        <div className="hidden grid-cols-[1.35fr_2fr_auto] gap-4 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 md:grid">
          <span>Course</span>
          <span>Description</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-slate-200 bg-white">
          {filteredCourses.length === 0 && !isLoadingCourses ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-slate-500">
                No courses match your current filter yet.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  handleCreateMode()
                }}
                className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
              >
                Clear filter and create a new course
              </button>
            </div>
          ) : null}

          {filteredCourses.map((course) => (
            <article
              key={course.id || course.courseName}
              className="grid gap-4 px-4 py-4 md:grid-cols-[1.35fr_2fr_auto] md:items-center"
            >
              <div>
                <p className="font-semibold text-ink-950">{course.courseName}</p>
                <p className="mt-1 break-all text-xs text-slate-500">{course.id || 'No ID returned'}</p>
              </div>
              <p className="text-sm leading-6 text-slate-600">{course.description}</p>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <button
                  type="button"
                  onClick={() => void handleCourseLookupFromList(course.id)}
                  className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleEditMode(course)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(course)}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CourseCatalogSection
