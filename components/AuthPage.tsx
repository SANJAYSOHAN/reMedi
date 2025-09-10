


import React, { useState } from 'react';
import type { User } from '../types';
import { apiService } from '../services/api';
import { PillIcon } from './icons/PillIcon';
import TimeSelectionModal from './TimeSelectionModal';
import { formatTime12Hour } from '../utils/helpers';
import { UserIcon } from './icons/UserIcon';
import { AdminIcon } from './icons/AdminIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';


interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'select-role' | 'patient-signup' | 'admin-signup' | 'forgot-mpin'>('login');
  
  const [userId, setUserId] = useState('');
  const [mpin, setMpin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalCode, setHospitalCode] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [phone, setPhone] = useState('');
  const [breakfast, setBreakfast] = useState('08:00');
  const [lunch, setLunch] = useState('13:00');
  const [dinner, setDinner] = useState('19:00');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccessData, setRegistrationSuccessData] = useState<{ message: string; hospitalCode?: string } | null>(null);

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [editingTimeFor, setEditingTimeFor] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  
  const [hospitalCodeStatus, setHospitalCodeStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [verifiedHospitalInfo, setVerifiedHospitalInfo] = useState<{ hospitalName: string; adminName: string } | null>(null);

  // State for Forgot MPIN flow
  const [forgotMpinStep, setForgotMpinStep] = useState(1); // 1: enter id, 2: verify phone, 3: reset mpin
  const [userForReset, setUserForReset] = useState<User | null>(null);
  const [phoneVerification, setPhoneVerification] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmNewMpin, setConfirmNewMpin] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');


  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  const resetForgotMpinForm = () => {
    setForgotMpinStep(1);
    setUserForReset(null);
    setPhoneVerification('');
    setNewMpin('');
    setConfirmNewMpin('');
    setResetSuccessMessage('');
  }

  const resetFormFields = () => {
    setUserId('');
    setMpin('');
    setFirstName('');
    setLastName('');
    setAge('');
    setGender('');
    setPhone('');
    setHospitalCode('');
    setHospitalName('');
    setError('');
    setRegistrationSuccessData(null);
    setHospitalCodeStatus('idle');
    setVerifiedHospitalInfo(null);
    resetForgotMpinForm();
  }
  
  const handleVerifyHospitalCode = async () => {
    if (!hospitalCode) {
        setHospitalCodeStatus('idle');
        return;
    }
    setHospitalCodeStatus('verifying');
    setVerifiedHospitalInfo(null);
    try {
        const info = await apiService.getAdminByHospitalCode(hospitalCode);
        if (info) {
            setVerifiedHospitalInfo(info);
            setHospitalCodeStatus('valid');
        } else {
            setHospitalCodeStatus('invalid');
        }
    } catch (e) {
        setHospitalCodeStatus('invalid');
    }
  };
  
  const handleForgotMpinStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
        const user = await apiService.getUserById(userId);
        if (user && user.phone) {
            setUserForReset(user);
            setForgotMpinStep(2);
        } else if (user) {
            setError("This account does not have a registered phone number for verification. MPIN reset is not possible.");
        } else {
            setError("User ID not found. Please check the ID and try again.");
        }
    } catch (err) {
        setError("An error occurred while find the user.");
    } finally {
        setLoading(false);
    }
  };

  const handleForgotMpinStep2 = (e: React.FormEvent) => {
      e.preventDefault();
      if (!userForReset || !userForReset.phone || userForReset.phone.length !== 10) {
        setError("The registered phone number is not valid for this verification method.");
        return;
      }
      
      const verificationDigits = userForReset.phone.slice(5, 9);
      if (phoneVerification === verificationDigits) {
          setError('');
          setForgotMpinStep(3);
      } else {
          setError("The phone number digits do not match our records. Please try again.");
      }
  };

  const handleForgotMpinStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForReset) return;

    if (newMpin.length < 4 || !/^\d{4,}$/.test(newMpin)) {
        setError("New MPIN must be at least 4 digits.");
        return;
    }
    if (newMpin !== confirmNewMpin) {
        setError("The new MPINs do not match.");
        return;
    }

    setLoading(true);
    setError('');
    try {
        const updatedUser = await apiService.resetMpin(userForReset.id, newMpin);
        if (updatedUser) {
            setResetSuccessMessage("Your MPIN has been reset successfully. You can now log in.");
            setTimeout(() => {
                handleSetMode('login');
            }, 3000);
        } else {
            setError("Failed to reset MPIN. Please try again.");
        }
    } catch (err) {
        setError("An error occurred while resetting the MPIN.");
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setRegistrationSuccessData(null);

    if (mpin.length < 4 || (mode !== 'login' && !/^\d{4,}$/.test(mpin))) {
        setError(`MPIN must be at least 4 digits.`);
        setLoading(false);
        return;
    }
    
    // Patient Signup Validations
    if (mode === 'patient-signup') {
        if (!hospitalCode || hospitalCodeStatus !== 'valid') {
            setError('Please enter a valid Hospital Code.');
            setLoading(false);
            return;
        }
        if (!age || parseInt(age) <= 0) {
            setError('Please enter a valid age.');
            setLoading(false);
            return;
        }
        if (!gender) {
            setError('Please select your gender.');
            setLoading(false);
            return;
        }
        if (phone.length !== 10) {
            setError('Phone number must be 10 digits.');
            setLoading(false);
            return;
        }
    }

    // Admin Signup Validations
    if (mode === 'admin-signup') {
        if (!hospitalName) {
            setError('Hospital Name is required.');
            setLoading(false);
            return;
        }
        if (phone.length !== 10) {
            setError('Phone number must be 10 digits.');
            setLoading(false);
            return;
        }
    }


    try {
      if (mode === 'login') {
        const user = await apiService.login(userId, mpin);
        if (user) {
          onLogin(user);
        } else {
          setError('Invalid User ID or MPIN.');
        }
      } else { // Registration
        let newUser: User;
        if (mode === 'patient-signup') {
            newUser = { 
                id: userId, mpin, firstName, lastName, phone, 
                age: parseInt(age, 10), 
                gender: gender as 'male' | 'female' | 'other', 
                mealTimings: { breakfast, lunch, dinner },
                role: 'patient',
                hospitalCode
            };
        } else { // admin-signup
            newUser = {
                id: userId, mpin, firstName, lastName, phone,
                hospitalName,
                role: 'admin',
                mealTimings: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' } // Default timings for admin
            };
        }
        
        const result = await apiService.register(newUser);

        if (result.user) {
            resetFormFields();
            if (result.user.role === 'admin') {
                setRegistrationSuccessData({
                    message: 'Admin account created successfully! Please save your Hospital Code and log in.',
                    hospitalCode: result.user.hospitalCode
                });
                setMode('login');
            } else {
                 setRegistrationSuccessData({ message: 'Account created successfully! You can now log in.' });
                 setMode('login');
            }
        } else {
            setError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
        setLoading(false);
    }
  };

  const handleSetMode = (newMode: typeof mode) => {
    resetFormFields();
    setMode(newMode);
  }
  
  const handleOpenTimePicker = (meal: 'breakfast' | 'lunch' | 'dinner') => {
    setEditingTimeFor(meal);
    setIsTimePickerOpen(true);
  };

  const handleSaveTime = (time: string) => {
    if (editingTimeFor) {
        switch (editingTimeFor) {
            case 'breakfast': setBreakfast(time); break;
            case 'lunch': setLunch(time); break;
            case 'dinner': setDinner(time); break;
        }
    }
    setIsTimePickerOpen(false);
    setEditingTimeFor(null);
  };

  const inputStyles = "appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow";
  const buttonStyles = "group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors";
  
  const renderForgotMpinForm = () => {
    return (
        <>
            <div className="flex items-center mb-6">
                 <button onClick={() => handleSetMode('login')} className="p-2 rounded-full hover:bg-gray-100 mr-2" aria-label="Go back to login">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-3xl font-bold text-gray-900">Reset Your MPIN</h2>
            </div>
            {resetSuccessMessage ? (
                <div className="p-4 rounded-lg bg-green-50 text-green-800 text-center">
                    <p className="font-semibold">{resetSuccessMessage}</p>
                </div>
            ) : (
                <>
                    {forgotMpinStep === 1 && (
                        <form className="space-y-6" onSubmit={handleForgotMpinStep1}>
                            <p className="text-sm text-gray-600">Enter your User ID to begin the reset process.</p>
                            <input id="userId" name="userId" type="text" value={userId} onChange={e => setUserId(e.target.value)} required className={inputStyles} placeholder="User ID" />
                            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                            <button type="submit" disabled={loading} className={buttonStyles}>
                                {loading ? 'Searching...' : 'Continue'}
                            </button>
                        </form>
                    )}
                    {forgotMpinStep === 2 && userForReset && (
                        <form className="space-y-6" onSubmit={handleForgotMpinStep2}>
                            {userForReset.phone && userForReset.phone.length === 10 ? (
                                <>
                                    <p className="text-sm text-gray-600">For your security, please enter the next 4 digits of your registered phone number starting with <span className="font-semibold text-gray-800">{userForReset.phone.slice(0, 5)}</span>.</p>
                                    <input id="phone-verification" name="phone-verification" type="text" value={phoneVerification} onChange={e => setPhoneVerification(e.target.value.replace(/\D/g, ''))} required className={inputStyles} placeholder="Next 4 digits" maxLength={4} />
                                </>
                            ) : (
                                <p className="text-sm text-red-600">Cannot proceed. The registered phone number is invalid for verification.</p>
                            )}
                             {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                            <button type="submit" disabled={!userForReset.phone || userForReset.phone.length !== 10} className={buttonStyles}>
                                Verify
                            </button>
                        </form>
                    )}
                    {forgotMpinStep === 3 && (
                        <form className="space-y-6" onSubmit={handleForgotMpinStep3}>
                            <p className="text-sm text-gray-600">Verification successful. Please set your new MPIN.</p>
                            <input id="new-mpin" name="new-mpin" type="password" value={newMpin} onChange={e => setNewMpin(e.target.value)} required className={inputStyles} placeholder="New MPIN (min. 4 digits)" />
                            <input id="confirm-new-mpin" name="confirm-new-mpin" type="password" value={confirmNewMpin} onChange={e => setConfirmNewMpin(e.target.value)} required className={inputStyles} placeholder="Confirm New MPIN" />
                             {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                            <button type="submit" disabled={loading} className={buttonStyles}>
                                {loading ? 'Resetting...' : 'Set New MPIN'}
                            </button>
                        </form>
                    )}
                </>
            )}
        </>
    );
  };

  const renderContent = () => {
    if (mode === 'forgot-mpin') {
        return renderForgotMpinForm();
    }
    
    if (mode === 'select-role') {
        return (
             <div>
                <div className="flex items-center mb-6">
                    <button onClick={() => handleSetMode('login')} className="p-2 rounded-full hover:bg-gray-100 mr-2" aria-label="Go back to login">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900">Join reMedi</h2>
                </div>
                <div className="text-center">
                    <p className="mt-2 text-sm text-gray-600">First, tell us who you are.</p>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={() => handleSetMode('patient-signup')} className="w-full flex flex-col items-center justify-center text-center p-6 h-40 border-2 border-transparent rounded-xl bg-gray-50 hover:border-blue-400 hover:bg-white hover:shadow-lg transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <UserIcon className="w-12 h-12 text-blue-500 mb-3"/>
                            <div>
                                <p className="font-semibold text-gray-800 text-lg">I'm a Patient</p>
                                <p className="text-sm text-gray-500">I want to track my medications.</p>
                            </div>
                        </button>
                        <button onClick={() => handleSetMode('admin-signup')} className="w-full flex flex-col items-center justify-center text-center p-6 h-40 border-2 border-transparent rounded-xl bg-gray-50 hover:border-blue-400 hover:bg-white hover:shadow-lg transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <AdminIcon className="w-12 h-12 text-blue-500 mb-3"/>
                            <div>
                                <p className="font-semibold text-gray-800 text-lg">I'm an Admin</p>
                                <p className="text-sm text-gray-500">I want to manage patient prescriptions.</p>
                            </div>
                        </button>
                    </div>
                    <p className="mt-8 text-sm text-gray-600">
                        Already have an account?{' '}
                        <button onClick={() => handleSetMode('login')} className="font-medium text-blue-600 hover:text-blue-500">
                            Sign in
                        </button>
                    </p>
                </div>
             </div>
        )
    }

    const isLogin = mode === 'login';
    const isPatientSignup = mode === 'patient-signup';
    const isAdminSignup = mode === 'admin-signup';
    const isSignup = isPatientSignup || isAdminSignup;

    return (
        <>
            <div className={isLogin ? "text-center" : ""}>
                {isSignup ? (
                    <div className="flex items-center">
                        <button onClick={() => handleSetMode('select-role')} className="p-2 rounded-full hover:bg-gray-100 mr-2" aria-label="Go back to role selection">
                            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-3xl font-bold text-gray-900">
                            {isPatientSignup && 'Create Patient Account'}
                            {isAdminSignup && 'Create Admin Account'}
                        </h2>
                    </div>
                ) : ( // isLogin
                    <>
                        <PillIcon className="w-14 h-14 text-blue-600 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-gray-900">
                            Welcome Back!
                        </h2>
                    </>
                )}
                <p className="mt-2 text-sm text-gray-600">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => handleSetMode(isLogin ? 'select-role' : 'login')} className="font-medium text-blue-600 hover:text-blue-500">
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
             {registrationSuccessData && (
                <div className="mt-4 p-4 rounded-lg bg-green-50 text-green-800 text-center">
                    <p className="font-semibold">{registrationSuccessData.message}</p>
                    {registrationSuccessData.hospitalCode && (
                        <p className="mt-2">Your Hospital Code is: <strong className="font-mono bg-green-200 p-1 rounded">{registrationSuccessData.hospitalCode}</strong></p>
                    )}
                </div>
            )}
            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                {isSignup && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input id="firstName" name="firstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className={inputStyles} placeholder="First Name" />
                        <input id="lastName" name="lastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className={inputStyles} placeholder="Last Name" />
                    </div>
                )}
                <input id="userId" name="userId" type="text" value={userId} onChange={e => setUserId(e.target.value)} required className={inputStyles} placeholder="User ID" />
                <div>
                    <input id="mpin" name="mpin" type="password" value={mpin} onChange={e => setMpin(e.target.value)} required className={inputStyles} placeholder="MPIN (min. 4 digits)" />
                    {isLogin && (
                        <div className="text-right mt-2">
                            <button type="button" onClick={() => handleSetMode('forgot-mpin')} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                Forgot MPIN?
                            </button>
                        </div>
                    )}
                </div>
                
                {isPatientSignup && (
                    <>
                        <div>
                            <input id="hospitalCode" name="hospitalCode" type="text" value={hospitalCode} 
                                onChange={e => {
                                    setHospitalCode(e.target.value);
                                    setHospitalCodeStatus('idle'); // Reset on change
                                    setVerifiedHospitalInfo(null);
                                }}
                                onBlur={handleVerifyHospitalCode}
                                required className={inputStyles} placeholder="Hospital Code" 
                            />
                             {hospitalCodeStatus === 'verifying' && <p className="text-xs text-gray-500 mt-2 animate-pulse">Verifying code...</p>}
                             {hospitalCodeStatus === 'invalid' && <p className="text-xs text-red-600 mt-2 animate-fade-in-up">Invalid Hospital Code. Please check and try again.</p>}
                             {hospitalCodeStatus === 'valid' && verifiedHospitalInfo && (
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 animate-fade-in-up">
                                    <p><span className="font-semibold">Hospital:</span> {verifiedHospitalInfo.hospitalName}</p>
                                    <p><span className="font-semibold">Admin:</span> {verifiedHospitalInfo.adminName}</p>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input id="age" name="age" type="number" value={age} onChange={e => setAge(e.target.value)} required className={inputStyles} placeholder="Age" min="1"/>
                            <select id="gender" name="gender" value={gender} onChange={e => setGender(e.target.value as any)} required className={inputStyles}>
                                <option value="" disabled>Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <input id="phone" name="phone" type="tel" value={phone} onChange={handlePhoneChange} required className={inputStyles} placeholder="10-Digit Phone Number" maxLength={10} />
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <h3 className="text-center text-sm font-medium text-gray-500">Set Your Meal Timings</h3>
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700">Breakfast</label>
                                <button type="button" onClick={() => handleOpenTimePicker('breakfast')} className="w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-800 bg-white hover:bg-gray-50">{formatTime12Hour(breakfast)}</button>
                            </div>
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700">Lunch</label>
                                <button type="button" onClick={() => handleOpenTimePicker('lunch')} className="w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-800 bg-white hover:bg-gray-50">{formatTime12Hour(lunch)}</button>
                            </div>
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700">Dinner</label>
                                <button type="button" onClick={() => handleOpenTimePicker('dinner')} className="w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-800 bg-white hover:bg-gray-50">{formatTime12Hour(dinner)}</button>
                            </div>
                        </div>
                    </>
                )}

                {isAdminSignup && (
                    <>
                        <input id="hospitalName" name="hospitalName" type="text" value={hospitalName} onChange={e => setHospitalName(e.target.value)} required className={inputStyles} placeholder="Hospital/Clinic Name" />
                        <input id="phone" name="phone" type="tel" value={phone} onChange={handlePhoneChange} required className={inputStyles} placeholder="10-Digit Phone Number" maxLength={10} />
                    </>
                )}
                
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                
                <button type="submit" disabled={loading} className={buttonStyles}>
                    {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create Account')}
                </button>
            </form>
        </>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-white">
        {/* Left Panel: Branding & Info */}
        <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center text-center px-4 overflow-hidden">
          {/* Background shapes */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

          <div className="relative z-10">
            <div className="inline-block p-6 bg-white/80 backdrop-blur-sm rounded-full shadow-2xl mb-8 animate-pulse-icon">
              <PillIcon className="w-20 h-20 text-blue-500" />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-4">
              Welcome to <span className="brand-gradient-text">reMedi</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Your personal medication assistant. Never miss a dose again. We help you stay on track with your prescriptions, effortlessly.
            </p>
          </div>
        </div>

        {/* Right Panel: Authentication Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-100 p-4 sm:p-8">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
              {renderContent()}
            </div>
        </div>
      </div>
      
      {isTimePickerOpen && editingTimeFor && (
        <TimeSelectionModal
          isOpen={isTimePickerOpen}
          onClose={() => setIsTimePickerOpen(false)}
          onSave={handleSaveTime}
          initialTime={
            editingTimeFor === 'breakfast' ? breakfast :
            editingTimeFor === 'lunch' ? lunch : dinner
          }
          title={`Set ${editingTimeFor.charAt(0).toUpperCase() + editingTimeFor.slice(1)} Time`}
        />
      )}

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes pulse-icon {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
        .animate-pulse-icon {
          animation: pulse-icon 2.5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default AuthPage;