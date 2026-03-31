import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  loginSupervisor,
  logoutSupervisor,
  refreshAccessToken,
  updateCourse,
} from './lib/api'
import { clearSession, loadSession, saveSession } from './lib/session'

const EMPTY_FORM = {
  courseName: '',
  description: '',
}

const TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'adminpassword123',
}

function App() {
  const [session, setSession] = useState(() => loadSession())
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [lookupId, setLookupId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [formMode, setFormMode] = useState('create')
  const [formValues, setFormValues] = useState(EMPTY_FORM)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState('')
  const [lastSyncedAt, setLastSyncedAt] = useState('')
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [loginValues, setLoginValues] = useState(TEST_CREDENTIALS)

  const deferredSearchTerm = useDeferredValue(searchTerm)

  const filteredCourses = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase()

    if (!term) {
      return courses
    }

    return courses.filter((course) => {
      return (
        course.courseName.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.id.toLowerCase().includes(term)
      )
    })
  }, [courses, deferredSearchTerm])

  const withAuthRetry = useCallback(async (task) => {
    if (!session?.accessToken) {
      throw new Error('Your session has expired. Please sign in again.')
    }

    try {
      return await task(session.accessToken)
    } catch (requestError) {
      const isUnauthorized = /401|unauthorized|jwt/i.test(requestError.message)

      if (!isUnauthorized || !session.refreshToken) {
        throw requestError
      }

      const refreshedSession = await refreshAccessToken(session.refreshToken)
      const nextSession = { ...session, ...refreshedSession }
      setSession(nextSession)
      saveSession(nextSession)

      return task(nextSession.accessToken)
    }
  }, [session])

  const loadAllCourses = useCallback(async () => {
    setIsLoadingCourses(true)
    setError('')

    try {
      const nextCourses = await withAuthRetry((token) => getCourses(token))
      setCourses(nextCourses)
      setLastSyncedAt(new Date().toISOString())
      setSelectedCourse((currentCourse) => {
        if (!currentCourse?.id) {
          return nextCourses[0] || null
        }

        return (
          nextCourses.find((course) => course.id === currentCourse.id) ||
          nextCourses[0] ||
          null
        )
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoadingCourses(false)
    }
  }, [withAuthRetry])

  useEffect(() => {
    if (!session?.accessToken) {
      return
    }

    void loadAllCourses()
  }, [loadAllCourses, session?.accessToken])

  useEffect(() => {
    if (!pendingDelete) {
      return
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setPendingDelete(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [pendingDelete])

  async function handleLoginSubmit(event) {
    event.preventDefault()
    setIsSigningIn(true)
    setError('')
    setFeedback(null)

    try {
      const nextSession = await loginSupervisor(loginValues)

      if (nextSession.role !== 'SUPERVISOR') {
        throw new Error('This dashboard is restricted to supervisor accounts.')
      }

      setSession(nextSession)
      saveSession(nextSession)
      setFeedback({
        tone: 'success',
        text: 'Welcome back. You are now authenticated as supervisor.',
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSigningIn(false)
    }
  }

  async function handleLogout() {
    try {
      await logoutSupervisor(session?.refreshToken)
    } catch {
      // Best-effort logout. Local cleanup still needs to happen.
    } finally {
      clearSession()
      setSession(null)
      setCourses([])
      setSelectedCourse(null)
      setPendingDelete(null)
      setFeedback({
        tone: 'info',
        text: 'You have been signed out safely.',
      })
    }
  }

  async function handleCourseLookup(event) {
    event.preventDefault()

    if (!lookupId.trim()) {
      setError('Enter a course ID to load its details.')
      return
    }

    setIsLoadingDetail(true)
    setError('')

    try {
      const detail = await withAuthRetry((token) =>
        getCourseById(lookupId.trim(), token),
      )

      if (!detail) {
        throw new Error('Course detail response was empty.')
      }

      setSelectedCourse(detail)
      startTransition(() => {
        setFormMode('edit')
        setFormValues({
          courseName: detail.courseName,
          description: detail.description,
        })
      })
      setFeedback({
        tone: 'success',
        text: `Loaded details for ${detail.courseName}.`,
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  async function handleCourseLookupFromList(id) {
    if (!id) {
      setError('This course does not include an ID in the API response.')
      return
    }

    setLookupId(id)
    setIsLoadingDetail(true)
    setError('')

    try {
      const detail = await withAuthRetry((token) => getCourseById(id, token))
      setSelectedCourse(detail)
      setFeedback({
        tone: 'success',
        text: `Viewing ${detail.courseName}.`,
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  function handleCreateMode() {
    setFormMode('create')
    setFormValues(EMPTY_FORM)
  }

  function handleEditMode(course) {
    setSelectedCourse(course)
    setFormMode('edit')
    setFormValues({
      courseName: course.courseName,
      description: course.description,
    })
  }

  async function handleSubmitCourse(event) {
    event.preventDefault()
    setIsSubmittingForm(true)
    setError('')

    const payload = {
      courseName: formValues.courseName.trim(),
      description: formValues.description.trim(),
    }

    try {
      if (!payload.courseName || !payload.description) {
        throw new Error('Course name and description are both required.')
      }

      if (formMode === 'create') {
        await withAuthRetry((token) => createCourse(payload, token))
        setFeedback({
          tone: 'success',
          text: 'Course created successfully.',
        })
        setFormValues(EMPTY_FORM)
      } else if (selectedCourse?.id) {
        await withAuthRetry((token) =>
          updateCourse(selectedCourse.id, payload, token),
        )
        setFeedback({
          tone: 'success',
          text: 'Course updated successfully.',
        })
      }

      await loadAllCourses()

      if (formMode === 'edit' && selectedCourse?.id) {
        const freshDetail = await withAuthRetry((token) =>
          getCourseById(selectedCourse.id, token),
        )
        setSelectedCourse(freshDetail)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmittingForm(false)
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete?.id) {
      return
    }

    setIsSubmittingForm(true)
    setError('')

    try {
      await withAuthRetry((token) => deleteCourse(pendingDelete.id, token))
      setFeedback({
        tone: 'success',
        text: `Deleted ${pendingDelete.courseName} successfully.`,
      })
      setPendingDelete(null)
      setSelectedCourse(null)
      setFormMode('create')
      setFormValues(EMPTY_FORM)
      await loadAllCourses()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmittingForm(false)
    }
  }

  const summaryStats = [
    { label: 'Tracked courses', value: courses.length },
    { label: 'Visible after filter', value: filteredCourses.length },
    { label: 'Supervisor role', value: session?.role || 'Guest' },
  ]

  if (!session?.accessToken) {
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
                  {TEST_CREDENTIALS.email}
                </p>
                <p>
                  <span className="font-semibold text-white">Password:</span>{' '}
                  {TEST_CREDENTIALS.password}
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
            <form className="mt-8 space-y-5" onSubmit={handleLoginSubmit}>
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
                onClick={() => setLoginValues(TEST_CREDENTIALS)}
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="glass-panel overflow-hidden rounded-[2rem] border border-white/70 shadow-[0_24px_80px_rgba(16,33,61,0.12)]">
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
              onClick={handleLogout}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {summaryStats.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[1.5rem] border border-white/80 bg-gradient-to-br from-white to-brand-50 p-5"
                >
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-4 text-3xl font-semibold text-ink-950">{item.value}</p>
                </article>
              ))}
            </div>
            {error ? <Banner tone="danger" message={error} /> : null}
            {feedback ? <Banner tone={feedback.tone} message={feedback.text} /> : null}

            <section className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-ink-950">Course catalog</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Browse all courses returned by <span className="font-semibold">GET /api/courses</span>.
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Last synced: {formatDate(lastSyncedAt)}
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
          </section>

          <aside className="space-y-6">
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
                    onClick={() => handleEditMode(selectedCourse)}
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
                          onClick={() => void copyCourseId(selectedCourse.id, setFeedback, setError)}
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
                  <DetailItem
                    label="Created"
                    value={formatDate(selectedCourse.createdAt)}
                  />
                  <DetailItem
                    label="Last updated"
                    value={formatDate(selectedCourse.updatedAt)}
                  />
                  <DetailItem label="Description" value={selectedCourse.description} multiLine />
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Pick a course from the list or fetch one by ID to inspect it here.
                </div>
              )}
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink-950">
                    {formMode === 'create' ? 'Create course' : 'Update course'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Uses the same request body shown in Swagger: <span className="font-semibold">{'{ courseName, description }'}</span>.
                  </p>
                </div>
                {formMode === 'edit' ? (
                  <button
                    type="button"
                    onClick={handleCreateMode}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    Switch to create
                  </button>
                ) : null}
              </div>
              <form className="mt-5 space-y-4" onSubmit={handleSubmitCourse}>
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
                    onClick={handleCreateMode}
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
          </aside>
        </div>
      </section>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_rgba(16,33,61,0.24)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-red-600">
              Confirm deletion
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-ink-950">
              Remove {pendingDelete.courseName}?
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This sends a request to <span className="font-semibold">DELETE /api/courses/{pendingDelete.id}</span>.
              Make sure this course should really be removed from the catalog.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Delete course
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
            <span className="ml-2 font-semibold text-brand-700">
              /api-docs/#/
            </span>
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
    </main>
  )
}

function Field({
  as = 'input',
  label,
  name,
  onChange,
  placeholder,
  type = 'text',
  value,
}) {
  const sharedClasses =
    'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white'

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {as === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={5}
          className={`${sharedClasses} resize-y`}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={sharedClasses}
        />
      )}
    </label>
  )
}

function Banner({ message, tone }) {
  const toneClasses = {
    success: 'border-success-100 bg-success-100/80 text-success-700',
    danger: 'border-danger-100 bg-danger-100/80 text-danger-700',
    info: 'border-brand-100 bg-brand-50 text-brand-700',
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${toneClasses[tone]}`}>
      {message}
    </div>
  )
}

function DetailItem({ label, multiLine = false, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 text-sm text-slate-700 ${
          multiLine ? 'whitespace-pre-wrap leading-6' : 'break-all'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleString()
}

async function copyCourseId(courseId, setFeedback, setError) {
  try {
    await navigator.clipboard.writeText(courseId)
    setFeedback({
      tone: 'success',
      text: 'Course ID copied to your clipboard.',
    })
  } catch {
    setError('Could not copy the course ID from this browser.')
  }
}

export default App
