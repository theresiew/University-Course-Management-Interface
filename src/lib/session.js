const SESSION_STORAGE_KEY = 'university-course-management-session'

export function loadSession() {
  try {
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY)

    if (!rawSession) {
      return null
    }

    return JSON.parse(rawSession)
  } catch {
    return null
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
