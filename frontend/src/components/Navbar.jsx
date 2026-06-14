import { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import PositionAwareButton from './ui/PositionAwareButton'
import apiClient from '../services/api'

const getUserColor = (name = '') => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const Navbar = () => {

  const navigate = useNavigate()

  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, userData, setUserData } = useContext(AppContext)

  const isLoggedIn = !!(token || localStorage.getItem('token') || localStorage.getItem('aToken'))

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.log(error)
    }
    localStorage.removeItem('token')
    localStorage.removeItem('aToken')
    localStorage.removeItem('role')
    setToken(false)
    setUserData(false)
    navigate('/')
  }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]'>
      <img onClick={() => navigate('/')} className='w-44 cursor-pointer' src={assets.logo} alt="" />
      <ul className='md:flex items-start gap-5 font-medium hidden'>
        <NavLink to='/' >
          <li className='py-1'>HOME</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/services' >
          <li className='py-1'>ALL SERVICES</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about' >
          <li className='py-1'>ABOUT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact' >
          <li className='py-1'>CONTACT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>

      </ul>


      <div className='flex items-center gap-4'>
        {
          isLoggedIn
            ? <div className='flex items-center gap-2 cursor-pointer group relative'>
              {userData.image
                ? <img className='w-8 h-8 rounded-full object-cover' src={userData.image} alt="" />
                : <div className='w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold' style={{ backgroundColor: getUserColor(userData.name) }}>{userData.name?.charAt(0).toUpperCase()}</div>
              }
              <span className='text-sm font-medium text-gray-700 hidden md:inline'>{userData?.name || 'User'}</span>
              <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                <div className='min-w-48 bg-gray-50 rounded flex flex-col gap-4 p-4'>
                  <p onClick={() => { navigate('/my-profile'); setShowMenu(false) }} className='hover:text-black cursor-pointer'>My Profile</p>
                  <p onClick={() => { navigate(userData?.role === 'advisor' || userData?.advisorAccess ? '/advisor-dashboard' : '/my-dashboard'); setShowMenu(false) }} className='hover:text-black cursor-pointer'>My Dashboard</p>
                  <p onClick={() => { navigate('/my-appointments'); setShowMenu(false) }} className='hover:text-black cursor-pointer'>My Appointments</p>
                  <p onClick={logout} className='hover:text-black cursor-pointer'>Logout</p>
                </div>
              </div>
            </div>
            : <div className='hidden md:flex items-center gap-3'>
              <PositionAwareButton onClick={() => navigate('/create-account')} variant='light'>Create Account</PositionAwareButton>
              <PositionAwareButton onClick={() => navigate('/auth')} variant='light'>Login</PositionAwareButton>
              <PositionAwareButton onClick={() => navigate('/book-call')}>Book a Call</PositionAwareButton>
            </div>
        }
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        {/* ---- Mobile Menu ---- */}
        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img src={assets.logo} className='w-36' alt="" />
            <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7' alt="" />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 rounded full inline-block'>HOME</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/services'><p className='px-4 py-2 rounded full inline-block'>ALL SERVICES</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about'><p className='px-4 py-2 rounded full inline-block'>ABOUT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact'><p className='px-4 py-2 rounded full inline-block'>CONTACT</p></NavLink>
            {isLoggedIn ? (
              <div className='mt-6 flex w-full flex-col gap-3 px-6 border-t pt-6'>
                <p className='text-center text-sm text-gray-500'>{userData?.name || 'User'}</p>
                <p onClick={() => { setShowMenu(false); navigate('/my-profile') }} className='w-full rounded-md border px-4 py-3 text-center text-sm font-medium hover:bg-gray-50 cursor-pointer'>My Profile</p>
                <p onClick={() => { setShowMenu(false); navigate(userData?.role === 'advisor' || userData?.advisorAccess ? '/advisor-dashboard' : '/my-dashboard') }} className='w-full rounded-md border px-4 py-3 text-center text-sm font-medium hover:bg-gray-50 cursor-pointer'>My Dashboard</p>
                <p onClick={() => { setShowMenu(false); navigate('/my-appointments') }} className='w-full rounded-md border px-4 py-3 text-center text-sm font-medium hover:bg-gray-50 cursor-pointer'>My Appointments</p>
                <p onClick={() => { logout(); setShowMenu(false) }} className='w-full rounded-md border border-red-200 px-4 py-3 text-center text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer'>Logout</p>
              </div>
            ) : (
              <div className='mt-4 flex w-full flex-col gap-3 px-6'>
                <PositionAwareButton onClick={() => { setShowMenu(false); navigate('/auth') }} variant='light' className='w-full'>Login</PositionAwareButton>
                <PositionAwareButton onClick={() => { setShowMenu(false); navigate('/create-account') }} variant='light' className='w-full'>Create Account</PositionAwareButton>
                <PositionAwareButton onClick={() => { setShowMenu(false); navigate('/book-call') }} className='w-full'>Book a Call</PositionAwareButton>
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar
