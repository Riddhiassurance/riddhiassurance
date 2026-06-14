import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import apiClient from '../services/api'

const statusColors = {
  'new': 'bg-gray-100 text-gray-700',
  'pending': 'bg-yellow-100 text-yellow-700',
  'in_progress': 'bg-blue-100 text-blue-700',
  'in progress': 'bg-blue-100 text-blue-700',
  'contacted': 'bg-blue-100 text-blue-700',
  'follow_up_required': 'bg-orange-100 text-orange-700',
  'converted': 'bg-green-100 text-green-700',
  'completed': 'bg-green-100 text-green-700',
  'cancelled': 'bg-red-100 text-red-700',
  'closed': 'bg-gray-100 text-gray-700'
}

const formatStatus = (s) => (s || '').replace(/_/g, ' ')

const MyAppointments = () => {
  const { token } = useContext(AppContext)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      loadRequests()
    }
  }, [token])

  const loadRequests = async () => {
    try {
      const { data } = await apiClient.get('/consultation/my-requests')
      setRequests(data.consultationRequests || [])
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="py-10 text-center text-gray-500">Loading...</div>

  return (
    <div>
      <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My appointments</p>
      <div className='overflow-x-auto'>
        <table className="w-full text-left text-sm mt-4">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="py-3 pr-4">Date</th>
              <th className="py-3 pr-4">Time</th>
              <th className="py-3 pr-4">Service</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Advisor</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req._id} className="border-b">
                <td className="py-3 pr-4">{req.preferredDate ? new Date(req.preferredDate).toLocaleDateString() : new Date(req.createdAt).toLocaleDateString()}</td>
                <td className="py-3 pr-4">{req.preferredTime || 'Not scheduled'}</td>
                <td className="py-3 pr-4">{(req.services && req.services.length > 0) ? req.services.join(', ') : req.workProfile || 'Consultation'}</td>
                <td className="py-3 pr-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[req.status] || 'bg-gray-100 text-gray-700'}`}>
                    {formatStatus(req.status)}
                  </span>
                </td>
                <td className="py-3 pr-4 text-sm text-gray-600">
                  {req.assignedAdvisor && typeof req.assignedAdvisor === 'object'
                    ? req.assignedAdvisor.name
                    : 'Admin (Susovan Bhattacharya)'}
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">No appointments found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MyAppointments
