import axios from 'axios'
import React, { useContext, useState } from 'react'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { toast } from 'react-toastify'

const Login = () => {

  const [state, setState] = useState('Admin')
  const [showRecovery, setShowRecovery] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const { setDToken } = useContext(DoctorContext)
  const { setAToken } = useContext(AdminContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {

      if (state === 'Admin') {

        if (showRecovery) {
          const { data } = await axios.post(
            backendUrl + '/api/admin/login-recovery',
            { email, recoveryCode }
          )
          if (data.success) {
            setAToken(data.token)
            localStorage.setItem('aToken', data.token)
            toast.success(data.message)
          } else {
            toast.error(data.message)
          }
          return
        }

        const { data } = await axios.post(
          backendUrl + '/api/admin/login',
          { email, password }
        )

        if (data.success) {
          setAToken(data.token)
          localStorage.setItem('aToken', data.token)
        } else if (data.locked && data.recoverySent) {
          setShowRecovery(true)
          toast.info('Account locked. A recovery code has been sent to the admin email. Use it below.')
        } else {
          toast.error(data.message)
        }

      } else {

        const { data } = await axios.post(
          backendUrl + '/api/doctor/login',
          { email, password }
        )

        if (data.success) {
          setDToken(data.token)
          localStorage.setItem('dToken', data.token)
        } else {
          toast.error(data.message)
        }

      }

    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>

        <p className='text-2xl font-semibold m-auto'>
          <span className='text-primary'>
            {state === 'Doctor' ? 'Service' : 'Admin'}
          </span>{' '}
          Login
        </p>

        <div className='w-full'>
          <p>Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className='border border-[#DADADA] rounded w-full p-2 mt-1'
            type="email"
            required
          />
        </div>

        {showRecovery ? (
          <>
            <div className='w-full'>
              <p>Recovery Code (sent to admin email)</p>
              <input
                onChange={(e) => setRecoveryCode(e.target.value)}
                value={recoveryCode}
                className='border border-[#DADADA] rounded w-full p-2 mt-1 text-center tracking-[0.3em] font-mono'
                placeholder='XXXXXXXX'
                required
              />
            </div>
            <button className='bg-primary text-white w-full py-2 rounded-md text-base'>
              Login with Recovery Code
            </button>
            <button type="button" onClick={() => { setShowRecovery(false); setRecoveryCode('') }} className='w-full text-xs text-gray-500 hover:text-primary'>
              Back to password login
            </button>
          </>
        ) : (
          <>
            <div className='w-full'>
              <p>Password</p>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className='border border-[#DADADA] rounded w-full p-2 mt-1'
                type="password"
                required
              />
            </div>
            <button className='bg-primary text-white w-full py-2 rounded-md text-base'>
              Login
            </button>
          </>
        )}

      </div>
    </form>
  )
}

export default Login