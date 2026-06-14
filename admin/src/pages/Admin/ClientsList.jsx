import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'

const ClientsList = () => {
  const { aToken, users, getAllUsers, resetUserPassword, setUserDisabled, setAdvisorAccess } = useContext(AdminContext)
  const [resetUserId, setResetUserId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (aToken) getAllUsers()
  }, [aToken])

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }
    await resetUserPassword(resetUserId, newPassword)
    setResetUserId(null)
    setNewPassword('')
  }

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium mb-4'>Customer Management</h1>
      <div className='bg-white rounded border overflow-x-auto'>
        <div className='hidden sm:grid min-w-[980px] grid-cols-[0.5fr_2fr_2fr_1fr_1fr_1fr_1fr_2.2fr] py-3 px-6 border-b text-sm font-semibold text-gray-600'>
          <p>#</p>
          <p>Customer</p>
          <p>Login Email</p>
          <p>Phone</p>
          <p>Gender</p>
          <p>Date of Birth</p>
          <p>Access</p>
          <p>Actions</p>
        </div>

        {users.map((user, index) => (
          <div
            className='flex flex-wrap justify-between gap-3 sm:grid sm:min-w-[980px] sm:grid-cols-[0.5fr_2fr_2fr_1fr_1fr_1fr_1fr_2.2fr] items-center py-3 px-6 border-b hover:bg-gray-50 text-sm text-gray-600'
            key={user._id}
          >
            <p className='font-medium text-gray-500'>{index + 1}</p>
            <div className='flex items-center gap-3'>
              <img className='w-9 h-9 rounded-full object-cover border' src={user.image || '/favicon.svg'} alt={user.name} />
              <p className='font-medium text-gray-800'>{user.name}</p>
            </div>
            <p className='text-blue-600 text-xs break-all'>{user.email}</p>
            <p>{user.phone || '-'}</p>
            <p>{user.gender || '-'}</p>
            <p>{user.dob ? String(user.dob).slice(0, 10) : '-'}</p>
            <div className='flex flex-col gap-1 text-xs'>
              <span className={user.disabled ? 'text-red-600' : 'text-green-600'}>{user.disabled ? 'Disabled' : 'Enabled'}</span>
              <span className={user.advisorAccess ? 'text-blue-600' : 'text-gray-400'}>{user.advisorAccess ? 'Advisor' : 'Customer'}</span>
            </div>
            <div className='flex flex-wrap gap-2'>
              <button onClick={() => setUserDisabled(user._id, !user.disabled)} className='text-xs bg-gray-700 text-white px-3 py-1 rounded'>
                {user.disabled ? 'Enable' : 'Disable'}
              </button>
              <button onClick={() => setAdvisorAccess(user._id, !user.advisorAccess)} className='text-xs bg-primary text-white px-3 py-1 rounded'>
                {user.advisorAccess ? 'Revoke Advisor' : 'Grant Advisor'}
              </button>
              <button onClick={() => { setResetUserId(user._id); setNewPassword('') }} className='text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-all'>
                Reset Password
              </button>
            </div>
          </div>
        ))}

        {users.length === 0 && <p className='text-center text-gray-400 py-8'>No customers found</p>}
      </div>

      {resetUserId && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-80 shadow-xl'>
            <h2 className='text-lg font-semibold text-gray-700 mb-1'>Reset Customer Password</h2>
            <p className='text-xs text-gray-400 mb-4'>Use a strong password. Minimum 8 characters.</p>
            <div className='relative mb-4'>
              <input type={showPassword ? 'text' : 'password'} placeholder='Enter new password' value={newPassword} onChange={e => setNewPassword(e.target.value)} className='w-full border rounded px-3 py-2 text-sm outline-none focus:border-primary pr-16' />
              <button onClick={() => setShowPassword(!showPassword)} className='absolute right-2 top-2 text-xs text-gray-500 hover:text-gray-700'>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className='flex gap-3'>
              <button onClick={handleReset} className='flex-1 bg-primary text-white py-2 rounded text-sm hover:opacity-90 transition-all'>Confirm Reset</button>
              <button onClick={() => { setResetUserId(null); setNewPassword('') }} className='flex-1 bg-gray-200 text-gray-700 py-2 rounded text-sm hover:bg-gray-300 transition-all'>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientsList
