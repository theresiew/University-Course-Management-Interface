import { Navigate } from 'react-router-dom'
import LoginScreen from '../components/LoginScreen.jsx'
import { TEST_CREDENTIALS, useCourseManagement } from '../hooks/useCourseManagement.js'

function LoginPage() {
  const {
    error,
    feedback,
    handleLoginSubmit,
    isSigningIn,
    loginValues,
    session,
    setLoginValues,
  } = useCourseManagement()

  if (session?.accessToken) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <LoginScreen
      error={error}
      feedback={feedback}
      isSigningIn={isSigningIn}
      loginValues={loginValues}
      onSubmit={handleLoginSubmit}
      setLoginValues={setLoginValues}
      testCredentials={TEST_CREDENTIALS}
    />
  )
}

export default LoginPage
