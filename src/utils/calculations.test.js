import { describe, it, expect } from 'vitest';
import {
  timeToSeconds,
  secondsToTime,
  formatPace,
  predictRaceTime,
  calculateSustainablePace,
  calculateFadeAdjustment,
  generateSplits,
  assessFadeRisk,
  calculateProjection,
} from './calculations.js';

describe('timeToSeconds', () => {
  it('converts MM:SS format', () => {
    expect(timeToSeconds('5:30')).toBe(330);
    expect(timeToSeconds('0:45')).toBe(45);
  });

  it('converts HH:MM:SS format', () => {
    expect(timeToSeconds('1:30:00')).toBe(5400);
    expect(timeToSeconds('3:45:30')).toBe(13530);
  });
});

describe('secondsToTime', () => {
  it('formats times under an hour as M:SS', () => {
    expect(secondsToTime(330)).toBe('5:30');
    expect(secondsToTime(45)).toBe('0:45');
  });

  it('formats times over an hour as H:MM:SS', () => {
    expect(secondsToTime(5400)).toBe('1:30:00');
    expect(secondsToTime(13530)).toBe('3:45:30');
  });
});

describe('formatPace', () => {
  it('formats pace as M:SS', () => {
    expect(formatPace(480)).toBe('8:00');
    expect(formatPace(445)).toBe('7:25');
  });
});

describe('predictRaceTime (Riegel formula)', () => {
  it('predicts longer race is slower per mile', () => {
    const fiveKTime = 20 * 60; // 20:00 5K
    const tenKTime = predictRaceTime(fiveKTime, 3.1, 6.2);

    // 10K should be more than 2x the 5K time due to fatigue
    expect(tenKTime).toBeGreaterThan(fiveKTime * 2);
  });

  it('predicts marathon from half marathon reasonably', () => {
    const halfTime = 90 * 60; // 1:30 half
    const marathonTime = predictRaceTime(halfTime, 13.1, 26.2);

    // Marathon should be roughly 2.08-2.1x half time
    const ratio = marathonTime / halfTime;
    expect(ratio).toBeGreaterThan(2.05);
    expect(ratio).toBeLessThan(2.15);
  });
});

describe('calculateSustainablePace', () => {
  it('calculates slower pace for longer goal race', () => {
    const recentTime = 25 * 60; // 25:00 5K
    const paceFor10K = calculateSustainablePace('5k', recentTime, '10k');
    const paceForHalf = calculateSustainablePace('5k', recentTime, 'half');

    expect(paceForHalf).toBeGreaterThan(paceFor10K);
  });
});

describe('calculateFadeAdjustment', () => {
  it('returns 0 for conservative pacing', () => {
    expect(calculateFadeAdjustment(-5, 0.8)).toBe(0);
    expect(calculateFadeAdjustment(0, 0.9)).toBe(0);
  });

  it('returns 0 in first half even with aggressive start', () => {
    expect(calculateFadeAdjustment(15, 0.3)).toBe(0);
    expect(calculateFadeAdjustment(15, 0.5)).toBe(0);
  });

  it('increases fade in second half for aggressive start', () => {
    const fadeAt60 = calculateFadeAdjustment(15, 0.6);
    const fadeAt80 = calculateFadeAdjustment(15, 0.8);
    const fadeAt95 = calculateFadeAdjustment(15, 0.95);

    expect(fadeAt60).toBeGreaterThan(0);
    expect(fadeAt80).toBeGreaterThan(fadeAt60);
    expect(fadeAt95).toBeGreaterThan(fadeAt80);
  });
});

describe('generateSplits', () => {
  it('generates correct number of splits', () => {
    const splits = generateSplits('5k', 480, 0);
    expect(splits.length).toBe(4); // 3.1 miles rounds up to 4
  });

  it('cumulative time increases each split', () => {
    const splits = generateSplits('10k', 500, 0);
    for (let i = 1; i < splits.length; i++) {
      expect(splits[i].cumulativeTime).toBeGreaterThan(splits[i - 1].cumulativeTime);
    }
  });

  it('shows fade when starting too fast', () => {
    const splits = generateSplits('half', 480, -15); // 15 sec/mile fast
    const lastFullSplit = splits[splits.length - 2];

    expect(lastFullSplit.fadeAdjustment).toBeGreaterThan(0);
  });
});

describe('assessFadeRisk', () => {
  it('returns conservative for negative deviation', () => {
    expect(assessFadeRisk(-10).level).toBe('conservative');
  });

  it('returns low for small deviation', () => {
    expect(assessFadeRisk(3).level).toBe('low');
  });

  it('returns moderate for medium deviation', () => {
    expect(assessFadeRisk(12).level).toBe('moderate');
  });

  it('returns high for large deviation', () => {
    expect(assessFadeRisk(20).level).toBe('high');
  });

  it('returns very-high for extreme deviation', () => {
    expect(assessFadeRisk(30).level).toBe('very-high');
  });
});

describe('calculateProjection', () => {
  it('returns all expected fields', () => {
    const result = calculateProjection({
      goalRace: 'marathon',
      goalTimeSeconds: 3 * 3600 + 30 * 60, // 3:30:00
      recentRace: 'half',
      recentTimeSeconds: 1 * 3600 + 40 * 60, // 1:40:00
      pacingAdjustment: 0,
    });

    expect(result).toHaveProperty('sustainablePace');
    expect(result).toHaveProperty('goalPace');
    expect(result).toHaveProperty('splits');
    expect(result).toHaveProperty('projectedFinishTime');
    expect(result).toHaveProperty('fadeRisk');
    expect(result).toHaveProperty('timeDelta');
  });

  it('aggressive start increases fade risk level', () => {
    const inputs = {
      goalRace: 'marathon',
      goalTimeSeconds: 3 * 3600 + 30 * 60,
      recentRace: 'half',
      recentTimeSeconds: 1 * 3600 + 40 * 60,
    };

    const conservative = calculateProjection({ ...inputs, pacingAdjustment: 10 });
    const aggressive = calculateProjection({ ...inputs, pacingAdjustment: -20 });

    expect(conservative.fadeRisk.level).toBe('conservative');
    expect(['moderate', 'high', 'very-high']).toContain(aggressive.fadeRisk.level);
  });
});
