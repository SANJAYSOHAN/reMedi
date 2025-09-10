
import React, { useState, useRef } from 'react';
import type { User } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { EditIcon } from './icons/EditIcon';
import { CloseIcon } from './icons/CloseIcon';
import TimeSelectionModal from './TimeSelectionModal';
import { formatTime12Hour } from '../utils/helpers';
import { ClockIcon } from './icons/ClockIcon';


interface ProfilePageProps {
  user: User;
  onSave: () => void;
}

const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onSave }) => {
  const { updateUserInSession } = useAuth();
  const [mealTimings, setMealTimings] = useState(user.mealTimings);
  const [profilePicture, setProfilePicture] = useState(user.profilePicture);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingId, setIsEditingId] = useState(false);
  const [newUserId, setNewUserId] = useState(user.id);
  
  const [isChangingMpin, setIsChangingMpin] = useState(false);
  const [currentMpin, setCurrentMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    age: user.age ? String(user.age) : '',
    gender: user.gender || 'other',
    phone: user.phone || '',
  });
  
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [editingTimeFor, setEditingTimeFor] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);

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

  const handleTimeChange = (meal: 'breakfast' | 'lunch' | 'dinner', time: string) => {
    setMealTimings(prev => ({ ...prev, [meal]: time }));
  };
  
  const handleIdEditToggle = () => {
    if (isEditingId) {
      setNewUserId(user.id);
    }
    setIsEditingId(!isEditingId);
    setMessage(null);
  };

  const handleDetailsEditToggle = () => {
    if (isEditingDetails) {
        setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            age: user.age ? String(user.age) : '',
            gender: user.gender || 'other',
            phone: user.phone || '',
        });
    }
    setIsEditingDetails(!isEditingDetails);
    setMessage(null);
  };

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
        const phoneValue = value.replace(/\D/g, '');
        if (phoneValue.length <= 10) {
            setFormData(prev => ({ ...prev, [name]: phoneValue }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
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
  
  const handleOpenTimePicker = (meal: 'breakfast' | 'lunch' | 'dinner') => {
    setEditingTimeFor(meal);
    setIsTimePickerOpen(true);
  };

  const handleSaveTime = (time: string) => {
    if (editingTimeFor) {
      handleTimeChange(editingTimeFor, time);
    }
    setIsTimePickerOpen(false);
    setEditingTimeFor(null);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isEditingId && !newUserId) {
      setMessage({ text: 'User ID cannot be empty.', type: 'error' });
      setLoading(false);
      return;
    }
    
    if (isEditingDetails) {
        if (!formData.firstName || !formData.lastName) {
            setMessage({ text: 'First and last name cannot be empty.', type: 'error' });
            setLoading(false);
            return;
        }
        if (formData.phone && formData.phone.length !== 10) {
            setMessage({ text: 'Phone number must be 10 digits.', type: 'error' });
            setLoading(false);
            return;
        }
        if (formData.age && parseInt(formData.age, 10) <= 0) {
            setMessage({ text: 'Please enter a valid age.', type: 'error' });
            setLoading(false);
            return;
        }
    }

    const updatedUser: User = { 
        ...user, 
        id: newUserId, 
        mealTimings,
        profilePicture,
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        gender: formData.gender as 'male' | 'female' | 'other',
        phone: formData.phone,
    };
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
      if (newMpin.length !== 4 || !/^\d{4}$/.test(newMpin)) {
        setMessage({ text: 'New MPIN must be 4 digits.', type: 'error' });
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
        setMessage({ text: 'That User ID is already taken. Please choose another one.', type: 'error' });
        setLoading(false);
        setNewUserId(user.id);
        return;
      }

      updateUserInSession(resultUser);
      setMessage({ text: 'Settings updated successfully!', type: 'success' });
      setIsEditingId(false);
      setIsEditingDetails(false);

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

  const hasChanges = isEditingId || isEditingDetails || isChangingMpin || JSON.stringify(user.mealTimings) !== JSON.stringify(mealTimings) || user.profilePicture !== profilePicture;
  const mpinInputStyles = "w-40 text-sm p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 tracking-widest";
  const timeButtonStyles = "flex items-center justify-between w-40 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50 transition-colors text-gray-800";
  const inputStyles = "block w-full px-4 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";


  return (
    <>
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
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900">Account</h3>
                        {user.id !== 'admin' && (
                            <button type="button" onClick={handleIdEditToggle} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center text-sm font-medium">
                                {isEditingId ? <CloseIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
                                <span className="ml-1">{isEditingId ? 'Cancel' : 'Edit'}</span>
                            </button>
                        )}
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-500">User ID</label>
                        {isEditingId ? (
                            <input type="text" value={newUserId} onChange={e => setNewUserId(e.target.value)} className={`mt-1 text-lg font-semibold w-full ${inputStyles}`} autoFocus />
                        ) : (
                            <p className="mt-1 text-lg font-semibold text-gray-700 font-mono bg-gray-50 p-3 rounded-md">{user.id}</p>
                        )}
                    </div>
                </div>

                {/* Personal Details Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Personal Details</h3>
                        <button type="button" onClick={handleDetailsEditToggle} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center text-sm font-medium">
                            {isEditingDetails ? <CloseIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
                            <span className="ml-1">{isEditingDetails ? 'Cancel' : 'Edit'}</span>
                        </button>
                    </div>
                    {isEditingDetails ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label><input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleDetailChange} required className={inputStyles} /></div>
                                <div><label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleDetailChange} required className={inputStyles} /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age</label><input id="age" name="age" type="number" value={formData.age} onChange={handleDetailChange} required className={inputStyles} min="1" /></div>
                                <div><label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select id="gender" name="gender" value={formData.gender} onChange={handleDetailChange} required className={inputStyles}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                            </div>
                            <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">10-Digit Phone</label><input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleDetailChange} required className={inputStyles} maxLength={10} /></div>
                        </div>
                    ) : (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-3"><span className="font-medium text-gray-500">Full Name</span><span className="text-gray-900 col-span-2">{user.firstName} {user.lastName}</span></div>
                            <div className="grid grid-cols-3"><span className="font-medium text-gray-500">Age</span><span className="text-gray-900 col-span-2">{user.age ? `${user.age} years` : 'Not specified'}</span></div>
                            <div className="grid grid-cols-3"><span className="font-medium text-gray-500">Gender</span><span className="text-gray-900 col-span-2 capitalize">{user.gender || 'Not specified'}</span></div>
                            <div className="grid grid-cols-3"><span className="font-medium text-gray-500">Phone</span><span className="text-gray-900 col-span-2">{user.phone || 'Not specified'}</span></div>
                        </div>
                    )}
                </div>

                 {/* Meal Timings Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">Your Meal Timings</h3>
                    <div className="flex justify-between items-center"><label className="font-medium text-gray-700">Breakfast Time</label><button type="button" onClick={() => handleOpenTimePicker('breakfast')} className={timeButtonStyles}><span>{formatTime12Hour(mealTimings.breakfast)}</span><ClockIcon className="w-5 h-5 text-gray-400" /></button></div>
                    <div className="flex justify-between items-center"><label className="font-medium text-gray-700">Lunch Time</label><button type="button" onClick={() => handleOpenTimePicker('lunch')} className={timeButtonStyles}><span>{formatTime12Hour(mealTimings.lunch)}</span><ClockIcon className="w-5 h-5 text-gray-400" /></button></div>
                    <div className="flex justify-between items-center"><label className="font-medium text-gray-700">Dinner Time</label><button type="button" onClick={() => handleOpenTimePicker('dinner')} className={timeButtonStyles}><span>{formatTime12Hour(mealTimings.dinner)}</span><ClockIcon className="w-5 h-5 text-gray-400" /></button></div>
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
                            <div className="flex justify-between items-center"><label htmlFor="currentMpin" className="font-medium text-gray-700">Current MPIN</label><input id="currentMpin" type="password" value={currentMpin} onChange={e => setCurrentMpin(e.target.value)} maxLength={4} pattern="\d{4}" className={mpinInputStyles} autoComplete="off"/></div>
                            <div className="flex justify-between items-center"><label htmlFor="newMpin" className="font-medium text-gray-700">New MPIN</label><input id="newMpin" type="password" value={newMpin} onChange={e => setNewMpin(e.target.value)} maxLength={4} pattern="\d{4}" className={mpinInputStyles} autoComplete="new-password"/></div>
                            <div className="flex justify-between items-center"><label htmlFor="confirmMpin" className="font-medium text-gray-700">Confirm New MPIN</label><input id="confirmMpin" type="password" value={confirmMpin} onChange={e => setConfirmMpin(e.target.value)} maxLength={4} pattern="\d{4}" className={mpinInputStyles} autoComplete="new-password"/></div>
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
      {isTimePickerOpen && editingTimeFor && (
        <TimeSelectionModal
            isOpen={isTimePickerOpen}
            onClose={() => setIsTimePickerOpen(false)}
            onSave={handleSaveTime}
            initialTime={
                editingTimeFor === 'breakfast' ? mealTimings.breakfast :
                editingTimeFor === 'lunch' ? mealTimings.lunch : mealTimings.dinner
            }
            title={`Set ${editingTimeFor.charAt(0).toUpperCase() + editingTimeFor.slice(1)} Time`}
        />
      )}
    </>
  );
};

export default ProfilePage;
