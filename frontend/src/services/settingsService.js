import api from './api';

/**
 * Fetch loyalty settings from backend
 */
export const getLoyaltySettings = async () => {
  try {
    const response = await api.get('/merchant/LoyaltySettings');
    return response.data;
  } catch (error) {
    console.error('Error fetching loyalty settings:', error);
    throw error;
  }
};

/**
 * Update loyalty settings in backend
 */
export const updateLoyaltySettings = async (settings) => {
  try {
    const response = await api.put('/merchant/LoyaltySettings', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating loyalty settings:', error);
    throw error;
  }
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await api.put('/notification/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

/**
 * Update merchant profile settings
 */
export const updateProfileSettings = async (profileData) => {
  try {
    const response = await api.put('/merchant/profile', {
      merchantName: profileData.name,
      installerEmail: profileData.email,
      installerMobile: profileData.phone,
      merchantDomain: profileData.website
    });
    return response.data;
  } catch (error) {
    console.error('Error updating profile settings:', error);
    throw error;
  }
};

/**
 * Update appearance settings
 */
export const updateAppearanceSettings = async (settings) => {
  try {
    const response = await api.put('/merchant/appearance', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating appearance settings:', error);
    throw error;
  }
};

/**
 * Update security settings
 */
export const updateSecuritySettings = async (settings) => {
  try {
    const response = await api.put('/merchant/security', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating security settings:', error);
    throw error;
  }
}; 