import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import PositionAwareButton from '../components/ui/PositionAwareButton'
import apiClient from '../services/api'
import { otpSchema, registerSchema, validate } from '../services/validationSchemas'
import { AppContext } from '../context/AppContext'

const initialForm = { name: '', phone: '', email: '', password: '', confirmPassword: '', gender: 'prefer_not_to_say', profession: '' }

const strengthScore = (password) => [
  password.length >= 8,
  /[A-Z]/.test(password),
  /[a-z]/.test(password),
  /\d/.test(password),
  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
].filter(Boolean).length

const CreateAccount = () => {
  const navigate = useNavigate()
  const { token } = useContext(AppContext)

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true })
    }
  }, [token, navigate])
  const [form, setForm] = useState(initialForm)
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('form')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [isFormValid, setIsFormValid] = useState(false)

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

  // Run validation for enabling/disabling submit in real time (on every change)
  const checkFormValidity = async (nextForm) => {
    const result = await validate(registerSchema, nextForm)
    setIsFormValid(Boolean(result && result.success))
  }

  const handleChange = (name, value) => {
    const nextForm = { ...form, [name]: value }
    setForm(nextForm)
    // Clear only the field's inline error while typing
    setErrors((prev) => ({ ...prev, [name]: '' }))
    // Validate in background to update disabled state (do not show errors here)
    checkFormValidity(nextForm)
  }

  const handleBlur = async (name) => {
    // Validate full form but only surface field-specific errors on blur
    const result = await validate(registerSchema, form)
    if (!result.success) {
      setErrors((prev) => ({ ...prev, ...(result.errors || {}) }))
    } else {
      // clear any error for this field if valid
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    // also update form valid flag
    setIsFormValid(Boolean(result && result.success))
  }

  const requestOtp = async (event) => {
    event?.preventDefault()
    setLoading(true)
    const result = await validate(registerSchema, form)
    if (!result.success) {
      setErrors(result.errors)
      setLoading(false)
      return
    }
    try {
      let payload
      const formData = new FormData()
      if (form.profileImage) {
        formData.append('profileImage', form.profileImage)
        formData.append('name', form.name)
        formData.append('email', form.email)
        formData.append('phone', form.phone)
        formData.append('password', form.password)
        formData.append('confirmPassword', form.confirmPassword)
        formData.append('gender', form.gender)
        if (form.profession) formData.append('profession', form.profession)
        payload = formData
      } else {
        payload = form
      }
      console.log('[CreateAccount] requesting OTP via', `${apiClient.defaults.baseURL}/auth/register/request-otp`)
      const { data } = await apiClient.post('/auth/register/request-otp', payload)
      if (data.success) {
        toast.success(data.message)
        setStep('otp')
        startCooldown()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (event) => {
    event.preventDefault()
    const result = await validate(otpSchema, { otp })
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/register/verify', { email: form.email, otp })
      if (data.success) {
        toast.success('Account created')
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const score = strengthScore(form.password)

  // Password requirement checks for checklist
  const pwdChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password)
  }

  return (
    <main className="mx-auto max-w-xl py-10">
      <h1 className="text-3xl font-bold text-gray-950">Create Account</h1>
      <p className="mt-2 text-gray-600">Secure your consultation history and dashboard access.</p>

      {step === 'form' ? (
        <form onSubmit={requestOtp} className="mt-8 space-y-5 rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-2 text-gray-500">
            <label htmlFor="profile-image" className="cursor-pointer relative">
              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                {form.imagePreview ? (
                  <img src={form.imagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
            </label>
            <p className="text-sm text-gray-500">Upload Profile Image</p>
            <input
              id="profile-image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setForm((prev) => ({
                    ...prev,
                    profileImage: file,
                    imagePreview: URL.createObjectURL(file)
                  }))
                }
              }}
              className="hidden"
            />
          </div>

          {[
            ['name', 'Full Name', 'text'],
            ['email', 'Email Address', 'email']
          ].map(([name, label, type]) => (
            <label key={name} className="block text-sm font-medium text-gray-700">
              {label}
              <input
                type={type}
                value={form[name]}
                onChange={(e) => handleChange(name, e.target.value)}
                onBlur={() => handleBlur(name)}
                className={`mt-2 w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors[name] && <span className="mt-1 block text-xs text-red-600">{errors[name]}</span>}
            </label>
          ))}

          <label className="block text-sm font-medium text-gray-700">
            Gender
            <select
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Profession / Occupation (Optional)
            <input
              type="text"
              value={form.profession}
              onChange={(e) => handleChange('profession', e.target.value)}
              placeholder="e.g. Software Engineer, Business Owner"
              className="mt-2 w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          {[
            ['phone', 'Phone Number', 'tel'],
          ].map(([name, label, type]) => (
            <label key={name} className="block text-sm font-medium text-gray-700">
              {label}
              <input
                type={type}
                value={form[name]}
                onChange={(e) => handleChange(name, e.target.value)}
                onBlur={() => handleBlur(name)}
                className={`mt-2 w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors[name] && <span className="mt-1 block text-xs text-red-600">{errors[name]}</span>}
            </label>
          ))}

          {/* Password field with checklist */}
          <label className="block text-sm font-medium text-gray-700">
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              className={`mt-2 w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.password && <span className="mt-1 block text-xs text-red-600">{errors.password}</span>}

            {/* Password checklist */}
            <ul className="mt-3 space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <span>{pwdChecks.length ? '✅' : '❌'}</span>
                <span className={`text-sm ${pwdChecks.length ? 'text-green-600' : 'text-gray-500'}`}>At least 8 characters</span>
              </li>
              <li className="flex items-center gap-2">
                <span>{pwdChecks.upper ? '✅' : '❌'}</span>
                <span className={`text-sm ${pwdChecks.upper ? 'text-green-600' : 'text-gray-500'}`}>Contains an uppercase letter (A–Z)</span>
              </li>
              <li className="flex items-center gap-2">
                <span>{pwdChecks.lower ? '✅' : '❌'}</span>
                <span className={`text-sm ${pwdChecks.lower ? 'text-green-600' : 'text-gray-500'}`}>Contains a lowercase letter (a–z)</span>
              </li>
              <li className="flex items-center gap-2">
                <span>{pwdChecks.number ? '✅' : '❌'}</span>
                <span className={`text-sm ${pwdChecks.number ? 'text-green-600' : 'text-gray-500'}`}>Contains a number (0–9)</span>
              </li>
              <li className="flex items-center gap-2">
                <span>{pwdChecks.special ? '✅' : '❌'}</span>
                <span className={`text-sm ${pwdChecks.special ? 'text-green-600' : 'text-gray-500'}`}>Contains a special character (!@#$%^&* etc.)</span>
              </li>
            </ul>
          </label>

          {/* Confirm password */}
          <label className="block text-sm font-medium text-gray-700">
            Confirm Password
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              className={`mt-2 w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.confirmPassword && <span className="mt-1 block text-xs text-red-600">{errors.confirmPassword}</span>}
          </label>

          {/* Strength bar (existing) */}
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-primary transition-all" style={{ width: `${score * 20}%` }} />
          </div>

          <PositionAwareButton
            type="submit"
            disabled={loading || !isFormValid}
            className={`w-full ${(!isFormValid && !loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Sending OTP...' : 'Create Account'}
          </PositionAwareButton>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="mt-8 space-y-5 rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Enter the 6 digit OTP sent to {form.email}.</p>
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:ring-2 focus:ring-primary"
            placeholder="000000"
          />
          {errors.otp && <p className="text-sm text-red-600">{errors.otp}</p>}
          <PositionAwareButton type="submit" disabled={loading} className="w-full">
            Verify OTP
          </PositionAwareButton>
          <button type="button" disabled={cooldown > 0 || loading} onClick={requestOtp} className="w-full text-sm font-medium text-primary disabled:text-gray-400">
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </button>
        </form>
      )}
    </main>
  )
}

export default CreateAccount
