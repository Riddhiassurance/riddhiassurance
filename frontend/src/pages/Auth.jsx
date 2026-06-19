import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../services/api'
import PositionAwareButton from '../components/ui/PositionAwareButton'
import { loginSchema, otpSchema, validate } from '../services/validationSchemas'
import { AppContext } from '../context/AppContext'

const Auth = () => {
  const navigate = useNavigate()
  const { setToken } = useContext(AppContext)
  const [tab, setTab] = useState('login')
  const [login, setLogin] = useState({ email: '', password: '' })
  const [otpEmail, setOtpEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  const [forgotStep, setForgotStep] = useState(0)
  const [reset, setReset] = useState({ identifier: '', otp: '', newPassword: '', confirmPassword: '' })
  const [cooldown, setCooldown] = useState(0)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const startCooldown = () => {
    setCooldown(15)
    const id = setInterval(() => setCooldown((value) => {
      if (value <= 1) {
        clearInterval(id)
        return 0
      }
      return value - 1
    }), 1000)
  }

  const submitLogin = async (event) => {
    event.preventDefault()
    const result = await validate(loginSchema, login)
    if (!result.success) return setErrors(result.errors)
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/login', login)
      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('role', data.user?.role || 'user')
        setToken(data.token)
        toast.success('Login successful')
        const role = data.user?.role
        if (role === 'admin') {
          toast.success('You are logged in as Admin. Use the "Login as Admin" button below to access the admin panel.')
          navigate('/', { replace: true })
        } else if (role === 'advisor' || data.user?.advisorAccess) {
          navigate('/advisor-dashboard', { replace: true })
        } else {
          navigate('/my-dashboard', { replace: true })
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const requestLoginOtp = async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/otp-login/request', { email: otpEmail })
      if (data.success) {
        setOtpRequested(true)
        startCooldown()
        toast.success(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to request OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyLoginOtp = async (event) => {
    event.preventDefault()
    const result = await validate(otpSchema, { otp })
    if (!result.success) return setErrors(result.errors)
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/otp-login/verify', { email: otpEmail, otp })
      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('role', data.user?.role || 'user')
        setToken(data.token)
        toast.success('Login successful')
        const role = data.user?.role
        if (role === 'admin') {
          toast.success('You are logged in as Admin. Use the "Login as Admin" button below to access the admin panel.')
          navigate('/', { replace: true })
        } else if (role === 'advisor' || data.user?.advisorAccess) {
          navigate('/advisor-dashboard', { replace: true })
        } else {
          navigate('/my-dashboard', { replace: true })
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const requestResetOtp = async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/forgot-password/request-otp', { emailOrPhone: reset.identifier })
      if (data.success) {
        setForgotStep(2)
        startCooldown()
        toast.success(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send reset OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyResetOtp = async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/forgot-password/verify-otp', { identifier: reset.identifier, otp: reset.otp })
      if (data.success) setForgotStep(3)
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/forgot-password/reset', reset)
      if (data.success) {
        setForgotStep(4)
        toast.success(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (forgotStep) {
    return (
      <main className="mx-auto max-w-lg py-10">
        <h1 className="text-3xl font-bold text-gray-950">Forgot Password</h1>
        <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          {forgotStep === 1 && <>
            <input value={reset.identifier} onChange={(e) => setReset({ ...reset, identifier: e.target.value })} placeholder="Email or phone" className="w-full rounded-md border px-4 py-3" />
            <PositionAwareButton onClick={requestResetOtp} disabled={loading} className="mt-5 w-full">Send OTP</PositionAwareButton>
          </>}
          {forgotStep === 2 && <>
            <input value={reset.otp} onChange={(e) => setReset({ ...reset, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="Enter OTP" className="w-full rounded-md border px-4 py-3 text-center text-xl tracking-[0.3em]" />
            <PositionAwareButton onClick={verifyResetOtp} disabled={loading} className="mt-5 w-full">Verify OTP</PositionAwareButton>
            <button disabled={cooldown > 0} onClick={requestResetOtp} className="mt-4 w-full text-sm text-primary disabled:text-gray-400">{cooldown ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}</button>
          </>}
          {forgotStep === 3 && <>
            <input type="password" value={reset.newPassword} onChange={(e) => setReset({ ...reset, newPassword: e.target.value })} placeholder="New password" className="w-full rounded-md border px-4 py-3" />
            <input type="password" value={reset.confirmPassword} onChange={(e) => setReset({ ...reset, confirmPassword: e.target.value })} placeholder="Confirm password" className="mt-4 w-full rounded-md border px-4 py-3" />
            <PositionAwareButton onClick={resetPassword} disabled={loading} className="mt-5 w-full">Create New Password</PositionAwareButton>
          </>}
          {forgotStep === 4 && <>
            <h2 className="text-2xl font-semibold">Password Updated</h2>
            <p className="mt-2 text-gray-600">You can now sign in with your new password.</p>
            <PositionAwareButton onClick={() => setForgotStep(0)} className="mt-5 w-full">Back to Login</PositionAwareButton>
          </>}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg py-10">
      <h1 className="text-3xl font-bold text-gray-950">Authentication</h1>
      <div className="mt-8 rounded-lg border bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 rounded-full bg-gray-100 p-1">
          <button onClick={() => setTab('login')} className={`rounded-full py-2 text-sm font-semibold ${tab === 'login' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Login</button>
          <button onClick={() => setTab('otp')} className={`rounded-full py-2 text-sm font-semibold ${tab === 'otp' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>OTP Login</button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={submitLogin} className="space-y-4 p-4">
            <input type="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} placeholder="Email" className="w-full rounded-md border px-4 py-3" />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            <input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} placeholder="Password" className="w-full rounded-md border px-4 py-3" />
            <PositionAwareButton type="submit" disabled={loading} className="w-full">Login</PositionAwareButton>
            <button type="button" onClick={() => setForgotStep(1)} className="w-full text-sm font-medium text-primary">Forgot Password</button>
            <button type="button" onClick={() => window.open(import.meta.env.VITE_ADMIN_URL, '_blank')} className="w-full text-sm text-gray-500 hover:text-primary">Login as Admin</button>
            <p className="text-center text-sm text-gray-500 pt-4 border-t">Don't have an account? <button type="button" onClick={() => navigate('/create-account')} className="font-medium text-primary hover:underline">Create Account</button></p>
          </form>
        ) : (
          <form onSubmit={verifyLoginOtp} className="space-y-4 p-4">
            <input type="email" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} placeholder="Email Address" className="w-full rounded-md border px-4 py-3" />
            {otpRequested && <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter OTP" className="w-full rounded-md border px-4 py-3 text-center text-xl tracking-[0.3em]" />}
            {otpRequested ? <PositionAwareButton type="submit" disabled={loading} className="w-full">Verify OTP</PositionAwareButton> : <PositionAwareButton onClick={requestLoginOtp} disabled={loading || cooldown > 0} className="w-full">Request OTP</PositionAwareButton>}
            {otpRequested && <button type="button" onClick={requestLoginOtp} disabled={cooldown > 0} className="w-full text-sm text-primary disabled:text-gray-400">{cooldown ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}</button>}
          </form>
        )}
      </div>
    </main>
  )
}

export default Auth
