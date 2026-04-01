function DashboardHeader({ onLogout, session }) {
  return (
    <header className="flex flex-col gap-6 border-b border-slate-200/80 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
          Supervisor Dashboard
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink-950 sm:text-4xl">
          University course management interface
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Connected to the Railway Student Management backend. You can
          authenticate, browse all courses, inspect a single course by ID,
          create new entries, update existing ones, and delete safely with a
          confirmation step.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-ink-950">{session.email}</p>
          <p>{session.role}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default DashboardHeader
