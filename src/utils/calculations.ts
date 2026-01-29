import {
  RACE_DISTANCES,
  RIEGEL_EXPONENT,
  FADE_MODEL,
  RISK_THRESHOLDS,
  MILES_TO_KM,
} from './constants';
import type {
  RaceKey,
  UnitPreference,
  HumidityLevel,
  Split,
  FadeRiskAssessment,
  ProjectionResult,
  ProjectionInputs,
  ValidationResult,
} from '../types';

/**
 * Validate and parse time string (MM:SS or HH:MM:SS)
 * Returns { valid: true, seconds } or { valid: false, error }
 */
export const validateTimeString = (timeStr: string | null | undefined): ValidationResult => {
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
export const timeToSeconds = (timeStr: string): number => {
  const result = validateTimeString(timeStr);
  return result.valid && result.seconds !== undefined ? result.seconds : 0;
};

/**
 * Convert total seconds to formatted time string (H:MM:SS or M:SS)
 */
export function secondsToTime(totalSeconds: number): string {
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
export function formatPace(secondsPerMile: number): string {
  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.round(secondsPerMile % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Convert pace from seconds/mile to seconds/km
 */
export const paceToKm = (secondsPerMile: number): number => secondsPerMile / MILES_TO_KM;

/**
 * Convert distance from miles to km
 */
export const milesToKm = (miles: number): number => miles * MILES_TO_KM;

/**
 * Format pace with unit label
 * @param secondsPerMile - Pace in seconds per mile (internal unit)
 * @param unit - 'miles' or 'km'
 * @returns Formatted pace like "8:00/mi" or "4:58/km"
 */
export const formatPaceWithUnit = (secondsPerMile: number, unit: UnitPreference): string => {
  const pace = unit === 'km' ? paceToKm(secondsPerMile) : secondsPerMile;
  return `${formatPace(pace)}/${unit === 'km' ? 'km' : 'mi'}`;
};

/**
 * Format distance in selected unit
 * @param miles - Distance in miles (internal unit)
 * @param unit - 'miles' or 'km'
 * @returns Formatted distance
 */
export const formatDistance = (miles: number, unit: UnitPreference): string => {
  const distance = unit === 'km' ? milesToKm(miles) : miles;
  return distance.toFixed(1);
};

/**
 * Convert Fahrenheit to Celsius
 */
export const fahrenheitToCelsius = (tempF: number): number => Math.round((tempF - 32) * 5 / 9);

/**
 * Convert Celsius to Fahrenheit
 */
export const celsiusToFahrenheit = (tempC: number): number => Math.round(tempC * 9 / 5 + 32);

/**
 * Calculate weather-based pace adjustment
 * Based on running research: ~1.5% slowdown per 10°F above optimal (55°F)
 * Humidity compounds the effect
 *
 * @param tempF - Temperature in Fahrenheit
 * @param humidity - Humidity level
 * @returns Slowdown as decimal (0.03 = 3% slower)
 */
export const calculateWeatherAdjustment = (tempF: number, humidity: HumidityLevel): number => {
  const optimalTemp = 55; // Optimal running temperature in °F
  const degreesAboveOptimal = Math.max(0, tempF - optimalTemp);

  // Base slowdown: ~1.5% per 10°F above optimal
  let slowdownPercent = (degreesAboveOptimal / 10) * 1.5;

  // Humidity multiplier
  const humidityMultiplier: Record<HumidityLevel, number> = {
    low: 1.0,
    moderate: 1.1,
    high: 1.2,
  };

  slowdownPercent *= humidityMultiplier[humidity];

  return slowdownPercent / 100; // Return as decimal
};

/**
 * Riegel formula: predict race time for a new distance based on a known performance
 * T2 = T1 × (D2/D1)^exponent
 *
 * @param knownTimeSeconds - Time for the known distance in seconds
 * @param knownDistanceMiles - Known distance in miles
 * @param targetDistanceMiles - Target distance in miles
 * @returns Predicted time in seconds
 */
export function predictRaceTime(
  knownTimeSeconds: number,
  knownDistanceMiles: number,
  targetDistanceMiles: number
): number {
  return knownTimeSeconds * Math.pow(targetDistanceMiles / knownDistanceMiles, RIEGEL_EXPONENT);
}

/**
 * Calculate sustainable pace (seconds per mile) for a goal distance
 * based on a recent race performance
 *
 * @param recentRaceKey - Key from RACE_DISTANCES (e.g., '5k')
 * @param recentTimeSeconds - Recent race finish time in seconds
 * @param goalRaceKey - Key from RACE_DISTANCES
 * @returns Sustainable pace in seconds per mile
 */
export function calculateSustainablePace(
  recentRaceKey: RaceKey,
  recentTimeSeconds: number,
  goalRaceKey: RaceKey
): number {
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
 * @param pacingDeviation - Seconds/mile faster than sustainable (negative = slower)
 * @param raceFraction - How far through the race (0-1)
 * @returns Seconds to add to base pace at this point
 */
export function calculateFadeAdjustment(pacingDeviation: number, raceFraction: number): number {
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
 * @param goalRaceKey - Key from RACE_DISTANCES
 * @param sustainablePace - Sustainable pace in sec/mile
 * @param pacingAdjustment - Sec/mile to adjust start pace (negative = faster)
 * @returns Array of split objects
 */
export function generateSplits(
  goalRaceKey: RaceKey,
  sustainablePace: number,
  pacingAdjustment: number
): Split[] {
  const distance = RACE_DISTANCES[goalRaceKey].miles;
  const splits: Split[] = [];

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
 * @param pacingDeviation - Seconds/mile faster than sustainable
 * @returns Risk assessment with level and message
 */
export function assessFadeRisk(pacingDeviation: number): FadeRiskAssessment {
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
 * @param inputs - Projection calculation inputs
 * @returns Calculation results
 */
export function calculateProjection(inputs: ProjectionInputs): ProjectionResult {
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
