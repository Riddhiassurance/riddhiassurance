import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (

    <footer className='relative mt-40 overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e3a8a] text-white rounded-t-[40px]'>

      {/* Background Blur Effects */}
      <div className='absolute top-0 left-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl'></div>

      <div className='absolute bottom-0 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl'></div>

      {/* Grid Effect */}
      <div className='absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff22_1px,transparent_1px),linear-gradient(to_bottom,#ffffff22_1px,transparent_1px)] bg-[size:40px_40px]'></div>

      <div className='relative z-10 md:mx-10 px-6 sm:px-10 lg:px-14 py-16'>

        {/* Main Footer */}
        <div className='grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-14'>

          {/* Left Section */}
          <div>

            <img
              className='mb-6 w-44 bg-white p-2 rounded-xl shadow-lg'
              src={assets.logo}
              alt=""
            />

            <p className='text-gray-300 leading-7 text-sm md:w-[90%]'>

              Riddhi Assurance is your trusted partner for
              life and health insurance solutions, led by
              advisor Susovan Bhattacharya.

              We specialize in personalized insurance planning
              with Star Health Insurance and LIC to help secure
              your family's future with confidence and expert guidance.

            </p>

          </div>


          {/* Company Section */}
          <div>

            <h2 className='text-2xl font-semibold mb-6 text-cyan-300'>
              COMPANY
            </h2>

            <ul className='flex flex-col gap-4 text-gray-300 text-sm'>

              <li className='hover:text-cyan-300 transition-all duration-300 cursor-pointer'>
                (Phone 1)
              </li>

              <li className='hover:text-cyan-300 transition-all duration-300 cursor-pointer'>
                (Phone 2)
              </li>

              <li className='hover:text-cyan-300 transition-all duration-300 cursor-pointer'>
                Service Email
              </li>

              <li className='hover:text-cyan-300 transition-all duration-300 cursor-pointer'>
                Office Address
              </li>

            </ul>

          </div>


          {/* Contact Section */}
          <div>

            <h2 className='text-2xl font-semibold mb-6 text-cyan-300'>
              GET IN TOUCH
            </h2>

            <ul className='flex flex-col gap-4 text-gray-300 text-sm'>

              <li className='flex items-center gap-3'>
                📞 +91 9733067299
              </li>

              <li className='flex items-center gap-3'>
                📞 +91 8509716112
              </li>

              <li className='flex items-center gap-3 break-all'>
                ✉️ susovanb409@gmail.com
              </li>

              <li className='flex items-start gap-3'>
                📍 Old Busstand, Kalna,
                Purba Bardhaman, WB - 713409
              </li>

            </ul>

          </div>

        </div>


        {/* Bottom Footer */}
        <div className='mt-14 border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4'>

          <p className='text-sm text-gray-400 text-center md:text-left'>
            © 2026 Riddhi Assurance. All Rights Reserved.
          </p>

          <p className='text-sm text-cyan-300 font-medium'>
            Developed by Pratip Mitra 🚀
          </p>

        </div>

      </div>

    </footer>
  )
}

export default Footer