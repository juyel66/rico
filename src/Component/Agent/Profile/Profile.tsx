// Profile.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Edit2, X, CheckCircle, Lock, Mail, Phone, User } from 'lucide-react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { changePassword } from '@/features/Auth/authSlice';

/**
 * Profile.jsx
 *
 * - Fetches current user from /auth/user/ and fills header (name, email, role, joined date)
 * - Edit Personal Info modal updates via PATCH /auth/user/
 * - Security tab calls changePassword thunk (reads values from refs — no onChange)
 *
 * Note: ensure auth access token stored at localStorage.auth_access
 */

const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://api.eastmondvillas.com/api';

const initialProfileData = {
  initials: 'JS',
  name: 'John Smith',
  email: 'john.smith@realestate.com',
  role: 'agent',
  date_joined: '2025-02-01T00:00:00Z',
  status: 'Active Agent',
  memberSince: 'Feb 2025',
  stats: {
    totalProperties: 3,
    totalDownloads: 24,
  },
  metrics: [
    {
      title: 'Assigned Properties',
      count: 3,
      img: 'https://res.cloudinary.com/dqkczdjjs/image/upload/v1760912317/Container_4_mdn7xb.png',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      title: 'Active Listings',
      count: 3,
      img: 'https://res.cloudinary.com/dqkczdjjs/image/upload/v1760913301/Container_5_vn6hql.png',
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      title: 'Downloads This Month',
      count: 24,
      img: 'https://res.cloudinary.com/dqkczdjjs/image/upload/v1760913571/Container_7_dur80i.png',
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      title: 'Scheduled Viewings',
      count: 8,
      img: 'https://res.cloudinary.com/dqkczdjjs/image/upload/v1760913561/Container_8_tgnlcm.png',
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
  ],
  personalInfo: {
    fullName: 'John Smith',
    emailAddress: 'john.smith@realestate.com',
    phoneNumber: '+1 (555) 123-4567',
    accountStatus: 'Active',
    professionalBio:
      'As a seasoned real estate professional with over 10 years of experience, John specializes in luxury waterfront villas in the Miami area.',
  },
};

const safe = (v, fallback = '') =>
  v === null || v === undefined ? fallback : v;

const MetricCard = ({ metric }) => (
  <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between border border-gray-100 transition hover:shadow-lg">
    <div>
      <p className="text-3xl font-semibold text-gray-900 mb-1">
        {metric.count}
      </p>
      <p className="text-sm text-gray-500">{metric.title}</p>
    </div>
    <div
      className={`p-2 rounded-xl ${metric.bg} flex items-center justify-center`}
    >
      <img
        src={metric.img}
        alt={metric.title}
        className="w-12 h-12 object-contain"
      />
    </div>
  </div>
);

const InfoField = ({ label, value, status, isBio = false, icon: Icon }) => {
  const statusClasses =
    status === 'Active'
      ? 'bg-green-100 text-green-700'
      : status === 'Active Agent'
        ? 'bg-teal-100 text-teal-700 font-medium'
        : 'bg-gray-100 text-gray-700';
  const placeholderText = isBio
    ? 'Tell us about your real estate experience and specialties...'
    : 'N/A';
  const displayValue = value || placeholderText;
  const isPlaceholder = !value && !status;

  return (
    <div className="flex flex-col mb-4">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <div
        className={`p-3 rounded-lg border border-gray-200 flex items-center ${isBio ? 'h-24' : ''}`}
      >
        {Icon && !isBio && <Icon className="w-5 h-5 text-gray-400 mr-2" />}
        {status ? (
          <span className={`text-xs px-2 py-1 rounded-full ${statusClasses}`}>
            {status}
          </span>
        ) : (
          <span
            className={`text-base ${isPlaceholder ? 'text-gray-400 italic' : 'text-gray-900'}`}
          >
            {displayValue}
          </span>
        )}
      </div>
      {isBio && (
        <p className="text-xs text-gray-500 mt-1">
          This bio will be visible to clients and team members
        </p>
      )}
    </div>
  );
};

const EditProfileModal = ({ isOpen, onClose, currentInfo = {}, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: currentInfo.fullName || '',
    emailAddress: currentInfo.emailAddress || '',
    phoneNumber: currentInfo.phoneNumber || '',
    accountStatus: currentInfo.accountStatus || 'Active',
    professionalBio: currentInfo.professionalBio || '',
  });

  // keep form in sync when currentInfo changes
  React.useEffect(() => {
    setFormData({
      fullName: currentInfo.fullName || '',
      emailAddress: currentInfo.emailAddress || '',
      phoneNumber: currentInfo.phoneNumber || '',
      accountStatus: currentInfo.accountStatus || 'Active',
      professionalBio: currentInfo.professionalBio || '',
    });
  }, [currentInfo]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = () => {
    // basic validation
    if (!formData.fullName || !formData.emailAddress) {
      Swal.fire({
        icon: 'error',
        title: 'Validation',
        text: 'Name and email are required.',
      });
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Edit Personal Information
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div className="relative">
              <label className="text-sm read-only: font-medium  text-gray-700 mb-1 block">
                Email Address
              </label>
              <div className="relative">
                <input
                  disabled
                  type="email"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div className="relative">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Account Status
              </label>
              <div className="relative w-full">
                {/* This div acts as the bordered container, similar to an input field */}
                <div
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50
                 flex items-center"
                  style={{
                    borderColor:
                      formData.accountStatus === 'Active'
                        ? '#34D399'
                        : '#EF4444',
                  }} // Green for Active, Red for Inactive
                >
                  {formData.accountStatus === 'Active' ? (
                    <span className="text-green-500">Active</span>
                  ) : (
                    <span className="text-red-500">Inactive</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * SecurityTab:
 * - Inputs are uncontrolled (no onChange)
 * - Values are read from refs when Update Password clicked
 * - Calls changePassword thunk and handles success/errors (shows errors with Swal)
 * - Shows "Updating..." on button while request is in progress
 */
const SecurityTab = ({ onPasswordChange }) => {
  const dispatch = useDispatch();
  const currentRef = useRef(null);
  const newRef = useRef(null);
  const confirmRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async () => {
    const payload = {
      old_password: currentRef.current?.value || '',
      new_password1: newRef.current?.value || '',
      new_password2: confirmRef.current?.value || '',
    };

    console.log('SecurityTab - sending payload:', payload);
    setIsUpdating(true);

    try {
      const res = await dispatch(changePassword(payload)).unwrap();
      console.log('changePassword success', res);

      // show success via Swal
      Swal.fire({
        icon: 'success',
        title: 'Password changed',
        text: (res && (res.detail || res.message)) || 'Password changed successfully.'
      });

      // Clear inputs
      if (currentRef.current) currentRef.current.value = '';
      if (newRef.current) newRef.current.value = '';
      if (confirmRef.current) confirmRef.current.value = '';
    } catch (err) {
      console.error('changePassword error', err);

      // build message string from possible DRF-style error shapes
      let html = '';
      if (err?.data) {
        const d = err.data;
        const msgs = []
          .concat(d.old_password || [])
          .concat(d.new_password1 || [])
          .concat(d.new_password2 || []);
        if (msgs.length) html = msgs.join('<br/>');
        else if (d.detail) html = String(d.detail);
        else html = JSON.stringify(d);
      } else if (err?.new_password1 || err?.new_password2 || err?.detail) {
        const msgs = []
          .concat(err.new_password1 || [])
          .concat(err.new_password2 || []);
        if (msgs.length) html = msgs.join('<br/>');
        else if (err.detail) html = String(err.detail);
        else html = 'Password change failed.';
      } else if (typeof err === 'string') {
        html = err;
      } else {
        html = 'Password change failed.';
      }

      // show SweetAlert with html (line breaks preserved)
      Swal.fire({
        icon: 'error',
        title: 'Password change failed',
        html,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const PasswordInput = ({ label, name, inputRef, placeholder }) => (
    <div className="mb-4">
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <div className="relative">
        <input
          // uncontrolled input: no onChange
          ref={inputRef}
          name={name}
          type="password"
          placeholder={placeholder}
          className="w-full py-3 pl-12 pr-4 text-base border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 transition duration-150"
        />
        <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Change Password
      </h3>
      <PasswordInput
        label="Current Password"
        name="currentPassword"
        inputRef={currentRef}
        placeholder="Enter current password"
      />
      <PasswordInput
        label="New Password"
        name="newPassword"
        inputRef={newRef}
        placeholder="Enter new password"
      />
      <PasswordInput
        label="Confirm New Password"
        name="confirmNewPassword"
        inputRef={confirmRef}
        placeholder="Confirm new password"
      />
      <button
        onClick={handleUpdatePassword}
        disabled={isUpdating}
        className={`mt-6 w-full md:w-auto px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition duration-150 shadow-md shadow-gray-400/50 ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {isUpdating ? 'Updating...' : 'Update Password'}
      </button>
    </div>
  );
};

const Profile = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('Personal Information');
  const [profileData, setProfileData] = useState(initialProfileData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // fetch current user
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('auth_access');
    if (!token) {
      setLoadingUser(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/user/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to load current user');
        }
        const u = await res.json();
        if (!mounted) return;
        // map to profileData shape
        setProfileData((prev) => ({
          ...prev,
          initials:
            (u.name || '')
              .split(' ')
              .map((n) => n[0] || '')
              .join('')
              .slice(0, 3)
              .toUpperCase() || prev.initials,
          name: u.name || prev.name,
          email: u.email || prev.email,
          role: u.role || prev.role,
          date_joined: u.date_joined || prev.date_joined,
          memberSince: u.date_joined
            ? new Date(u.date_joined).toLocaleString('en-GB', {
                month: 'short',
                year: 'numeric',
              })
            : prev.memberSince,
          personalInfo: {
            fullName: u.name || prev.personalInfo.fullName,
            emailAddress: u.email || prev.personalInfo.emailAddress,
            phoneNumber: u.phone || prev.personalInfo.phoneNumber,
            accountStatus: u.is_active ? 'Active' : 'Inactive',
            professionalBio: prev.personalInfo.professionalBio,
          },
        }));
      } catch (err) {
        // fallback to static
        console.warn('Could not fetch current user:', err);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const tabs = ['Personal Information', 'Security'];

  // Save profile to server (PATCH /auth/user/)
  const handleSaveProfile = async (updatedInfo) => {
    const token = localStorage.getItem('auth_access');
    // update UI optimistically
    setProfileData((p) => ({
      ...p,
      personalInfo: { ...p.personalInfo, ...updatedInfo },
      name: updatedInfo.fullName,
      email: updatedInfo.emailAddress,
      initials: (updatedInfo.fullName || p.personalInfo.fullName)
        .split(' ')
        .map((n) => n[0] || '')
        .join('')
        .slice(0, 3)
        .toUpperCase(),
    }));

    // try persist to backend
    if (!token) {
      toast.success('Profile updated locally (not authenticated).');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/user/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updatedInfo.fullName,
          email: updatedInfo.emailAddress,
          phone: updatedInfo.phoneNumber,
          is_active: updatedInfo.accountStatus === 'Active',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        // show warning but keep UI updated
        toast.success('Profile updated locally.');
        Swal.fire({
          icon: 'warning',
          title: 'Saved locally',
          text: data?.detail || 'Server did not accept update.',
        });
        return;
      }
      await res.json().catch(() => null);
      toast.success('Profile updated successfully.');
    } catch (err) {
      console.error('Profile update failed:', err);
      toast.error('Profile updated locally. Server request failed.');
    }
  };

  // Change password (kept for completeness, not used by SecurityTab)
  const handlePasswordChange = async ({ currentPassword, newPassword }) => {
    try {
      await dispatch(
        changePassword({
          old_password: currentPassword,
          new_password1: newPassword,
          new_password2: newPassword,
        })
      ).unwrap();

      toast.success('Password changed successfully.');
      return Promise.resolve();
    } catch (err) {
      if (err && typeof err === 'object') {
        if (err.new_password1 || err.new_password2) {
          const msgs = []
            .concat(err.new_password1 || [])
            .concat(err.new_password2 || [])
            .join(' ');
          toast.error(msgs || 'Password change failed.');
          return Promise.reject(msgs || err);
        }
        if (err.detail) {
          toast.error(String(err.detail));
          return Promise.reject(err.detail);
        }
        toast.error(JSON.stringify(err));
        return Promise.reject(err);
      } else {
        toast.error(String(err || 'Password change failed.'));
        return Promise.reject(err);
      }
    }
  };

  // formatted joined date
  const formattedJoined = (() => {
    try {
      if (!profileData.date_joined) return profileData.memberSince;
      const d = new Date(profileData.date_joined);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return profileData.memberSince;
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 md:p-8">
      <div className="mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile</h1>
          <p className="text-gray-600 text-sm">
            Manage your account settings and preferences
          </p>
        </header>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 text-gray-700 font-bold text-xl rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                {profileData.initials}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {profileData.name}
                </h2>
                <p className="text-sm text-gray-600 mb-1">
                  {profileData.email}
                </p>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-teal-600 font-medium">
                    {profileData.role}
                  </span>
                  <span className="text-gray-500">|</span>
                  <span className="text-gray-500">
                    Joined {formattedJoined}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex space-x-6 text-right">
              <div className="border-r pr-6">
                <p className="text-2xl font-bold text-gray-900">
                  {profileData.stats.totalProperties}
                </p>
                <p className="text-sm text-gray-500">Properties</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {profileData.stats.totalDownloads}
                </p>
                <p className="text-sm text-gray-500">Downloads</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {profileData.metrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="inline-flex space-x-4 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition duration-150 ${activeTab === tab ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'Personal Information' && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>
                <p className="text-sm text-gray-500">
                  Update your personal details and contact information
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                <InfoField
                  label="Full Name"
                  value={profileData.personalInfo.fullName}
                  icon={User}
                />
                <InfoField
                  label="Email Address"
                  value={profileData.personalInfo.emailAddress}
                  icon={Mail}
                />
                <InfoField
                  label="Phone Number"
                  value={profileData.personalInfo.phoneNumber}
                  icon={Phone}
                />
                <InfoField
                  label="Account Status"
                  status={profileData.personalInfo.accountStatus}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Security' && (
          <SecurityTab
            onPasswordChange={async ({ currentPassword, newPassword }) =>
              handlePasswordChange({ currentPassword, newPassword })
            }
          />
        )}

        <EditProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentInfo={profileData.personalInfo}
          onSave={handleSaveProfile}
        />
      </div>
    </div>
  );
};

export default Profile;
