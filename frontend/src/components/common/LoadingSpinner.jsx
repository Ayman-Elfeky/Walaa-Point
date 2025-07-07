import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'lg', text = null, fullScreen = true }) => {
  const { t } = useTranslation();

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className={`${sizes[size]} text-primary-600 animate-spin`} />
      {text && (
        <p className="text-sm text-secondary-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-primary-600 animate-spin" />
            </div>
          </div>
          <p className="text-sm text-secondary-600 animate-pulse">
            {text || t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner; 