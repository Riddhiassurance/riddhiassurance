import { useContext, useEffect } from 'react'
import Navbar from './components/Navbar'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import About from './pages/About'
import Contact from './pages/Contact'
import Appointment from './pages/Appointment'
import MyAppointments from './pages/MyAppointments'
import MyProfile from './pages/MyProfile'
import Footer from './components/Footer'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Verify from './pages/Verify'
import WhatsappButton from './components/WhatsappButton'
import BookCall from './pages/BookCall'
import BookCallSuccess from './pages/BookCallSuccess'
import CreateAccount from './pages/CreateAccount'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Advisor from './pages/Advisor'
import MyDashboard from './pages/MyDashboard'
import AdvisorDashboard from './pages/AdvisorDashboard'
import { AppContext } from './context/AppContext'
import { useNavigate } from 'react-router-dom'
import { wakeBackend } from './services/api'

/* eslint react/prop-types: "off" */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, userData, loadUserProfileData } = useContext(AppContext)

  const role = userData?.role
  const isUserLoggedIn = Boolean(token || localStorage.getItem("token") || localStorage.getItem("aToken") || localStorage.getItem("atoken"))

  useEffect(() => {
    if (isUserLoggedIn && !role) {
      loadUserProfileData?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoggedIn])

  if (!isUserLoggedIn) return <Navigate to="/login" replace />

  // If role isn't loaded yet, don't hard-block; allow children to render
  if (!role) return children

  if (Array.isArray(allowedRoles) && allowedRoles.includes(role)) return children

  if (role === "advisor") return <Navigate to="/advisor-dashboard" replace />
  return <Navigate to="/my-dashboard" replace />
}

const App = () => {
  const navigate = useNavigate()

  // Wake the backend on load so it is likely up by the time a user submits a
  // form (mitigates Render free-tier cold starts).
  useEffect(() => {
    wakeBackend()
  }, [])

  return (
    <div className='mx-4 sm:mx-[10%]'>
      <ToastContainer />
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/services' element={<Doctors />} />
        <Route path='/services/:speciality' element={<Doctors />} />
        <Route path='/login' element={<Navigate to="/auth" replace />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/appointment/:docId' element={<Appointment />} />
        <Route path='/my-appointments' element={<MyAppointments />} />
        <Route path='/my-profile' element={<MyProfile />} />
        <Route path='/verify' element={<Verify />} />
        <Route path='/book-call' element={<BookCall />} />
        <Route path='/book-call-success' element={<BookCallSuccess />} />
        <Route path='/create-account' element={<CreateAccount />} />
        <Route path='/auth' element={<Auth />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route
          path='/my-dashboard'
          element={
            <ProtectedRoute allowedRoles={['user', 'advisor']}>
              <MyDashboard />
            </ProtectedRoute>
          }
        />
        <Route path='/advisor' element={<Advisor />} />
        <Route
          path='/advisor-dashboard'
          element={
            <ProtectedRoute allowedRoles={['advisor']}>
              <AdvisorDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
      <WhatsappButton />
      <button onClick={() => navigate('/book-call')} className='fixed bottom-4 left-4 right-4 z-30 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg md:hidden'>
        Book a Call
      </button>
    </div>
  )
}

export default App
