
import { Achievement, DailyChallengeState } from '../types';
import { ACHIEVEMENTS_LIST } from '../constants';

const ACHIEVEMENTS_KEY = 'bubble_shooter_achievements';
const DAILY_KEY = 'bubble_shooter_daily';

export const loadAchievements = (): Achievement[] => {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!stored) {
      return ACHIEVEMENTS_LIST.map(a => ({ ...a, unlocked: false }));
    }
    const parsed = JSON.parse(stored);
    // Merge with static list in case we added new ones
    return ACHIEVEMENTS_LIST.map(base => {
      const found = parsed.find((p: Achievement) => p.id === base.id);
      return { ...base, unlocked: found ? found.unlocked : false };
    });
  } catch (e) {
    return ACHIEVEMENTS_LIST.map(a => ({ ...a, unlocked: false }));
  }
};

export const saveAchievements = (achievements: Achievement[]) => {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch (e) {
    console.warn('Failed to save achievements', e);
  }
};

export const loadDailyState = (): DailyChallengeState => {
  try {
    const stored = localStorage.getItem(DAILY_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return { lastPlayedDate: null, completed: false };
};

export const saveDailyState = (state: DailyChallengeState) => {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(state));
  } catch (e) {}
};

export const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
