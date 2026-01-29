/**
 * Shared type definitions for BlockLens
 */

// Unit system
export type UnitPreference = 'miles' | 'km';
export type RaceKey = '5k' | '10k' | 'half' | 'marathon';
export type HumidityLevel = 'low' | 'moderate' | 'high';

// Race distance configuration
export interface RaceDistance {
  label: string;
  miles: number;
  km: number;
}

// App input state
export interface AppInputs {
  goalRace: RaceKey;
  goalTime: string;
  recentRace: RaceKey;
  recentTime: string;
  pacingAdjustment: number;
  compareMode: boolean;
  unitPreference: UnitPreference;
  weatherEnabled: boolean;
  temperature: number; // Stored in Fahrenheit
  humidity: HumidityLevel;
}

// Split data for each mile/segment
export interface Split {
  mile: number;
  distance: number;
  pace: number;
  splitTime: number;
  cumulativeTime: number;
  fadeAdjustment: number;
}

// Fade risk assessment levels
export type FadeRiskLevel = 'conservative' | 'low' | 'moderate' | 'high' | 'very-high';

// Fade risk assessment result
export interface FadeRiskAssessment {
  level: FadeRiskLevel;
  color: string;
  message: string;
}

// Full projection result
export interface ProjectionResult {
  sustainablePace: number;
  goalPace: number;
  startPace: number;
  splits: Split[];
  projectedFinishTime: number;
  fadeRisk: FadeRiskAssessment;
  goalDistance: number;
  timeDelta: number;
}

// Projection calculation inputs
export interface ProjectionInputs {
  goalRace: RaceKey;
  goalTimeSeconds: number;
  recentRace: RaceKey;
  recentTimeSeconds: number;
  pacingAdjustment: number;
}

// Comparison projections for aggressive/conservative scenarios
export interface ComparableProjections {
  aggressive: ProjectionResult;
  conservative: ProjectionResult;
}

// Validation result for time string parsing
export interface ValidationResult {
  valid: boolean;
  seconds?: number;
  error?: string;
}

// Fade model configuration
export interface FadeModelConfig {
  AGGRESSION_MULTIPLIER: number;
  FADE_ONSET_FRACTION: number;
  MAX_FADE_RATE: number;
}

// Risk threshold configuration
export interface RiskThresholds {
  LOW: number;
  MODERATE: number;
  HIGH: number;
}
