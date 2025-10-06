import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to FiveSide
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Book your perfect 5-a-side pitch
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}