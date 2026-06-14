import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../services/api'
import PositionAwareButton from '../components/ui/PositionAwareButton'

const AdvisorDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [leads, setLeads] = useState([])
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Change password OTP flow
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

  const isNewlyAssigned = (lead) => {
    if (!lead.assignedAt) return false
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return new Date(lead.assignedAt) >= sevenDaysAgo
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, leadsRes, appointmentsRes, dashRes] = await Promise.all([
          apiClient.get('/auth/me'),
          apiClient.get('/advisor/leads').catch(() => ({ data: { leads: [], stats: {} } })),
          apiClient.get('/consultation/advisor-appointments').catch(() => ({ data: { consultationRequests: [] } })),
          apiClient.get('/advisor/dashboard').catch(() => ({ data: { stats: {} } }))
        ])
        setUser(meRes.data.user)
        setLeads(leadsRes.data.leads || [])
        setAppointments(appointmentsRes.data.consultationRequests || [])
        setStats(dashRes.data.stats || leadsRes.data.stats || {})
      } catch (error) {
        toast.error('Advisor access required')
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  const getStatusColor = (status) => {
    const map = {
      'new': 'bg-blue-100 text-blue-700',
      'contacted': 'bg-yellow-100 text-yellow-700',
      'follow_up_required': 'bg-orange-100 text-orange-700',
      'interested': 'bg-purple-100 text-purple-700',
      'not_interested': 'bg-gray-100 text-gray-700',
      'converted': 'bg-green-100 text-green-700',
      'closed': 'bg-red-100 text-red-700'
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  const sendCpOtp = async () => {
    if (!user?.email) { toast.error('No email on profile'); return }
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/forgot-password/request-otp', { emailOrPhone: user.email })
      if (data.success) {
        setCpStep(1); startCooldown(); toast.success('OTP sent to your email')
      }
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

  if (loading) return <div className="py-10 text-center text-gray-500">Loading advisor dashboard...</div>
  if (!user) return null

  const newLeads = leads.filter(isNewlyAssigned)

  return (
    <main className="py-8">
      <h1 className="text-3xl font-bold text-gray-950">Advisor Dashboard</h1>
      <p className="mt-1 text-gray-600">Welcome, {user.name}</p>

      {/* New Client Notification */}
      {newLeads.length > 0 && (
        <div className="mt-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3">
              <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
            <p className="font-semibold text-green-800">
              {newLeads.length} new {newLeads.length === 1 ? 'client' : 'clients'} assigned in the last 7 days
            </p>
          </div>
        </div>
      )}

      {/* Profile */}
      <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Profile</h2>
        <div className="mt-5 flex items-center gap-4">
          <img src={user.image || '/favicon.svg'} alt="" className="h-16 w-16 rounded-full border object-cover" />
          <div>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </section>

      {/* Work Overview */}
      {stats && (
        <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Work Overview</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.due ?? stats.totalLeads - (stats.completed || 0)}</p>
              <p className="text-sm text-blue-600">Due</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.completed || stats.convertedLeads || 0}</p>
              <p className="text-sm text-green-600">Completed</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{stats.total || stats.totalLeads || 0}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{stats.conversionRate || 0}%</p>
              <p className="text-sm text-purple-600">Conversion</p>
            </div>
          </div>
        </section>
      )}

      {/* Assigned Clients */}
      <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Assigned Clients ({leads.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="py-3">Name</th>
                <th className="py-3">Email</th>
                <th className="py-3">Phone</th>
                <th className="py-3">Service</th>
                <th className="py-3">Status</th>
                <th className="py-3">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} className="border-b">
                  <td className="py-3 font-medium text-gray-900">
                    {lead.name}
                    {isNewlyAssigned(lead) && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        NEW
                      </span>
                    )}
                  </td>
                  <td className="py-3">{lead.email || '-'}</td>
                  <td className="py-3">{lead.phone}</td>
                  <td className="py-3">{lead.workProfile || lead.productInterested || 'Consultation'}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(lead.status)}`}>
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-gray-500">
                    {lead.assignedAt ? new Date(lead.assignedAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">No clients assigned yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* My Appointments */}
      <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">My Appointments ({appointments.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Client</th>
                <th className="py-3 pr-4">Service</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt._id} className="border-b">
                  <td className="py-3 pr-4">{apt.preferredDate ? new Date(apt.preferredDate).toLocaleDateString() : new Date(apt.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 pr-4 font-medium text-gray-900">{apt.name}</td>
                  <td className="py-3 pr-4">{(apt.services && apt.services.length > 0) ? apt.services.join(', ') : apt.workProfile || 'Consultation'}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(apt.status)}`}>
                      {apt.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-500">No appointments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Change Password */}
      <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Change Password</h2>
        {cpStep === 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-3">Send an OTP to your registered email to change your password.</p>
            <PositionAwareButton onClick={sendCpOtp} disabled={loading}>
              Send OTP
            </PositionAwareButton>
          </div>
        )}
        {cpStep === 1 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-600">Enter the OTP sent to {user.email}.</p>
            <input value={cpOtp} onChange={(e) => setCpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter OTP"
              className="w-full rounded-md border px-4 py-3 text-center text-xl tracking-[0.3em] outline-none focus:ring-2 focus:ring-primary" />
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

export default AdvisorDashboard
