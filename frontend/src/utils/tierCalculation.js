/**
 * Calculate customer tier dynamically based on points and tier thresholds
 * @param {number} points - Customer's current points
 * @param {object} tierThresholds - Merchant's tier threshold settings
 * @returns {string} - Calculated tier ('bronze', 'silver', 'gold', 'platinum')
 */
export const calculateTier = (points, tierThresholds = {}) => {
  // Default tier thresholds if not provided
  const thresholds = {
    bronze: tierThresholds.tierBronze || 0,
    silver: tierThresholds.tierSilver || 1000,
    gold: tierThresholds.tierGold || 5000,
    platinum: tierThresholds.tierPlatinum || 15000
  };

  // Calculate tier based on points
  if (points >= thresholds.platinum) {
    return 'platinum';
  } else if (points >= thresholds.gold) {
    return 'gold';
  } else if (points >= thresholds.silver) {
    return 'silver';
  } else {
    return 'bronze';
  }
};

/**
 * Get next tier and points needed to reach it
 * @param {number} points - Customer's current points
 * @param {object} tierThresholds - Merchant's tier threshold settings
 * @returns {object} - Next tier info { nextTier, pointsNeeded }
 */
export const getNextTierInfo = (points, tierThresholds = {}) => {
  const thresholds = {
    bronze: tierThresholds.tierBronze || 0,
    silver: tierThresholds.tierSilver || 1000,
    gold: tierThresholds.tierGold || 5000,
    platinum: tierThresholds.tierPlatinum || 15000
  };

  if (points < thresholds.silver) {
    return {
      nextTier: 'silver',
      pointsNeeded: thresholds.silver - points
    };
  } else if (points < thresholds.gold) {
    return {
      nextTier: 'gold',
      pointsNeeded: thresholds.gold - points
    };
  } else if (points < thresholds.platinum) {
    return {
      nextTier: 'platinum',
      pointsNeeded: thresholds.platinum - points
    };
  } else {
    return {
      nextTier: null,
      pointsNeeded: 0
    };
  }
};

/**
 * Get tier progress percentage
 * @param {number} points - Customer's current points
 * @param {object} tierThresholds - Merchant's tier threshold settings
 * @returns {number} - Progress percentage (0-100)
 */
export const getTierProgress = (points, tierThresholds = {}) => {
  const thresholds = {
    bronze: tierThresholds.tierBronze || 0,
    silver: tierThresholds.tierSilver || 1000,
    gold: tierThresholds.tierGold || 5000,
    platinum: tierThresholds.tierPlatinum || 15000
  };

  if (points < thresholds.silver) {
    return Math.round((points / thresholds.silver) * 100);
  } else if (points < thresholds.gold) {
    return Math.round(((points - thresholds.silver) / (thresholds.gold - thresholds.silver)) * 100);
  } else if (points < thresholds.platinum) {
    return Math.round(((points - thresholds.gold) / (thresholds.platinum - thresholds.gold)) * 100);
  } else {
    return 100;
  }
}; 