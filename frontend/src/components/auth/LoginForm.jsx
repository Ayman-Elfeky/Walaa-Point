import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils';
import toast from 'react-hot-toast';

const LoginForm = () => {
  const { t, i18n } = useTranslation();
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success(t('auth.signInSuccess'));
      } else {
        toast.error(result.error || t('auth.invalidCredentials'));
      }
    } catch (error) {
      toast.error(t('auth.invalidCredentials'));
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Toggle */}
        <div className="text-center mb-8">
          <button
            onClick={toggleLanguage}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {i18n.language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-primary-600 rounded"></div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
              {t('auth.welcome')}
            </h1>
            <p className="text-secondary-600">
              {t('auth.signInToAccount')}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  type="email"
                  {...register('email', {
                    required: t('validation.required'),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t('validation.email')
                    }
                  })}
                  className={cn(
                    'input pl-10',
                    errors.email && 'border-error-500 focus:border-error-500 focus:ring-error-500'
                  )}
                  placeholder={t('auth.email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-error-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: t('validation.required'),
                    minLength: {
                      value: 6,
                      message: t('validation.min', { count: 6 })
                    }
                  })}
                  className={cn(
                    'input pl-10 pr-10',
                    errors.password && 'border-error-500 focus:border-error-500 focus:ring-error-500'
                  )}
                  placeholder={t('auth.password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-error-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <span className="ml-2 text-sm text-secondary-600">
                  {t('auth.rememberMe')}
                </span>
              </label>
              <button
                type="button"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-error-50 border border-error-200 rounded-lg p-3"
              >
                <p className="text-sm text-error-700">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className={cn(
                'btn btn-primary w-full py-3 text-base font-semibold',
                (isSubmitting || isLoading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {t('common.loading')}
                </div>
              ) : (
                t('auth.signIn')
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-secondary-500">
              © 2024 Loyalfy Dashboard. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginForm; 