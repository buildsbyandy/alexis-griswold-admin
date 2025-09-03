import { useRouter } from 'next/router'
import Link from 'next/link'

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query

  const getErrorMessage = (error: string | string[] | undefined) => {
    const errorCode = Array.isArray(error) ? error[0] : error
    
    switch (errorCode) {
      case 'AccessDenied':
        return 'Your email address is not authorized to access this admin dashboard.'
      case 'Configuration':
        return 'Server configuration error. Please contact the administrator.'
      case 'Verification':
        return 'Email verification failed. Please try again.'
      case 'Callback':
        return 'OAuth callback error. This may be due to session issues or network problems.'
      default:
        return `Authentication error: ${errorCode || 'Unknown error'}`
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700">
              {getErrorMessage(error)}
            </p>
          </div>

          <div className="text-xs text-gray-500 mb-4">
            Error Code: {error || 'Unknown'}
          </div>

          <div className="space-y-4">
            <Link 
              href="/auth/signin"
              className="block w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Try Again
            </Link>
            
            <p className="text-xs text-gray-400">
              If you continue having issues, please contact the administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}