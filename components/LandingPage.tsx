import React from 'react';
import { PillIcon } from './icons/PillIcon';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 overflow-hidden bg-white">
      {/* Background shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative z-10">
        <div className="inline-block p-6 bg-white/80 backdrop-blur-sm rounded-full shadow-2xl mb-8 animate-pulse-icon">
          <PillIcon className="w-20 h-20 text-blue-500" />
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-4">
          Welcome to <span className="brand-gradient-text">reMedi</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Your personal medication assistant. Never miss a dose again. We help you stay on track with your prescriptions, effortlessly.
        </p>
        <button
          onClick={onStart}
          className="px-10 py-4 bg-blue-600 text-white font-bold text-lg rounded-full hover:bg-blue-700 transition-all transform hover:scale-105 shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Get Started
        </button>
      </div>

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
    </div>
  );
};

export default LandingPage;