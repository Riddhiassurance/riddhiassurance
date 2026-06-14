import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'

const statusOptions = ['new', 'contacted', 'follow_up_required', 'converted', 'closed', 'pending', 'in_progress', 'completed', 'cancelled']
const priorityOptions = ['hot', 'warm', 'cold']

const ConsultationRequests = () => {
  const {
    aToken,
    users,
    getAllUsers,
    consultationRequests,
    getConsultationRequests,
    updateConsultationRequest,
    deleteConsultationRequest,
    assignConsultationRequest
  } = useContext(AdminContext)
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' })
  const [drafts, setDrafts] = useState({})

  useEffect(() => {
    if (aToken) {
      getAllUsers()
      getConsultationRequests(filters)
    }
  }, [aToken])

  const advisors = useMemo(() => users.filter((user) => user.advisorAccess && !user.disabled), [users])

  const applyFilters = () => getConsultationRequests(filters)
  const draftFor = (id) => drafts[id] || {}
  const setDraft = (id, patch) => setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  return (
    <div className='m-5 w-full max-h-[90vh] overflow-y-auto'>
      <h1 className='text-lg font-medium mb-4'>Consultation Requests</h1>
      <div className='mb-4 grid gap-3 rounded border bg-white p-4 md:grid-cols-4'>
        <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder='Search name, phone, email' className='rounded border px-3 py-2 text-sm outline-none focus:border-primary' />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className='rounded border px-3 py-2 text-sm'>
          <option value=''>All statuses</option>
          {statusOptions.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className='rounded border px-3 py-2 text-sm'>
          <option value=''>All priorities</option>
          {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <button onClick={applyFilters} className='rounded bg-primary px-4 py-2 text-sm font-medium text-white'>Apply</button>
      </div>

      <div className='overflow-x-auto rounded border bg-white'>
        <table className='w-full min-w-[1100px] text-left text-sm'>
          <thead className='border-b bg-gray-50 text-gray-600'>
            <tr>
              <th className='p-3'>Name</th>
              <th className='p-3'>Phone</th>
              <th className='p-3'>Email</th>
              <th className='p-3'>Age</th>
              <th className='p-3'>Profession</th>
              <th className='p-3'>Status</th>
              <th className='p-3'>Created Date</th>
              <th className='p-3'>Advisor</th>
              <th className='p-3'>Notes</th>
              <th className='p-3'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultationRequests.map((request) => (
              <tr key={request._id} className='border-b align-top'>
                <td className='p-3 font-medium text-gray-800'>{request.name}</td>
                <td className='p-3'>{request.phone}</td>
                <td className='p-3 text-blue-600'>{request.email || '-'}</td>
                <td className='p-3'>{request.age}</td>
                <td className='p-3'>{request.workProfile}</td>
                <td className='p-3'>
                  <select value={draftFor(request._id).status ?? request.status} onChange={(e) => setDraft(request._id, { status: e.target.value })} className='rounded border px-2 py-1 capitalize'>
                    {statusOptions.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
                  </select>
                </td>
                <td className='p-3'>{new Date(request.createdAt).toLocaleDateString()}</td>
                <td className='p-3'>
                  <select value={request.assignedAdvisor?._id || ''} onChange={(e) => e.target.value && assignConsultationRequest(request._id, e.target.value)} className='rounded border px-2 py-1'>
                    <option value=''>Unassigned</option>
                    {advisors.map((advisor) => <option key={advisor._id} value={advisor._id}>{advisor.name}</option>)}
                  </select>
                </td>
                <td className='p-3'>
                  <textarea value={draftFor(request._id).notes || ''} onChange={(e) => setDraft(request._id, { notes: e.target.value })} placeholder={request.notes?.at(-1)?.content || 'Add note'} className='h-16 w-44 rounded border px-2 py-1' />
                </td>
                <td className='p-3'>
                  <div className='flex flex-col gap-2'>
                    <button onClick={() => updateConsultationRequest(request._id, draftFor(request._id))} className='rounded bg-primary px-3 py-1 text-xs text-white'>Save</button>
                    <button onClick={() => deleteConsultationRequest(request._id)} className='rounded bg-red-500 px-3 py-1 text-xs text-white'>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {consultationRequests.length === 0 && <p className='py-8 text-center text-gray-400'>No consultation requests found</p>}
      </div>
    </div>
  )
}

export default ConsultationRequests
