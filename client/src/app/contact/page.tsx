'use client';
import React, { useState } from 'react';
import { HiMail, HiPhone } from 'react-icons/hi';
import { IoMdTime } from 'react-icons/io';
import Card from '@/components/ui/Card';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import { FaMapMarkerAlt, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { BsGlobe } from 'react-icons/bs';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  [key: string]: string | undefined;
}

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage('Thank you for your message! We will get back to you within 24-48 hours.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        setErrors({});
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#03045e] mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions or want to join our mission? Reach out to Benzard Sports Management we’d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-[#03045e] mb-6">Get in Touch</h2>
            <div className="space-y-6">
              {[
                { 
                  title: 'Address', 
                  content: 'Paynesville City, Montserrado County, Liberia',
                  icon: <FaMapMarkerAlt className="text-2xl text-[#E32845] mt-1 flex-shrink-0" />
                },
                { 
                  title: 'Email', 
                  content: 'info@benzardsportsmanagement.com',
                  icon: <HiMail className="text-2xl text-[#E32845] mt-1 flex-shrink-0" />
                },
                { 
                  title: 'Phone', 
                  content: '+231 777 123 456',
                  icon: <HiPhone className="text-2xl text-[#E32845] mt-1 flex-shrink-0" />
                }
              ].map((contact, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0">
                    {contact.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-[#03045e]">{contact.title}</h3>
                    <p className="text-gray-600 whitespace-pre-line mt-1">{contact.content}</p>
                  </div>
                </div>
              ))}
              
              <div className="flex items-start mt-2">
                <div className="flex-shrink-0">
                  <BsGlobe className="text-2xl text-[#E32845] mt-1" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-[#03045e]">Connect With Us</h3>
                  <div className="flex space-x-4 mt-2">
                    <a href="https://www.facebook.com/benzardsports" className="text-[#03045e] hover:text-[#E32845] transition-colors duration-200">
                      <FaFacebook className="text-2xl" />
                    </a>
                    <a href="https://twitter.com/BSM_Liberia" className="text-[#03045e] hover:text-[#E32845] transition-colors duration-200">
                      <FaTwitter className="text-2xl" />
                    </a>
                    <a href="https://www.instagram.com/registabenzardinho/" className="text-[#03045e] hover:text-[#E32845] transition-colors duration-200">
                      <FaInstagram className="text-2xl" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 bg-[#03045e] text-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <IoMdTime className="text-2xl text-[#E32845] mr-2" />
                <h3 className="text-xl font-semibold">Office Hours</h3>
              </div>
              <div className="space-y-2 text-gray-200">
                <p className="flex items-center">
                  <span className="inline-block w-32">Monday - Friday:</span>
                  <span>8:00 AM - 4:00 PM</span>
                </p>
                <p className="flex items-center">
                  <span className="inline-block w-32">Saturday:</span>
                  <span>10:00 AM - 2:00 PM</span>
                </p>
                <p className="flex items-center">
                  <span className="inline-block w-32">Sunday:</span>
                  <span>Closed</span>
                </p>
              </div>
            </div>
          </div>

          <Card>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[#03045e] mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                  label="Full Name"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                />
                
                <FormInput
                  label="Email Address"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />
                
                <div className="mb-4">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${
                      errors.subject ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none`}
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="scouting">Athlete Scouting Inquiry</option>
                    <option value="training">Training Program Information</option>
                    <option value="partnership">Partnership Proposal</option>
                    <option value="event">Event Registration</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${
                      errors.message ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none`}
                    placeholder="How can we help you?"
                    required
                  ></textarea>
                  {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
                </div>
                
                {/* Status Message */}
                {submitStatus !== 'idle' && (
                  <div className={`p-4 rounded-md ${
                    submitStatus === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm ${
                      submitStatus === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {submitMessage}
                    </p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  fullWidth 
                  size="lg"
                  disabled={isSubmitting}
                  className={`relative bg-[#000054] text-white hover:bg-[#E32845] ${isSubmitting ? 'cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg 
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#03045e]" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        ></circle>
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;