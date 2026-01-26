import {
  RACE_DISTANCES,
  RIEGEL_EXPONENT,
  FADE_MODEL,
  RISK_THRESHOLDS,
  MILES_TO_KM,
} from './constants.js';

/**
 * Validate and parse time string (MM:SS or HH:MM:SS)
 * Returns { valid: true, seconds } or { valid: false, error }
 */
export const validateTimeString = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') {
    return { valid: false, error: 'Enter a time' };
  }

  const trimmed = timeStr.trim();
  if (!trimmed) {
    return { valid: false, error: 'Enter a time' };
  }

  // Check format: should be digits and colons only
  if (!/^[\d:]+$/.test(trimmed)) {
    return { valid: false, error: 'Use format M:SS or H:MM:SS' };
  }

  const parts = trimmed.split(':');
  if (parts.length < 2 || parts.length > 3) {
    return { valid: false, error: 'Use format M:SS or H:MM:SS' };
  }

  // Check each part is a valid number
  const nums = parts.map(Number);
  if (nums.some((n) => isNaN(n) || n < 0)) {
    return { valid: false, error: 'Invalid number in time' };
  }

  // Validate ranges
  if (parts.length === 2) {
    const [minutes, seconds] = nums;
    if (seconds >= 60) {
      return { valid: false, error: 'Seconds must be 0-59' };
    }
    if (minutes === 0 && seconds === 0) {
      return { valid: false, error: 'Time must be greater than 0' };
    }
    return { valid: true, seconds: minutes * 60 + seconds };
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = nums;
    if (minutes >= 60) {
      return { valid: false, error: 'Minutes must be 0-59' };
    }
    if (seconds >= 60) {
      return { valid: false, error: 'Seconds must be 0-59' };
    }
    if (hours === 0 && minutes === 0 && seconds === 0) {
      return { valid: false, error: 'Time must be greater than 0' };
    }
    return { valid: true, seconds: hours * 3600 + minutes * 60 + seconds };
  }

  return { valid: false, error: 'Use format M:SS or H:MM:SS' };
};

/**
 * Convert time string (MM:SS or HH:MM:SS) to total seconds
 * Returns 0 for invalid input (use validateTimeString for validation)
 */
export const timeToSeconds = (timeStr) => {
  const result = validateTimeString(timeStr);
  return result.valid ? result.seconds : 0;
};

/**
 * Convert total seconds to formatted time string (H:MM:SS or M:SS)
 */
export function secondsToTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format pace as M:SS per mile
 */
export function formatPace(secondsPerMile) {
  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.round(secondsPerMile % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Convert pace from seconds/mile to seconds/km
 */
export const paceToKm = (secondsPerMile) => secondsPerMile / MILES_TO_KM;

/**
 * Convert distance from miles to km
 */
export const milesToKm = (miles) => miles * MILES_TO_KM;

/**
 * Format pace with unit label
 * @param {number} secondsPerMile - Pace in seconds per mile (internal unit)
 * @param {string} unit - 'miles' or 'km'
 * @returns {string} Formatted pace like "8:00/mi" or "4:58/km"
 */
export const formatPaceWithUnit = (secondsPerMile, unit) => {
  const pace = unit === 'km' ? paceToKm(secondsPerMile) : secondsPerMile;
  return `${formatPace(pace)}/${unit === 'km' ? 'km' : 'mi'}`;
};

/**
 * Format distance in selected unit
 * @param {number} miles - Distance in miles (internal unit)
 * @param {string} unit - 'miles' or 'km'
 * @returns {string} Formatted distance
 */
export const formatDistance = (miles, unit) => {
  const distance = unit === 'km' ? milesToKm(miles) : miles;
  return distance.toFixed(1);
};

/**
 * Riegel formula: predict race time for a new distance based on a known performance
 * T2 = T1 × (D2/D1)^exponent
 *
 * @param {number} knownTimeSeconds - Time for the known distance in seconds
 * @param {number} knownDistanceMiles - Known distance in miles
 * @param {number} targetDistanceMiles - Target distance in miles
 * @returns {number} Predicted time in seconds
 */
export function predictRaceTime(knownTimeSeconds, knownDistanceMiles, targetDistanceMiles) {
  return knownTimeSeconds * Math.pow(targetDistanceMiles / knownDistanceMiles, RIEGEL_EXPONENT);
}

/**
 * Calculate sustainable pace (seconds per mile) for a goal distance
 * based on a recent race performance
 *
 * @param {string} recentRaceKey - Key from RACE_DISTANCES (e.g., '5k')
 * @param {number} recentTimeSeconds - Recent race finish time in seconds
 * @param {string} goalRaceKey - Key from RACE_DISTANCES
 * @returns {number} Sustainable pace in seconds per mile
 */
export function calculateSustainablePace(recentRaceKey, recentTimeSeconds, goalRaceKey) {
  const recentDistance = RACE_DISTANCES[recentRaceKey].miles;
  const goalDistance = RACE_DISTANCES[goalRaceKey].miles;

  const predictedTime = predictRaceTime(recentTimeSeconds, recentDistance, goalDistance);
  return predictedTime / goalDistance;
}

/**
 * Calculate fade factor for a given point in the race
 * Returns a multiplier that increases pace (slows runner) based on:
 * - How aggressive the start was (deviation from sustainable)
 * - How far into the race we are
 *
 * @param {number} pacingDeviation - Seconds/mile faster than sustainable (negative = slower)
 * @param {number} raceFraction - How far through the race (0-1)
 * @returns {number} Seconds to add to base pace at this point
 */
export function calculateFadeAdjustment(pacingDeviation, raceFraction) {
  // If starting slower than sustainable, minimal positive fade
  if (pacingDeviation <= 0) {
    return 0;
  }

  const { AGGRESSION_MULTIPLIER, FADE_ONSET_FRACTION, MAX_FADE_RATE } = FADE_MODEL;

  // Fade accelerates after onset point
  let fadeFactor = 0;
  if (raceFraction > FADE_ONSET_FRACTION) {
    // Exponential fade in the back half
    const fadeProgress = (raceFraction - FADE_ONSET_FRACTION) / (1 - FADE_ONSET_FRACTION);
    fadeFactor = Math.pow(fadeProgress, 2) * AGGRESSION_MULTIPLIER * pacingDeviation;
  }

  return Math.min(fadeFactor, MAX_FADE_RATE);
}

/**
 * Generate mile-by-mile splits with fade applied
 *
 * @param {string} goalRaceKey - Key from RACE_DISTANCES
 * @param {number} sustainablePace - Sustainable pace in sec/mile
 * @param {number} pacingAdjustment - Sec/mile to adjust start pace (negative = faster)
 * @returns {Array} Array of split objects
 */
export function generateSplits(goalRaceKey, sustainablePace, pacingAdjustment) {
  const distance = RACE_DISTANCES[goalRaceKey].miles;
  const splits = [];

  // Pacing deviation is how much faster than sustainable (positive = aggressive)
  const pacingDeviation = -pacingAdjustment; // Flip sign: -10 adjustment = 10 faster

  let cumulativeTime = 0;

  for (let mile = 1; mile <= Math.ceil(distance); mile++) {
    const raceFraction = mile / distance;
    const isPartialMile = mile > distance;
    const mileDistance = isPartialMile ? distance - Math.floor(distance) : 1;

    // Start pace = sustainable + adjustment
    const startPace = sustainablePace + pacingAdjustment;

    // Calculate fade for this point in race
    const fadeAdjustment = calculateFadeAdjustment(pacingDeviation, raceFraction);

    // Actual pace = start pace + fade (fade slows you down)
    const actualPace = startPace + fadeAdjustment;
    const splitTime = actualPace * mileDistance;
    cumulativeTime += splitTime;

    splits.push({
      mile,
      distance: mileDistance,
      pace: actualPace,
      splitTime,
      cumulativeTime,
      fadeAdjustment,
    });
  }

  return splits;
}

/**
 * Assess fade risk based on pacing deviation
 *
 * @param {number} pacingDeviation - Seconds/mile faster than sustainable
 * @returns {Object} Risk assessment with level and message
 */
export function assessFadeRisk(pacingDeviation) {
  if (pacingDeviation <= 0) {
    return {
      level: 'conservative',
      color: 'blue',
      message: 'Conservative start - may have time to spare',
    };
  }

  if (pacingDeviation <= RISK_THRESHOLDS.LOW) {
    return {
      level: 'low',
      color: 'green',
      message: 'Low risk - slight positive split likely',
    };
  }

  if (pacingDeviation <= RISK_THRESHOLDS.MODERATE) {
    return {
      level: 'moderate',
      color: 'yellow',
      message: 'Moderate risk - expect noticeable fade in final miles',
    };
  }

  if (pacingDeviation <= RISK_THRESHOLDS.HIGH) {
    return {
      level: 'high',
      color: 'orange',
      message: 'High risk - significant slowdown likely',
    };
  }

  return {
    level: 'very-high',
    color: 'red',
    message: 'Very high risk - blow-up territory',
  };
}

/**
 * Main calculation function - computes all outputs from inputs
 *
 * @param {Object} inputs
 * @param {string} inputs.goalRace - Goal race key (e.g., 'marathon')
 * @param {number} inputs.goalTimeSeconds - Goal finish time in seconds
 * @param {string} inputs.recentRace - Recent race key
 * @param {number} inputs.recentTimeSeconds - Recent race time in seconds
 * @param {number} inputs.pacingAdjustment - Seconds/mile faster (negative) or slower (positive)
 * @returns {Object} Calculation results
 */
export function calculateProjection(inputs) {
  const {
    goalRace,
    goalTimeSeconds,
    recentRace,
    recentTimeSeconds,
    pacingAdjustment,
  } = inputs;

  // Calculate what pace is sustainable based on fitness
  const sustainablePace = calculateSustainablePace(recentRace, recentTimeSeconds, goalRace);

  // Calculate goal pace (what you'd need to hit goal time)
  const goalDistance = RACE_DISTANCES[goalRace].miles;
  const goalPace = goalTimeSeconds / goalDistance;

  // Generate splits with fade model
  const splits = generateSplits(goalRace, sustainablePace, pacingAdjustment);

  // Projected finish time from splits
  const projectedFinishTime = splits.reduce((sum, s) => sum + s.splitTime, 0);

  // Pacing deviation for risk assessment
  const startPace = sustainablePace + pacingAdjustment;
  const pacingDeviation = sustainablePace - startPace; // positive = faster than sustainable

  // Assess risk
  const fadeRisk = assessFadeRisk(pacingDeviation);

  return {
    sustainablePace,
    goalPace,
    startPace,
    splits,
    projectedFinishTime,
    fadeRisk,
    goalDistance,
    // Comparison to goal
    timeDelta: projectedFinishTime - goalTimeSeconds,
  };
}
