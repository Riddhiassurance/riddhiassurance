import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'

const ClientsList = () => {

  const { aToken, users, getAllUsers, resetUserPassword } = useContext(AdminContext)
  const [resetUserId, setResetUserId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (aToken) {
      getAllUsers()
    }
  }, [aToken])

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    await resetUserPassword(resetUserId, newPassword)
    setResetUserId(null)
    setNewPassword('')
  }

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium mb-4'>All Clients</h1>

      <div className='bg-white rounded border'>

        <div className='hidden sm:grid grid-cols-[0.5fr_2fr_2fr_1fr_1fr_1fr_1.2fr] py-3 px-6 border-b text-sm font-semibold text-gray-600'>
          <p>#</p>
          <p>Client</p>
          <p>Login Email</p>
          <p>Phone</p>
          <p>Gender</p>
          <p>Date of Birth</p>
          <p>Password</p>
        </div>

        {users.map((user, index) => (
          <div
            className='flex flex-wrap justify-between sm:grid sm:grid-cols-[0.5fr_2fr_2fr_1fr_1fr_1fr_1.2fr] items-center py-3 px-6 border-b hover:bg-gray-50 text-sm text-gray-600'
            key={user._id}
          >
            <p className='font-medium text-gray-500'>{index + 1}</p>

            <div className='flex items-center gap-3'>
              <img
                className='w-9 h-9 rounded-full object-cover border'
                src={user.image}
                alt={user.name}
              />
              <div>
                <p className='font-medium text-gray-800'>{user.name}</p>
              </div>
            </div>

            <p className='text-blue-600 text-xs break-all'>{user.email}</p>
            <p>{user.phone !== '000000000' ? user.phone : '—'}</p>
            <p>{user.gender !== 'Not Selected' ? user.gender : '—'}</p>
            <p>{user.dob !== 'Not Selected' ? user.dob : '—'}</p>

            <button
              onClick={() => { setResetUserId(user._id); setNewPassword('') }}
              className='text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-all'
            >
              Reset Password
            </button>
          </div>
        ))}

        {users.length === 0 && (
          <p className='text-center text-gray-400 py-8'>No clients found</p>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-80 shadow-xl'>
            <h2 className='text-lg font-semibold text-gray-700 mb-1'>Reset Client Password</h2>
            <p className='text-xs text-gray-400 mb-4'>Enter a new password for this client. Minimum 6 characters.</p>

            <div className='relative mb-4'>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter new password'
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className='w-full border rounded px-3 py-2 text-sm outline-none focus:border-primary pr-16'
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-2 top-2 text-xs text-gray-500 hover:text-gray-700'
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className='flex gap-3'>
              <button
                onClick={handleReset}
                className='flex-1 bg-primary text-white py-2 rounded text-sm hover:opacity-90 transition-all'
              >
                Confirm Reset
              </button>
              <button
                onClick={() => { setResetUserId(null); setNewPassword('') }}
                className='flex-1 bg-gray-200 text-gray-700 py-2 rounded text-sm hover:bg-gray-300 transition-all'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ClientsList