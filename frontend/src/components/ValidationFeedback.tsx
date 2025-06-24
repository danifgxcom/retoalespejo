import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react';

interface ValidationFeedbackProps {
  result: {
    isCorrect: boolean;
    message: string;
  } | null;
  onClose: () => void;
}

const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({ result, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (result) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Auto-close after 4 seconds if successful, 6 seconds if error
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setIsVisible(false);
          onClose();
        }, 300);
      }, result.isCorrect ? 4000 : 6000);

      return () => clearTimeout(timeout);
    }
  }, [result, onClose]);

  if (!result || !isVisible) return null;

  const getIcon = () => {
    if (result.isCorrect) return <CheckCircle size={32} className="text-green-500" />;
    return <XCircle size={32} className="text-red-500" />;
  };

  const getBackgroundClass = () => {
    if (result.isCorrect) return 'bg-gradient-to-r from-green-500 to-emerald-600';
    return 'bg-gradient-to-r from-red-500 to-pink-600';
  };

  const getBorderClass = () => {
    if (result.isCorrect) return 'border-green-200';
    return 'border-red-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isAnimating ? 'opacity-20' : 'opacity-0'
        }`} 
      />
      
      {/* Feedback Card */}
      <div 
        className={`relative pointer-events-auto transform transition-all duration-500 ease-out ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className={`${getBackgroundClass()} p-1 rounded-2xl shadow-2xl`}>
          <div className={`bg-white rounded-xl p-8 border-4 ${getBorderClass()} max-w-md`}>
            {/* Success Animation */}
            {result.isCorrect && (
              <div className="absolute -top-4 -right-4">
                <div className="relative">
                  <Sparkles size={24} className="text-yellow-400 animate-pulse" />
                  <div className="absolute inset-0 animate-ping">
                    <Sparkles size={24} className="text-yellow-300 opacity-75" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                {getIcon()}
              </div>
              <h2 className={`text-2xl font-bold ${
                result.isCorrect ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.isCorrect ? '¡Excelente!' : 'Casi ahí'}
              </h2>
            </div>

            {/* Message */}
            <div className="text-center mb-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                {result.message}
              </p>
            </div>

            {/* Progress or action */}
            {result.isCorrect ? (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium">
                  <CheckCircle size={16} />
                  ¡Desafío completado!
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={() => {
                    setIsAnimating(false);
                    setTimeout(() => {
                      setIsVisible(false);
                      onClose();
                    }, 300);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
                >
                  Seguir intentando
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationFeedback;