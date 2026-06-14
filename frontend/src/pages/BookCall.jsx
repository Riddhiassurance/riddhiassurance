import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../services/api';
import { consultationRequestSchema, validate } from '../services/validationSchemas';
import PositionAwareButton from '../components/ui/PositionAwareButton';
import { AppContext } from '../context/AppContext';

const calculateAge = (dob) => {
  if (!dob) return ''
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const BookCall = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useContext(AppContext);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    workProfile: '',
    gender: 'prefer_not_to_say',
    services: [],
    preferredDate: '',
    preferredTime: ''
  });

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const init = async () => {
      const serviceParam = searchParams.get('service');
      const dateParam = searchParams.get('date');
      const timeParam = searchParams.get('time');

      if (token) {
        try {
          const { data } = await apiClient.get('/auth/me');
          if (data.user) {
            setFormData((prev) => ({
              ...prev,
              name: data.user.name || '',
              email: data.user.email || '',
              phone: data.user.phone || '',
              age: data.user.dob ? calculateAge(data.user.dob) : (data.user.age || ''),
              gender: data.user.gender || 'prefer_not_to_say',
              services: serviceParam ? [serviceParam] : prev.services,
              preferredDate: dateParam || prev.preferredDate,
              preferredTime: timeParam || prev.preferredTime
            }));
          }
        } catch (error) {
          console.log('Could not load profile');
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          services: serviceParam ? [serviceParam] : [],
          preferredDate: dateParam || '',
          preferredTime: timeParam || ''
        }));
      }
    };

    const loadServices = async () => {
      try {
        const { data } = await apiClient.get('/doctor/list');
        if (data.success) setServices(data.doctors || []);
      } catch (error) {
        console.log('Failed to load services');
      }
    };

    loadServices();
    init();
  }, [searchParams, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleServiceToggle = (serviceName) => {
    setFormData(prev => {
      const exists = prev.services.includes(serviceName);
      return {
        ...prev,
        services: exists
          ? prev.services.filter(s => s !== serviceName)
          : [...prev.services, serviceName]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await validate(consultationRequestSchema, {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone,
        age: parseInt(formData.age),
        workProfile: formData.workProfile,
        gender: formData.gender,
        services: formData.services,
        preferredDate: formData.preferredDate || undefined,
        preferredTime: formData.preferredTime || undefined
      });

      if (!result.success) {
        setErrors(result.errors);
        toast.error('Please fix the errors in the form');
        setLoading(false);
        return;
      }

      const response = await apiClient.post('/consultation/request', {
        ...formData,
        age: parseInt(formData.age)
      });

      if (response.data.success) {
        toast.success('Request submitted! Our team will contact you shortly.');
        navigate('/book-call-success', { state: { name: formData.name, phone: formData.phone } });
      } else {
        toast.error(response.data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book Your Free Consultation</h1>
          <p className="text-gray-600 text-lg">Tell us a little about yourself and our team will contact you shortly.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Full Name */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!!token}
              placeholder="Enter your full name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'} ${token ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Email Address (Optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!!token}
              placeholder="your@email.com"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'} ${token ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Phone Number */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="10-digit mobile number"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Gender */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              disabled={!!token}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${token ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Age */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Age *</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="18-100"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
          </div>

          {/* Services Multi-Select */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Select Services</label>
            <div className="grid grid-cols-2 gap-2">
              {services.length === 0
                ? <p className="col-span-2 text-sm text-gray-400 py-4 text-center">Loading services...</p>
                : services.map((service) => (
                  <label
                    key={service._id}
                    className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                      formData.services.includes(service.name)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.services.includes(service.name)}
                      onChange={() => handleServiceToggle(service.name)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{service.name}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Preferred Date */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Preferred Date</label>
            <input
              type="date"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preferred Time */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Preferred Time</label>
            <input
              type="time"
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Work Profile */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-2">Work Profile / Occupation *</label>
            <input
              type="text"
              name="workProfile"
              value={formData.workProfile}
              onChange={handleInputChange}
              placeholder="e.g., Software Engineer, Business Owner, Student"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.workProfile ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.workProfile && <p className="text-red-500 text-sm mt-1">{errors.workProfile}</p>}
          </div>

          {/* Submit Button */}
          <PositionAwareButton
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 text-lg font-bold"
          >
            {loading ? 'Submitting...' : 'Request Callback'}
          </PositionAwareButton>

          <p className="text-gray-500 text-sm text-center mt-4">* Required fields</p>
        </form>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2 text-primary font-bold">24h</div>
            <h3 className="font-semibold text-gray-900">Quick Response</h3>
            <p className="text-gray-600 text-sm">Our team responds within 24 hours</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2 text-primary font-bold">Free</div>
            <h3 className="font-semibold text-gray-900">Free Consultation</h3>
            <p className="text-gray-600 text-sm">No charges for your initial consultation</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2 text-primary font-bold">Secure</div>
            <h3 className="font-semibold text-gray-900">Private & Secure</h3>
            <p className="text-gray-600 text-sm">Your information is completely secure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCall;
