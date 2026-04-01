import { Navigate, useLocation } from 'react-router-dom'
import { loadSession } from '../lib/session'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const session = loadSession()

  if (!session?.accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
