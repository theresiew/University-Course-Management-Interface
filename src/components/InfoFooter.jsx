function InfoFooter() {
  return (
    <section className="mx-auto mt-6 grid max-w-7xl gap-4 lg:grid-cols-2">
      <article className="glass-panel rounded-[1.5rem] border border-white/70 p-5 shadow-[0_16px_48px_rgba(16,33,61,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          API Reference
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Backend base URL:
          <span className="ml-2 font-semibold text-ink-950">
            https://student-management-system-backend.up.railway.app
          </span>
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Swagger docs:
          <span className="ml-2 font-semibold text-brand-700">/api-docs/#/</span>
        </p>
      </article>

      <article className="glass-panel rounded-[1.5rem] border border-white/70 p-5 shadow-[0_16px_48px_rgba(16,33,61,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Submission Notes
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The repository includes Tailwind styling, local run instructions,
          and a static deployment config so it can be pushed to Netlify with
          the standard Vite build command.
        </p>
      </article>
    </section>
  )
}

export default InfoFooter
