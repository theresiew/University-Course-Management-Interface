const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
  'https://student-management-system-backend.up.railway.app'

function buildUrl(pathname) {
  return `${API_BASE_URL}${pathname}`
}

function extractErrorMessage(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage
  }

  if (typeof payload === 'string') {
    return payload
  }

  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    return payload.errors.join(', ')
  }

  return (
    payload.message ||
    payload.error ||
    payload.details ||
    payload.title ||
    fallbackMessage
  )
}

function normalizeCourse(course) {
  if (!course || typeof course !== 'object') {
    return null
  }

  const id = course.id || course._id || course.courseId || course.uuid || ''

  return {
    id,
    courseName: course.courseName || course.name || '',
    description: course.description || course.details || '',
    supervisorId: course.supervisorId || '',
    createdAt: course.createdAt || '',
    updatedAt: course.updatedAt || '',
    raw: course,
  }
}

function extractCourseList(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  const collections = [
    payload?.courses,
    payload?.data,
    payload?.items,
    payload?.results,
  ]

  const firstCollection = collections.find(Array.isArray)
  return firstCollection || []
}

async function request(pathname, { body, method = 'GET', token } = {}) {
  const headers = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(buildUrl(pathname), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const responseText = await response.text()
  const payload = responseText ? JSON.parse(responseText) : null

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(payload, `Request failed with status ${response.status}`),
    )
  }

  return payload
}

export async function loginSupervisor(credentials) {
  const payload = await request('/api/auth/login', {
    method: 'POST',
    body: credentials,
  })

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    role: payload.role,
    email: credentials.email,
  }
}

export async function refreshAccessToken(refreshToken) {
  const payload = await request('/api/auth/refresh-token', {
    method: 'POST',
    body: { refreshToken },
  })

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken || refreshToken,
  }
}

export async function logoutSupervisor(refreshToken) {
  if (!refreshToken) {
    return null
  }

  return request('/api/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  })
}

export async function getCourses(token) {
  const payload = await request('/api/courses', { token })
  return extractCourseList(payload).map(normalizeCourse).filter(Boolean)
}

export async function getCourseById(id, token) {
  const payload = await request(`/api/courses/${id}`, { token })
  return normalizeCourse(payload)
}

export async function createCourse(course, token) {
  const payload = await request('/api/courses', {
    method: 'POST',
    token,
    body: course,
  })

  return normalizeCourse(payload) || null
}

export async function updateCourse(id, course, token) {
  const payload = await request(`/api/courses/${id}`, {
    method: 'PUT',
    token,
    body: course,
  })

  return normalizeCourse(payload) || null
}

export async function deleteCourse(id, token) {
  return request(`/api/courses/${id}`, {
    method: 'DELETE',
    token,
  })
}
