import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'

const DoctorsList = () => {

  const { doctors, changeAvailability, removeDoctor, aToken, getAllDoctors } = useContext(AdminContext)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    if (aToken) {
      getAllDoctors()
    }
  }, [aToken])

  const handleRemove = (id) => {
    if (confirmId === id) {
      removeDoctor(id)
      setConfirmId(null)
    } else {
      setConfirmId(id)
    }
  }

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium'>All Service</h1>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {doctors.length === 0
          ? <p className="text-center text-gray-400 py-8 w-full">No services found</p>
          : doctors.map((item, index) => (
          <div className='border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group' key={index}>
            <img className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500' src={item.image} alt="" />
            <div className='p-4'>
              <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
              <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
              <div className='mt-2 flex items-center gap-1 text-sm'>
                <input onChange={() => changeAvailability(item._id)} type="checkbox" checked={item.available} />
                <p>Available</p>
              </div>

              {/* Remove Service Button */}
              <button
                onClick={() => handleRemove(item._id)}
                className={`mt-3 w-full py-1.5 px-3 rounded text-sm font-medium transition-all duration-200 
                  ${confirmId === item._id
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                  }`}
              >
                {confirmId === item._id ? '⚠ Confirm Remove' : 'Remove Service'}
              </button>
              {confirmId === item._id && (
                <button
                  onClick={() => setConfirmId(null)}
                  className='mt-1 w-full py-1 px-3 rounded text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all'
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
          ))}
      </div>
    </div>
  )
}

export default DoctorsList