
import React, { useState, useRef } from 'react';
import type { User } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { EditIcon } from './icons/EditIcon';
import { CloseIcon } from './icons/CloseIcon';

interface AdminProfilePageProps {
  user: User;
  onSave: () => void;
}

const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

const AdminProfilePage: React.FC<AdminProfilePageProps> = ({ user, onSave }) => {
  const { updateUserInSession } = useAuth();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');

  const [isEditingHospital, setIsEditingHospital] = useState(false);
  const [hospitalName, setHospitalName] = useState(user.hospitalName || '');
  
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [phone, setPhone] = useState(user.phone || '');

  const [profilePicture, setProfilePicture] = useState(user.profilePicture);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isChangingMpin, setIsChangingMpin] = useState(false);
  const [currentMpin, setCurrentMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setMessage({ text: 'Image size should be less than 2MB.', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
        setMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = () => {
    setProfilePicture(undefined);
  };

  const handleToggleChangeMpin = () => {
    if (isChangingMpin) {
      setCurrentMpin('');
      setNewMpin('');
      setConfirmMpin('');
    }
    setIsChangingMpin(!isChangingMpin);
    setMessage(null);
  };
  
  const handleNameEditToggle = () => {
    if (isEditingName) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
    setIsEditingName(!isEditingName);
    setMessage(null);
  }

  const handleHospitalEditToggle = () => {
    if (isEditingHospital) {
      setHospitalName(user.hospitalName || '');
    }
    setIsEditingHospital(!isEditingHospital);
    setMessage(null);
  };

  const handleContactEditToggle = () => {
    if (isEditingContact) {
      setPhone(user.phone || '');
    }
    setIsEditingContact(!isEditingContact);
    setMessage(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 10) {
      setPhone(value);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isEditingContact && phone.length !== 10) {
      setMessage({ text: 'Phone number must be 10 digits.', type: 'error' });
      setLoading(false);
      return;
    }

    const updatedUser: User = { ...user, firstName, lastName, hospitalName, profilePicture, phone };
    let mpinChanged = false;

    if (isChangingMpin) {
      if (!currentMpin || !newMpin || !confirmMpin) {
        setMessage({ text: 'Please fill all MPIN fields to change it.', type: 'error' });
        setLoading(false);
        return;
      }
      if (currentMpin !== user.mpin) {
        setMessage({ text: 'Current MPIN is incorrect.', type: 'error' });
        setLoading(false);
        return;
      }
      if (newMpin.length < 4 || !/^\d+$/.test(newMpin)) {
        setMessage({ text: 'New MPIN must be at least 4 digits and contain only numbers.', type: 'error' });
        setLoading(false);
        return;
      }
      if (newMpin !== confirmMpin) {
        setMessage({ text: 'New MPINs do not match.', type: 'error' });
        setLoading(false);
        return;
      }

      updatedUser.mpin = newMpin;
      mpinChanged = true;
    }

    try {
      const resultUser = await apiService.updateUser(user.id, updatedUser);
      
      if (!resultUser) {
        setMessage({ text: 'An unexpected error occurred.', type: 'error' });
        setLoading(false);
        return;
      }

      updateUserInSession(resultUser);
      setMessage({ text: 'Settings updated successfully!', type: 'success' });
      setIsEditingName(false);
      setIsEditingHospital(false);
      setIsEditingContact(false);

      if (mpinChanged) {
        setCurrentMpin('');
        setNewMpin('');
        setConfirmMpin('');
        setIsChangingMpin(false);
      }

    } catch (error) {
      setMessage({ text: 'Failed to update settings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = isEditingName || isEditingHospital || isChangingMpin || user.profilePicture !== profilePicture || isEditingContact;
  const inputStyles = "block w-full px-4 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const mpinInputStyles = "w-40 text-sm p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 tracking-widest";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
       <form onSubmit={handleSubmit}>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6 flex flex-col items-center space-y-4">
                <div className="relative">
                    {profilePicture ? (
                        <img src={profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-100" />
                    ) : (
                        <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold ring-4 ring-blue-100">
                            {getInitials(user.firstName, user.lastName)}
                        </div>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                        Upload Picture
                    </button>
                    {profilePicture && (
                        <button type="button" onClick={handleRemovePicture} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors">
                            Remove
                        </button>
                    )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePictureChange} className="hidden" accept="image/png, image/jpeg" />
            </div>
            <div className="space-y-6">
                 {/* Account Info Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">Account</h3>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-500">User ID</label>
                        <p className="mt-1 text-lg font-semibold text-gray-700 font-mono bg-gray-50 p-3 rounded-md">{user.id}</p>
                    </div>
                     <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-medium text-gray-500">Doctor / Admin Name</label>
                          <button type="button" onClick={handleNameEditToggle} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center text-sm font-medium">
                              {isEditingName ? <CloseIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
                               <span className="ml-1">{isEditingName ? 'Cancel' : 'Edit'}</span>
                          </button>
                        </div>
                        {isEditingName ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input id="firstName" name="firstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className={inputStyles} placeholder="First Name" />
                            <input id="lastName" name="lastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className={inputStyles} placeholder="Last Name" />
                          </div>
                        ) : (
                          <p className="mt-1 text-lg font-semibold text-gray-700 bg-gray-50 p-3 rounded-md">{user.firstName} {user.lastName}</p>
                        )}
                    </div>
                </div>

                 {/* Hospital Info Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Hospital Information</h3>
                        <button type="button" onClick={handleHospitalEditToggle} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center text-sm font-medium">
                            {isEditingHospital ? <CloseIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
                             <span className="ml-1">{isEditingHospital ? 'Cancel' : 'Edit'}</span>
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 items-center">
                            <label htmlFor="hospitalName" className="text-sm font-medium text-gray-500 col-span-1">Hospital Name</label>
                            {isEditingHospital ? (
                            <input id="hospitalName" name="hospitalName" type="text" value={hospitalName} onChange={e => setHospitalName(e.target.value)} required className={`${inputStyles} col-span-2`} placeholder="Hospital/Clinic Name" />
                            ) : (
                            <p className="text-gray-900 col-span-2">{user.hospitalName || 'Not set'}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-3 items-center">
                            <label className="text-sm font-medium text-gray-500 col-span-1">Hospital Code</label>
                            <p className="text-gray-900 col-span-2 font-mono bg-gray-100 inline-block px-2 py-1 rounded">{user.hospitalCode || 'N/A'}</p>
                        </div>
                        <p className="text-xs text-gray-500 col-span-3 pt-1">This code is given to patients so they can register under your hospital. It cannot be changed.</p>
                    </div>
                </div>

                {/* Contact Info Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                        <button type="button" onClick={handleContactEditToggle} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center text-sm font-medium">
                            {isEditingContact ? <CloseIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
                            <span className="ml-1">{isEditingContact ? 'Cancel' : 'Edit'}</span>
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 items-center">
                            <label htmlFor="phone" className="text-sm font-medium text-gray-500 col-span-1">Phone Number</label>
                            {isEditingContact ? (
                                <input id="phone" name="phone" type="tel" value={phone} onChange={handlePhoneChange} required className={`${inputStyles} col-span-2`} placeholder="10-Digit Phone Number" maxLength={10} />
                            ) : (
                                <p className="text-gray-900 col-span-2">{user.phone || 'Not set'}</p>
                            )}
                        </div>
                    </div>
                </div>

                 {/* Security Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <button type="button" onClick={handleToggleChangeMpin} className="w-full flex justify-between items-center text-left focus:outline-none" aria-expanded={isChangingMpin} aria-controls="change-mpin-section">
                        <h3 className="text-xl font-bold text-gray-900">Security</h3>
                        <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform ${isChangingMpin ? 'rotate-180' : ''}`} />
                    </button>
                    {isChangingMpin && (
                        <div id="change-mpin-section" className="mt-4 space-y-4 pt-4 border-t">
                            <p className="text-sm text-gray-500">To change your MPIN, please fill out all the fields below.</p>
                            <div className="flex justify-between items-center"><label htmlFor="currentMpin" className="font-medium text-gray-700">Current MPIN</label><input id="currentMpin" type="password" value={currentMpin} onChange={e => setCurrentMpin(e.target.value)} className={mpinInputStyles} autoComplete="off"/></div>
                            <div className="flex justify-between items-center"><label htmlFor="newMpin" className="font-medium text-gray-700">New MPIN</label><input id="newMpin" type="password" value={newMpin} onChange={e => setNewMpin(e.target.value)} className={mpinInputStyles} autoComplete="new-password"/></div>
                            <div className="flex justify-between items-center"><label htmlFor="confirmMpin" className="font-medium text-gray-700">Confirm New MPIN</label><input id="confirmMpin" type="password" value={confirmMpin} onChange={e => setConfirmMpin(e.target.value)} className={mpinInputStyles} autoComplete="new-password"/></div>
                        </div>
                    )}
                </div>
            
                {message && <p className={`text-sm text-center font-semibold ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}

                {hasChanges && (
                    <div className="pt-2 sticky bottom-4">
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                            {loading ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>
                )}
            </div>
        </form>
    </div>
  );
};

export default AdminProfilePage;
