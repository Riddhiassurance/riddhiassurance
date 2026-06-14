import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../services/api'
import PositionAwareButton from '../components/ui/PositionAwareButton'

const statusColors = {
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Confirmed': 'bg-blue-100 text-blue-700',
  'Completed': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700',
  'new': 'bg-gray-100 text-gray-700',
  'pending': 'bg-yellow-100 text-yellow-700',
  'in_progress': 'bg-blue-100 text-blue-700',
  'in progress': 'bg-blue-100 text-blue-700',
  'completed': 'bg-green-100 text-green-700',
  'cancelled': 'bg-red-100 text-red-700',
  'contacted': 'bg-blue-100 text-blue-700',
  'follow_up_required': 'bg-orange-100 text-orange-700',
  'converted': 'bg-green-100 text-green-700',
  'closed': 'bg-gray-100 text-gray-700'
}

const getUserColor = (name = '') => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const MyDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const [cpStep, setCpStep] = useState(0)
  const [cpOtp, setCpOtp] = useState('')
  const [cpNewPassword, setCpNewPassword] = useState('')
  const [cpConfirmPassword, setCpConfirmPassword] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const startCooldown = () => {
    setCooldown(15)
    const id = setInterval(() => {
      setCooldown((value) => {
        if (value <= 1) { clearInterval(id); return 0 }
        return value - 1
      })
    }, 1000)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, appointmentsRes, requestsRes] = await Promise.all([
          apiClient.get('/auth/me'),
          apiClient.get('/user/appointments').catch(() => ({ data: { appointments: [] } })),
          apiClient.get('/consultation/my-requests').catch(() => ({ data: { consultationRequests: [] } }))
        ])
        setUser(meRes.data.user)
        setAppointments(appointmentsRes.data.appointments || [])
        setRequests(requestsRes.data.consultationRequests || [])
      } catch (error) {
        toast.error('Session expired. Please login again.')
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  const getAppointmentStatus = (apt) => {
    if (apt.cancelled) return 'Cancelled'
    if (apt.isCompleted) return 'Completed'
    if (apt.payment) return 'Confirmed'
    return 'Pending'
  }

  const formatStatus = (s) => (s || '').replace(/_/g, ' ')

  const sendCpOtp = async () => {
    if (!user?.email) { toast.error('No email on profile'); return }
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/forgot-password/request-otp', { emailOrPhone: user.email })
      if (data.success) { setCpStep(1); startCooldown(); toast.success('OTP sent to your email') }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send OTP')
    } finally { setLoading(false) }
  }

  const verifyCpOtp = async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/forgot-password/verify-otp', { identifier: user.email, otp: cpOtp })
      if (data.success) { setCpStep(2); toast.success('OTP verified') }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed')
    } finally { setLoading(false) }
  }

  const submitCpReset = async () => {
    if (cpNewPassword !== cpConfirmPassword) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/forgot-password/reset', {
        identifier: user.email, email: user.email, newPassword: cpNewPassword, confirmPassword: cpConfirmPassword
      })
      if (data.success) {
        toast.success('Password changed successfully')
        setCpStep(0); setCpOtp(''); setCpNewPassword(''); setCpConfirmPassword('')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password change failed')
    } finally { setLoading(false) }
  }

  if (loading) return <div className="py-10 text-center text-gray-500">Loading dashboard...</div>
  if (!user) return null

  const assignedAdvisor = requests.find(r => r.assignedAdvisor)?.assignedAdvisor

  return (
    <main className="py-8">
      <h1 className="text-3xl font-bold text-gray-950">My Dashboard</h1>

      {/* Profile */}
      <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Profile</h2>
        <div className="mt-5 flex items-center gap-4">
          {user.image
            ? <img src={user.image} alt="" className="h-16 w-16 rounded-full border object-cover" />
            : <div className="h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: getUserColor(user.name) }}>{user.name?.charAt(0).toUpperCase()}</div>
          }
          <div>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd>{user.phone || 'Not added'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Gender</dt><dd className="capitalize">{user.gender ? user.gender.replace(/_/g, ' ') : 'Not specified'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Address</dt><dd>{user.address?.line1 ? `${user.address.line1}${user.address.line2 ? ', ' + user.address.line2 : ''}` : 'Not added'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Birthday</dt><dd>{user.dob ? new Date(user.dob).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Not set'}</dd></div>
        </dl>
      </section>

      {/* Assigned Advisor */}
      {assignedAdvisor && typeof assignedAdvisor === 'object' && (
        <section className="mt-6 rounded-lg border bg-blue-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-blue-900">Your Assigned Advisor</h2>
          <div className="mt-3 space-y-1 text-sm text-blue-800">
            <p><span className="font-medium">Name:</span> {assignedAdvisor.name || 'N/A'}</p>
            <p><span className="font-medium">Email:</span> {assignedAdvisor.email || 'N/A'}</p>
            <p><span className="font-medium">Phone:</span> {assignedAdvisor.phone || 'N/A'}</p>
          </div>
        </section>
      )}

      {/* My Appointments */}
      <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">My Appointments</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="py-3">Date</th>
                <th className="py-3">Time</th>
                <th className="py-3">Service</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt._id} className="border-b">
                  <td className="py-3">{apt.slotDate || new Date(apt.date).toLocaleDateString()}</td>
                  <td className="py-3">{apt.slotTime || '-'}</td>
                  <td className="py-3">{apt.docData?.name || 'Service'}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[getAppointmentStatus(apt)] || 'bg-gray-100 text-gray-700'}`}>
                      {getAppointmentStatus(apt)}
                    </span>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-500">No appointments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* My Requested Services */}
      <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">My Requested Services</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="py-3">Date</th>
                <th className="py-3">Service</th>
                <th className="py-3">Status</th>
                <th className="py-3">Advisor</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id} className="border-b">
                  <td className="py-3">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">{(req.services && req.services.length > 0) ? req.services.join(', ') : req.workProfile || 'Consultation'}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[req.status] || 'bg-gray-100 text-gray-700'}`}>
                      {formatStatus(req.status)}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-600">
                    {req.assignedAdvisor && typeof req.assignedAdvisor === 'object' ? req.assignedAdvisor.name : 'Admin (Susovan Bhattacharya)'}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-500">No service requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <PositionAwareButton onClick={() => navigate('/services')}>
            Browse Services
          </PositionAwareButton>
          <PositionAwareButton onClick={() => navigate('/book-call')} variant='light'>
            Book a Call
          </PositionAwareButton>
        </div>
      </section>

      {/* Change Password */}
      <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Change Password</h2>
        {cpStep === 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-3">Send an OTP to your registered email to change your password.</p>
            <PositionAwareButton onClick={sendCpOtp} disabled={loading}>Send OTP</PositionAwareButton>
          </div>
        )}
        {cpStep === 1 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-600">Enter the OTP sent to {user.email}.</p>
            <input value={cpOtp} onChange={(e) => setCpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter OTP" className="w-full rounded-md border px-4 py-3 text-center text-xl tracking-[0.3em] outline-none focus:ring-2 focus:ring-primary" />
            <PositionAwareButton onClick={verifyCpOtp} disabled={loading} className="w-full">Verify OTP</PositionAwareButton>
            <button type="button" disabled={cooldown > 0} onClick={sendCpOtp} className="w-full text-sm font-medium text-primary disabled:text-gray-400">
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
            </button>
          </div>
        )}
        {cpStep === 2 && (
          <div className="mt-4 space-y-3">
            <input type="password" value={cpNewPassword} onChange={(e) => setCpNewPassword(e.target.value)}
              placeholder="New password" className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
            <input type="password" value={cpConfirmPassword} onChange={(e) => setCpConfirmPassword(e.target.value)}
              placeholder="Confirm password" className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
            <PositionAwareButton onClick={submitCpReset} disabled={loading} className="w-full">Save New Password</PositionAwareButton>
          </div>
        )}
      </section>
    </main>
  )
}

export default MyDashboard
