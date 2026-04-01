import Field from './Field.jsx'

function CourseFormCard({
  formMode,
  formValues,
  isSubmittingForm,
  onClearForm,
  onSubmit,
  setFormValues,
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink-950">
            {formMode === 'create' ? 'Create course' : 'Update course'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Uses the same request body shown in Swagger:{' '}
            <span className="font-semibold">{'{ courseName, description }'}</span>.
          </p>
        </div>
        {formMode === 'edit' ? (
          <button
            type="button"
            onClick={onClearForm}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Switch to create
          </button>
        ) : null}
      </div>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <Field
          label="Course name"
          name="courseName"
          value={formValues.courseName}
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              courseName: event.target.value,
            }))
          }
          placeholder="Introduction to Software Engineering"
        />
        <Field
          label="Description"
          name="description"
          as="textarea"
          value={formValues.description}
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Summarize the course scope, learning outcomes, or syllabus focus."
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClearForm}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
          >
            Clear form
          </button>
          <button
            type="submit"
            disabled={isSubmittingForm}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmittingForm
              ? 'Saving...'
              : formMode === 'create'
                ? 'Create course'
                : 'Save updates'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CourseFormCard
