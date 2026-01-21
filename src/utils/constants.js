/**
 * Race distances with display names and values in miles
 */
export const RACE_DISTANCES = {
  '5k': { label: '5K', miles: 3.1, km: 5 },
  '10k': { label: '10K', miles: 6.2, km: 10 },
  'half': { label: 'Half Marathon', miles: 13.1, km: 21.1 },
  'marathon': { label: 'Marathon', miles: 26.2, km: 42.2 },
};

/**
 * Riegel exponent - standard value for predicting race times across distances
 * Higher values = more fatigue penalty for longer distances
 */
export const RIEGEL_EXPONENT = 1.06;

/**
 * Fade model constants
 * These control how aggressively pace deviation compounds into late-race slowdown
 */
export const FADE_MODEL = {
  // How much each second/mile too fast compounds (e.g., 1.5 = 50% penalty)
  AGGRESSION_MULTIPLIER: 1.5,
  // Point in race (as fraction) where fade begins to accelerate
  FADE_ONSET_FRACTION: 0.5,
  // Maximum fade rate (seconds lost per mile at end vs start)
  MAX_FADE_RATE: 30,
};

/**
 * Risk thresholds for the fade risk indicator
 * Based on seconds/mile faster than sustainable pace
 */
export const RISK_THRESHOLDS = {
  LOW: 5,      // 0-5 sec/mile fast = low risk
  MODERATE: 15, // 6-15 sec/mile fast = moderate risk
  HIGH: 25,    // 16-25 sec/mile fast = high risk
  // >25 = very high risk
};
