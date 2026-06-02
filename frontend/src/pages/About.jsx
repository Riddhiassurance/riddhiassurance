import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div className='px-4 md:px-10 lg:px-20 py-10 bg-gradient-to-b from-white to-[#f5f7ff]'>

      {/* ---------- HEADER ---------- */}
      <div className='text-center mb-16'>

        <span className='px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide'>
          About Riddhi Assurance
        </span>

        <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mt-6'>
          Trusted Insurance Guidance
        </h1>

        <p className='max-w-3xl mx-auto mt-6 text-gray-500 leading-8 text-base md:text-lg'>
          Helping families secure their future with personalized
          life and health insurance solutions backed by trusted
          expertise and reliable support.
        </p>

      </div>


      {/* ---------- ABOUT SECTION ---------- */}
      <div className='grid lg:grid-cols-2 gap-14 items-center'>

        {/* Left Image */}
        <div className='relative flex justify-center'>

          <div className='absolute w-72 h-72 bg-primary/10 rounded-full blur-3xl'></div>

          <img
            className='relative w-full max-w-[480px] rounded-[35px] shadow-2xl border border-white'
            src={assets.about_image}
            alt=""
          />

        </div>


        {/* Right Content */}
        <div className='space-y-8'>

          <div>

            <span className='text-primary font-semibold uppercase tracking-wider'>
              Who We Are
            </span>

            <h2 className='text-4xl font-bold text-gray-900 mt-3 leading-tight'>
              Your Trusted Partner for Insurance Solutions
            </h2>

          </div>


          <p className='text-gray-600 leading-8 text-lg'>
            Welcome to Riddhi Assurance, your trusted destination
            for life and health insurance solutions. We help
            individuals and families choose the right protection
            plans with confidence and clarity.
          </p>

          <p className='text-gray-600 leading-8 text-lg'>
            Led by Susovan Bhattacharya, we proudly work with
            trusted providers like LIC and Star Health Insurance
            to deliver transparent guidance, personalized support,
            and reliable financial protection for every client.
          </p>


          {/* Vision Box */}
          <div className='bg-white rounded-3xl shadow-xl border border-gray-100 p-8'>

            <h3 className='text-2xl font-bold text-gray-900 mb-4'>
              Our Vision
            </h3>

            <p className='text-gray-600 leading-8'>
              To simplify insurance for every family by creating
              a seamless experience with trusted advice,
              transparent service, and complete financial security.
            </p>

          </div>

        </div>

      </div>



      {/* ---------- WHY CHOOSE US ---------- */}
      <div className='mt-28 text-center'>

        <span className='px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide'>
          Why Choose Us
        </span>

        <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mt-6'>
          Excellence You Can Trust
        </h2>

      </div>



      {/* ---------- CARDS ---------- */}
      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16 mb-20'>

        {/* Achievements */}
        <div className='group bg-white border border-gray-100 rounded-[30px] p-8 shadow-lg hover:shadow-2xl hover:-translate-y-3 transition-all duration-500'>

          <div className='w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl mb-6'>
            🏆
          </div>

          <h3 className='text-2xl font-bold text-gray-900 mb-5'>
            Achievements
          </h3>

          <ul className='space-y-3 text-gray-600 leading-7'>
            <li>• Outstanding Performance FY 2021–2022</li>
            <li>• BM Club Membership 2024–25</li>
            <li>• Certificate of Excellence 2024–2025</li>
            <li>• Bima Samman Trophy 2021–22</li>
            <li>• Champion Trophy 2018</li>
          </ul>

        </div>



        {/* Convenience */}
        <div className='group bg-white border border-gray-100 rounded-[30px] p-8 shadow-lg hover:shadow-2xl hover:-translate-y-3 transition-all duration-500'>

          <div className='w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl mb-6'>
            ⚡
          </div>

          <h3 className='text-2xl font-bold text-gray-900 mb-5'>
            Convenience
          </h3>

          <p className='text-gray-600 leading-8'>
            Fast access to trusted insurance guidance, simplified
            claim assistance, and reliable support whenever you need it.
          </p>

        </div>



        {/* Personalization */}
        <div className='group bg-white border border-gray-100 rounded-[30px] p-8 shadow-lg hover:shadow-2xl hover:-translate-y-3 transition-all duration-500'>

          <div className='w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl mb-6'>
            🎯
          </div>

          <h3 className='text-2xl font-bold text-gray-900 mb-5'>
            Personalization
          </h3>

          <p className='text-gray-600 leading-8'>
            Customized insurance solutions tailored to your
            financial goals, healthcare needs, and family protection.
          </p>

        </div>

      </div>

    </div>
  )
}

export default About