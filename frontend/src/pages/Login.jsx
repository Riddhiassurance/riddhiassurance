import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../services/api'
import PositionAwareButton from '../components/ui/PositionAwareButton'
import { AppContext } from '../context/AppContext'
import { loginSchema, validate } from '../services/validationSchemas'

const tabBaseClass = 'flex-1 text-center py-2 text-sm font-semibold rounded-md transition-all'
const tabInactive = 'bg-gray-100 text-gray-600 hover:bg-gray-200'
const tabActive = 'bg-primary text-white shadow'


const Login = () => {
  const navigate = useNavigate()
  const { token, setToken, setUserData } = useContext(AppContext)

  useEffect(() => {
    if (token) navigate('/', { replace: true })
  }, [token, navigate])

  const [activeTab, setActiveTab] = useState('password') // password | otp
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Password login
  const [passwordForm, setPasswordForm] = useState({ email: '', password: '' })

  // OTP login state
  const [otpIdentifier, setOtpIdentifier] = useState('') // email or phone
  const [otpRequested, setOtpRequested] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  // Forgot password flow
  const [forgotStep, setForgotStep] = useState(0)
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const startCooldown = () => {
    setCooldown(15)
    const id = setInterval(() => {
      setCooldown((value) => {
        if (value <= 1) {
          clearInterval(id)
          return 0
        }
        return value - 1
      })
    }, 1000)
  }

  const clearAllFields = () => {
    setErrors({})
    setPasswordForm({ email: '', password: '' })

    setOtpIdentifier('')
    setOtpRequested(false)
    setOtpCode('')

    setForgotStep(0)
    setForgotEmail('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setCooldown(0)
  }

  const redirectByRole = (role) => {
    if (role === 'admin') return navigate('/manage-portal', { replace: true })
    if (role === 'advisor') return navigate('/advisor-dashboard', { replace: true })
    return navigate('/my-dashboard', { replace: true })
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setErrors({})

    const result = await validate(loginSchema, passwordForm)
    if (!result.success) {
      setErrors(result.errors)
      return
    }

    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/login', passwordForm)
      if (data.success) {
        toast.success('Login successful')

        localStorage.setItem('token', data.token)
        if (setToken) setToken(data.token)
        if (setUserData) setUserData(data.user)

        redirectByRole(data.role || data.user?.role)
      }
    } catch (err) {
      toast.error('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const requestOtpLogin = async () => {
    setLoading(true)
    try {
      const identifier = otpIdentifier.trim()
      const { data } = await apiClient.post('/auth/request-otp-login', { identifier })

      if (data.success) {
        toast.success(data.message)
        setOtpRequested(true)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to request OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtpLogin = async () => {
    setLoading(true)
    try {
      const identifier = otpIdentifier.trim()
      const { data } = await apiClient.post('/auth/verify-otp-login', { identifier, otp: otpCode })

      if (data.success) {
        toast.success('OTP verified')

        localStorage.setItem('token', data.token)
        if (setToken) setToken(data.token)
        if (setUserData) setUserData(data.user)

        redirectByRole(data.role || data.user?.role)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  // Forgot Password
  const requestResetOtp = async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/forgot-password/request-otp', { emailOrPhone: forgotEmail })
      if (data.success) {
        setForgotStep(2)
        startCooldown()
        toast.success(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyResetOtp = async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/forgot-password/verify-otp', { identifier: forgotEmail, otp })
      if (data.success) {
        setForgotStep(3)
        toast.success('OTP verified')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const submitResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/forgot-password/reset', {
        identifier: forgotEmail,
        email: forgotEmail,
        newPassword,
        confirmPassword
      })

      if (data.success) {
        toast.success('Password reset successful')
        setForgotStep(0)
        setForgotEmail('')
        setOtp('')
        setNewPassword('')
        setConfirmPassword('')
        setCooldown(0)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // When switching tabs, clear everything for that flow.
    // (Requirement: Switching tabs clears all fields)
    clearAllFields()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const passwordTabStyle = useMemo(() => (activeTab === 'password' ? tabActive : tabInactive), [activeTab])
  const otpTabStyle = useMemo(() => (activeTab === 'otp' ? tabActive : tabInactive), [activeTab])

  if (forgotStep > 0) {
    return (
      <main className="mx-auto max-w-lg py-10">
        <h1 className="text-3xl font-bold text-gray-950">Forgot Password</h1>
        <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          {forgotStep === 1 && (
            <>
              <p className="mb-4 text-sm text-gray-600">Enter your registered email to receive an OTP.</p>
              <input
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Email address"
                className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
              <PositionAwareButton onClick={requestResetOtp} disabled={loading} className="mt-5 w-full">
                Send OTP
              </PositionAwareButton>
            </>
          )}

          {forgotStep === 2 && (
            <>
              <p className="mb-4 text-sm text-gray-600">Enter the 6-digit OTP sent to {forgotEmail}.</p>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter OTP"
                className="w-full rounded-md border px-4 py-3 text-center text-xl tracking-[0.3em] outline-none focus:ring-2 focus:ring-primary"
              />
              <PositionAwareButton onClick={verifyResetOtp} disabled={loading} className="mt-5 w-full">
                Verify OTP
              </PositionAwareButton>

              <button
                type="button"
                disabled={cooldown > 0}
                onClick={requestResetOtp}
                className="mt-4 w-full text-sm font-medium text-primary disabled:text-gray-400"
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
              </button>
            </>
          )}

          {forgotStep === 3 && (
            <>
              <p className="mb-4 text-sm text-gray-600">Enter your new password.</p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="mt-4 w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
              <PositionAwareButton onClick={submitResetPassword} disabled={loading} className="mt-5 w-full">
                Reset Password
              </PositionAwareButton>
            </>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg py-10">
      <h1 className="text-3xl font-bold text-gray-950">Login</h1>

      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-3 rounded-full bg-gray-100 p-1">
          <button
            type="button"
            className={`${tabBaseClass} ${passwordTabStyle}`}
            onClick={() => setActiveTab('password')}
          >
            Login
          </button>
          <button
            type="button"
            className={`${tabBaseClass} ${otpTabStyle}`}
            onClick={() => setActiveTab('otp')}
          >
            OTP Login
          </button>
        </div>

        {/* Login tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="mt-6 space-y-4">
            <div>
              <input
                type="email"
                value={passwordForm.email}
                onChange={(e) => setPasswordForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email address"
                className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <input
                type="password"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Password"
                className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <PositionAwareButton type="submit" disabled={loading} className="w-full">
              Login
            </PositionAwareButton>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => {
                  setForgotStep(1)
                  setForgotEmail('')
                  setOtp('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setCooldown(0)
                }}
              >
                Forgot Password?
              </button>
              <div>
                <span className="text-gray-600">Don't have an account? </span>
                <Link to="/create-account" className="font-medium text-primary hover:underline">
                  Create one
                </Link>
              </div>
            </div>
          </form>
        )}

        {/* OTP tab */}
        {activeTab === 'otp' && (
          <div className="mt-6 space-y-4">
            <div>
              <input
                value={otpIdentifier}
                onChange={(e) => setOtpIdentifier(e.target.value)}
                placeholder="Email or phone number"
                className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {!otpRequested && (
              <PositionAwareButton onClick={requestOtpLogin} disabled={loading} className="w-full">
                Request OTP
              </PositionAwareButton>
            )}

            {otpRequested && (
              <>
                <input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter OTP"
                  className="w-full rounded-md border px-4 py-3 text-center text-xl tracking-[0.3em] outline-none focus:ring-2 focus:ring-primary"
                />
                <PositionAwareButton onClick={verifyOtpLogin} disabled={loading} className="w-full">
                  Verify OTP
                </PositionAwareButton>
              </>
            )}

            {otpRequested && (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setOtpRequested(false)
                  setOtpCode('')
                }}
                className="w-full text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Request OTP again
              </button>
            )}

            <div className="text-center text-sm text-gray-600">
              <Link
                to="/create-account"
                className="font-medium text-primary hover:underline"
                onClick={() => {
                  // keep requirement: switching tabs clears fields; navigation is fine.
                }}
              >
                Don&apos;t have an account? Create one
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default Login


