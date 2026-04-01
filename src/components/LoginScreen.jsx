import Banner from './Banner.jsx'
import Field from './Field.jsx'

function LoginScreen({
  error,
  feedback,
  isSigningIn,
  loginValues,
  onSubmit,
  setLoginValues,
  testCredentials,
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/70 px-8 py-10 shadow-[0_24px_80px_rgba(16,33,61,0.12)] sm:px-10">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
          <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
            University Supervisor Console
          </span>
          <h1 className="mt-6 max-w-xl font-display text-4xl leading-tight text-ink-950 sm:text-5xl">
            Manage the course catalog with a calm, professional workflow.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Sign in as the university supervisor to create courses, review the
            catalog, inspect details by course ID, edit records, and safely
            remove outdated offerings using the Railway backend.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              'Secure supervisor authentication',
              'Responsive course management workspace',
              'Live feedback for create, update, and delete actions',
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-sand-200 bg-white/70 p-4 text-sm font-medium text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-[1.75rem] bg-ink-950 px-6 py-6 text-slate-100 shadow-[0_16px_48px_rgba(16,33,61,0.24)]">
            <p className="text-sm uppercase tracking-[0.24em] text-brand-100">
              Test Credentials
            </p>
            <div className="mt-4 space-y-3 text-sm sm:text-base">
              <p>
                <span className="font-semibold text-white">Email:</span>{' '}
                {testCredentials.email}
              </p>
              <p>
                <span className="font-semibold text-white">Password:</span>{' '}
                {testCredentials.password}
              </p>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] border border-white/70 p-6 shadow-[0_24px_80px_rgba(16,33,61,0.12)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Supervisor Login
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-ink-950">
            Authenticate to continue
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This dashboard uses the backend Swagger contract at{' '}
            <span className="font-semibold text-brand-700">/api/auth/login</span>{' '}
            and stores your tokens locally for this browser session.
          </p>
          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <Field
              label="Email address"
              name="email"
              type="email"
              value={loginValues.email}
              onChange={(event) =>
                setLoginValues((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
            <Field
              label="Password"
              name="password"
              type="password"
              value={loginValues.password}
              onChange={(event) =>
                setLoginValues((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
            {error ? <Banner tone="danger" message={error} /> : null}
            {feedback ? <Banner tone={feedback.tone} message={feedback.text} /> : null}
            <button
              type="button"
              onClick={() => setLoginValues(testCredentials)}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
            >
              Use provided test credentials
            </button>
            <button
              type="submit"
              disabled={isSigningIn}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSigningIn ? 'Signing in...' : 'Open supervisor dashboard'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default LoginScreen
