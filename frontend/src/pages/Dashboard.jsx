import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../services/api'
import PositionAwareButton from '../components/ui/PositionAwareButton'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: me }, { data: consultationData }] = await Promise.all([
          apiClient.get('/auth/me'),
          apiClient.get('/consultation/my-requests').catch(() => ({ data: { consultationRequests: [] } }))
        ])
        setUser(me.user)
        setRequests(consultationData.consultationRequests || [])
      } catch (error) {
        toast.error('Please login to view your dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="py-10"><div className="h-8 w-48 animate-pulse rounded bg-gray-200" /></div>
  if (!user) return null

  return (
    <main className="py-8">
      <h1 className="text-3xl font-bold text-gray-950">Dashboard</h1>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Profile</h2>
          <div className="mt-5 flex items-center gap-4">
            <img src={user.image || '/favicon.svg'} alt="" className="h-16 w-16 rounded-full border object-cover" />
            <div>
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd>{user.phone}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Age</dt><dd>{user.age || 'Not added'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Advisor Access</dt><dd>{user.advisorAccess ? 'Enabled' : 'No'}</dd></div>
          </dl>
          <div className="mt-6">
            <PositionAwareButton onClick={() => window.location.href = '/my-profile'} variant='light'>
              Edit Profile & Change Password
            </PositionAwareButton>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <PositionAwareButton onClick={() => window.location.href = '/services'}>
              Browse Services
            </PositionAwareButton>
            <PositionAwareButton onClick={() => window.location.href = '/book-call'} variant='light'>
              Book a Call
            </PositionAwareButton>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">My Consultation Requests</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-500">
                <tr><th className="py-3">Consultation Date</th><th>Status</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id} className="border-b">
                    <td className="py-3">{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td className="capitalize">{String(request.status).replaceAll('_', ' ')}</td>
                    <td>{request.notes?.at(-1)?.content || 'No notes yet'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && <p className="py-8 text-center text-gray-500">No consultation requests yet.</p>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
