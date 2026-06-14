import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";

export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')
    const [appointments, setAppointments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [dashData, setDashData] = useState(false)
    const [users, setUsers] = useState([])
    const [consultationRequests, setConsultationRequests] = useState([])

    const getAllDoctors = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const changeAvailability = async (docId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const removeDoctor = async (docId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/remove-doctor', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const getAllAppointments = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
            console.log(error)
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const getDashData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })
            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || error.message)
            setDashData({})
        }
    }

    const getAllUsers = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/all-users', { headers: { aToken } })
            if (data.success) {
                setUsers(data.users)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const resetUserPassword = async (userId, newPassword) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/reset-user-password', { userId, newPassword }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
            console.log(error)
        }
    }

    const setUserDisabled = async (userId, disabled) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/set-user-disabled', { userId, disabled }, { headers: { aToken } })
            data.success ? toast.success(data.message) : toast.error(data.message)
            if (data.success) getAllUsers()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const setAdvisorAccess = async (userId, advisorAccess) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/set-advisor-access', { userId, advisorAccess }, { headers: { aToken } })
            data.success ? toast.success(data.message) : toast.error(data.message)
            if (data.success) getAllUsers()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const getConsultationRequests = async (params = {}) => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/consultation-requests', { headers: { aToken }, params })
            if (data.success) setConsultationRequests(data.consultationRequests)
            else toast.error(data.message)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const updateConsultationRequest = async (id, payload) => {
        try {
            const { data } = await axios.put(backendUrl + `/api/admin/consultation-requests/${id}`, payload, { headers: { aToken } })
            data.success ? toast.success(data.message) : toast.error(data.message)
            if (data.success) getConsultationRequests()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const deleteConsultationRequest = async (id) => {
        try {
            const { data } = await axios.delete(backendUrl + `/api/admin/consultation-requests/${id}`, { headers: { aToken } })
            data.success ? toast.success(data.message) : toast.error(data.message)
            if (data.success) getConsultationRequests()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const assignConsultationRequest = async (requestId, advisorId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/assign-consultation-request', { requestId, advisorId }, { headers: { aToken } })
            data.success ? toast.success(data.message) : toast.error(data.message)
            if (data.success) getConsultationRequests()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const value = {
        aToken, setAToken,
        doctors,
        getAllDoctors,
        changeAvailability,
        removeDoctor,
        appointments,
        getAllAppointments,
        getDashData,
        cancelAppointment,
        dashData,
        users,
        getAllUsers,
        resetUserPassword,
        setUserDisabled,
        setAdvisorAccess,
        consultationRequests,
        getConsultationRequests,
        updateConsultationRequest,
        deleteConsultationRequest,
        assignConsultationRequest
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider

