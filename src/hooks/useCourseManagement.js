import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  loginSupervisor,
  logoutSupervisor,
  refreshAccessToken,
  updateCourse,
} from '../lib/api'
import { clearSession, loadSession, saveSession } from '../lib/session'

const EMPTY_FORM = {
  courseName: '',
  description: '',
}

export const TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'adminpassword123',
}

export function useCourseManagement() {
  const navigate = useNavigate()
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

      try {
        const refreshedSession = await refreshAccessToken(session.refreshToken)
        const nextSession = { ...session, ...refreshedSession }
        setSession(nextSession)
        saveSession(nextSession)

        return task(nextSession.accessToken)
      } catch {
        clearSession()
        setSession(null)
        setCourses([])
        setSelectedCourse(null)
        setPendingDelete(null)
        setFeedback({
          tone: 'info',
          text: 'Your session expired. Please sign in again.',
        })
        navigate('/login', { replace: true })

        throw new Error('Your session expired. Please sign in again.')
      }
    }
  }, [navigate, session])

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
      navigate('/dashboard', { replace: true })
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
      navigate('/login', { replace: true })
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

  return {
    courses,
    error,
    feedback,
    filteredCourses,
    formMode,
    formValues,
    handleConfirmDelete,
    handleCourseLookup,
    handleCourseLookupFromList,
    handleCreateMode,
    handleEditMode,
    handleLoginSubmit,
    handleLogout,
    handleSubmitCourse,
    isLoadingCourses,
    isLoadingDetail,
    isSigningIn,
    isSubmittingForm,
    lastSyncedAt,
    loginValues,
    lookupId,
    pendingDelete,
    searchTerm,
    selectedCourse,
    session,
    setFormValues,
    setFeedback,
    setError,
    setLoginValues,
    setLookupId,
    setPendingDelete,
    setSearchTerm,
    loadAllCourses,
  }
}
