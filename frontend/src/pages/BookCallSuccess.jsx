import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PositionAwareButton from '../components/ui/PositionAwareButton';

const BookCallSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name = 'there' } = location.state || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="inline-block bg-green-100 rounded-full p-6">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Thank You!</h1>
        <p className="text-xl text-gray-700 mb-2">Hi {name},</p>
        <p className="text-gray-600 mb-8">
          Our team has received your request and will contact you shortly.
        </p>

        {/* What to expect */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">What to expect next:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 font-bold">1.</span>
              <span>We will review your information within 24 hours</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 font-bold">2.</span>
              <span>Our advisor will contact you via phone or WhatsApp</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 font-bold">3.</span>
              <span>Schedule a convenient time for your consultation</span>
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          <PositionAwareButton onClick={() => navigate('/')}>
            Back to Home
          </PositionAwareButton>
          <PositionAwareButton 
            onClick={() => navigate('/book-call')}
            variant="light"
          >
            Book Another Call
          </PositionAwareButton>
        </div>

        {/* Support */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-600 text-sm mb-2">Need immediate help?</p>
          <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold">
            WhatsApp us now
          </a>
        </div>
      </div>
    </div>
  );
};

export default BookCallSuccess;
