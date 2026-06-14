import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../services/api'
import PositionAwareButton from '../components/ui/PositionAwareButton'

const statuses = ['new', 'contacted', 'follow_up_required', 'interested', 'not_interested', 'converted', 'closed']

const Advisor = () => {
  const [stats, setStats] = useState(null)
  const [workStats, setWorkStats] = useState(null)
  const [followUps, setFollowUps] = useState({ today: [], overdue: [], upcoming: [] })
  const [leads, setLeads] = useState([])
  const [selected, setSelected] = useState(null)
  const [update, setUpdate] = useState({ status: '', note: '', followUpDate: '', followUpTime: '', followUpNote: '', communicationType: '', communicationStatus: '', productInterested: '', policyType: '', premiumAmount: '' })

  const load = async () => {
    try {
      const [{ data: dashboard }, { data: leadData }] = await Promise.all([
        apiClient.get('/advisor/dashboard'),
        apiClient.get('/advisor/clients')
      ])
      setStats(dashboard.stats)
      setWorkStats(leadData.stats)
      setFollowUps(dashboard.followUps)
      setLeads(leadData.leads)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Advisor access required')
    }
  }

  useEffect(() => { load() }, [])

  const saveLead = async () => {
    if (!selected) return
    try {
      const payload = {
        status: update.status || selected.status,
        note: update.note,
        followUpDate: update.followUpDate,
        followUpTime: update.followUpTime,
        followUpNote: update.followUpNote
      }
      if (update.communicationType && update.communicationStatus) {
        payload.communication = { type: update.communicationType, status: update.communicationStatus, notes: update.note }
      }
      if ((update.status || selected.status) === 'converted') {
        payload.conversion = {
          productInterested: update.productInterested,
          policyType: update.policyType,
          premiumAmount: Number(update.premiumAmount || 0)
        }
      }
      const { data } = await apiClient.put(`/advisor/leads/${selected._id}`, payload)
      if (data.success) {
        toast.success('Lead updated')
        setSelected(data.lead)
        setUpdate({ status: '', note: '', followUpDate: '', followUpTime: '', followUpNote: '', communicationType: '', communicationStatus: '', productInterested: '', policyType: '', premiumAmount: '' })
        load()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update lead')
    }
  }

  return (
    <main className="py-8">
      <h1 className="text-3xl font-bold text-gray-950">Advisor Dashboard</h1>
      {stats && <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Total Leads', stats.totalLeads],
          ['New Leads', stats.newLeads],
          ['Follow-Up Leads', stats.followUpLeads],
          ['Converted Leads', stats.convertedLeads],
          ['Conversion Rate', `${stats.conversionRate}%`]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-950">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </section>}

      {workStats && <section className="mt-6">
        <h2 className="text-xl font-semibold text-gray-950">Work Overview</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ['Assigned / Due', workStats.due],
            ['Completed', workStats.completed],
            ['Total Assigned', workStats.total]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-3xl font-bold text-primary">{value}</p>
              <p className="mt-1 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>}

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Assigned Leads</h2>
          <div className="mt-4 space-y-3">
            {leads.map((lead) => (
              <button key={lead._id} onClick={() => setSelected(lead)} className="block w-full rounded-md border p-4 text-left hover:border-primary">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{lead.name}</p>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">{lead.status.replaceAll('_', ' ')}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{lead.phone} · {lead.email || 'No email'} · {lead.workProfile}</p>
              </button>
            ))}
            {leads.length === 0 && <p className="py-8 text-center text-gray-500">No assigned leads.</p>}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Follow-Ups</h2>
          {['today', 'overdue', 'upcoming'].map((group) => (
            <div key={group} className="mt-4">
              <p className="text-sm font-semibold capitalize text-gray-500">{group}</p>
              {(followUps[group] || []).slice(0, 3).map((lead) => <p key={lead._id} className="mt-2 rounded bg-gray-50 p-2 text-sm">{lead.name} - {lead.nextFollowUpNote || 'Follow up'}</p>)}
            </div>
          ))}
        </div>
      </section>

      {selected && <section className="mt-6 rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Lead Details</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <p><span className="text-gray-500">Name:</span> {selected.name}</p>
          <p><span className="text-gray-500">Phone:</span> {selected.phone}</p>
          <p><span className="text-gray-500">Email:</span> {selected.email || 'Not provided'}</p>
          <p><span className="text-gray-500">Age:</span> {selected.age}</p>
          <p><span className="text-gray-500">Work:</span> {selected.workProfile}</p>
          <p><span className="text-gray-500">Source:</span> {selected.source}</p>
          <p><span className="text-gray-500">Priority:</span> {selected.priority}</p>
          <p><span className="text-gray-500">Status:</span> {selected.status.replaceAll('_', ' ')}</p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <select value={update.status} onChange={(e) => setUpdate({ ...update, status: e.target.value })} className="rounded-md border px-3 py-2">
            <option value="">Update status</option>
            {statuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
          </select>
          <input value={update.note} onChange={(e) => setUpdate({ ...update, note: e.target.value })} placeholder="Add note" className="rounded-md border px-3 py-2" />
          <input type="date" value={update.followUpDate} onChange={(e) => setUpdate({ ...update, followUpDate: e.target.value })} className="rounded-md border px-3 py-2" />
          <input type="time" value={update.followUpTime} onChange={(e) => setUpdate({ ...update, followUpTime: e.target.value })} className="rounded-md border px-3 py-2" />
          <input value={update.followUpNote} onChange={(e) => setUpdate({ ...update, followUpNote: e.target.value })} placeholder="Reminder note" className="rounded-md border px-3 py-2" />
          <select value={update.communicationType} onChange={(e) => setUpdate({ ...update, communicationType: e.target.value })} className="rounded-md border px-3 py-2">
            <option value="">Communication</option><option value="call">Call</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="meeting">Meeting</option>
          </select>
          <select value={update.communicationStatus} onChange={(e) => setUpdate({ ...update, communicationStatus: e.target.value })} className="rounded-md border px-3 py-2">
            <option value="">Communication Status</option><option value="attempted">Call Attempted</option><option value="connected">Call Connected</option><option value="sent">Sent</option><option value="scheduled">Meeting Scheduled</option><option value="completed">Completed</option>
          </select>
          <input value={update.productInterested} onChange={(e) => setUpdate({ ...update, productInterested: e.target.value })} placeholder="Product interested in" className="rounded-md border px-3 py-2" />
          <input value={update.policyType} onChange={(e) => setUpdate({ ...update, policyType: e.target.value })} placeholder="Policy type" className="rounded-md border px-3 py-2" />
          <input value={update.premiumAmount} onChange={(e) => setUpdate({ ...update, premiumAmount: e.target.value })} placeholder="Premium amount" className="rounded-md border px-3 py-2" />
        </div>
        <PositionAwareButton onClick={saveLead} className="mt-5">Save Lead</PositionAwareButton>
      </section>}
    </main>
  )
}

export default Advisor
