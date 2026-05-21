import React, { useEffect } from 'react';

function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`fixed top-5 right-5 z-50 p-4 rounded-xl border shadow-2xl transition-all duration-300 max-w-xs ${
      isSuccess 
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
    }`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default Toast;