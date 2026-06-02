import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const RelatedDoctors = ({ speciality, docId }) => {

    const navigate = useNavigate()

    const { doctors } = useContext(AppContext)

    const [relDoc, setRelDoc] = useState([])


    // ---------- FILTER RELATED DOCTORS ----------
    useEffect(() => {

        if (doctors.length > 0 && speciality) {

            const doctorsData = doctors.filter(
                (doc) =>
                    doc.speciality === speciality &&
                    doc._id !== docId
            )

            setRelDoc(doctorsData)
        }

    }, [doctors, speciality, docId])



    return (

        <div className='relative my-24'>

            {/* ---------- HEADING ---------- */}
            <div className='text-center mb-14'>

                <div className='inline-block bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-medium mb-5 shadow-sm'>

                    Trusted Experts

                </div>

                <h1 className='text-4xl md:text-5xl font-bold text-[#0f172a]'>

                    Related Services

                </h1>

                <p className='sm:w-2/4 mx-auto text-gray-500 text-base mt-5 leading-7'>

                    Discover trusted insurance advisors and personalized
                    services tailored to your financial and healthcare needs.

                </p>

            </div>



            {/* ---------- CARDS ---------- */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-2 sm:px-0'>

                {relDoc.map((item, index) => (

                    <div
                        key={index}
                        onClick={() => {
                            navigate(`/appointment/${item._id}`)
                            scrollTo(0, 0)
                        }}
                        className='group relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-lg hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 cursor-pointer'
                    >

                        {/* Gradient Glow */}
                        <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-all duration-500'></div>


                        {/* Doctor Image */}
                        <div className='relative overflow-hidden bg-gradient-to-br from-[#E0F2FE] to-[#DBEAFE]'>

                            <img
                                className='w-full h-72 object-cover group-hover:scale-110 transition-all duration-700'
                                src={item.image}
                                alt=""
                            />

                        </div>


                        {/* Content */}
                        <div className='relative p-5'>

                            {/* Status */}
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 ${item.available
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>

                                <span
                                    className={`w-2 h-2 rounded-full ${item.available
                                            ? 'bg-green-500'
                                            : 'bg-gray-400'
                                        }`}
                                ></span>

                                {item.available
                                    ? 'Available Now'
                                    : 'Currently Unavailable'}

                            </div>


                            {/* Name */}
                            <h2 className='text-xl font-bold text-[#0f172a] group-hover:text-primary transition-all duration-300'>

                                {item.name}

                            </h2>


                            {/* Speciality */}
                            <p className='text-gray-500 text-sm mt-2 leading-6'>

                                {item.speciality}

                            </p>


                            {/* Bottom Button */}
                            <button
                                className='mt-6 w-full bg-gradient-to-r from-primary to-blue-600 text-white py-3 rounded-2xl font-medium hover:shadow-lg transition-all duration-300'
                            >

                                Book Appointment

                            </button>

                        </div>

                    </div>

                ))}

            </div>

        </div>
    )
}

export default RelatedDoctors