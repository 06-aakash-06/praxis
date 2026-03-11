
import React, { useEffect } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

const GlobalNotification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-dismiss after 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  const isError = type === 'error';
  
  const bgColor = isSuccess ? 'bg-primary/10 border-primary/20' : isError ? 'bg-absent/10 border-absent/20' : 'bg-od-blue/10 border-od-blue/20';
  const textColor = isSuccess ? 'text-primary' : isError ? 'text-absent' : 'text-od-blue';
  const icon = isSuccess ? 'check_circle' : isError ? 'error' : 'info';

  return (
    <div className="fixed top-6 right-6 z-[100] animate-fade-in-down">
      <div className={`flex items-center gap-3 rounded-xl p-4 border shadow-2xl backdrop-blur-md ${bgColor} w-full max-w-sm`}>
        <span className={`material-symbols-outlined text-xl ${textColor}`}>{icon}</span>
        <p className={`flex-1 text-sm font-semibold ${textColor}`}>{message}</p>
        <button onClick={onClose} className={`ml-2 p-1 rounded-full hover:bg-white/10 ${textColor}`}>
            <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GlobalNotification;
