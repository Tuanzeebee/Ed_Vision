// Types for Seasonal Effects System

export type SeasonalEvent = 
  | 'CHRISTMAS'
// Noel (25/12)
  | 'LUNAR_NEW_YEAR'
// Tết Nguyên Đán
  | 'WOMEN_DAY'
// 8/3
  | 'LIBERATION_DAY'
// 30/4
  | 'LABOR_DAY'
// 1/5
  | 'CHILDREN_DAY'
// 1/6
  | 'MID_AUTUMN'
// Tết Trung Thu
  | 'NATIONAL_DAY'
// 2/9
  | 'WOMEN_VN_DAY'
// 20/10
  | 'TEACHER_DAY'
// 20/11
  | 'HALLOWEEN'
// 31/10
  | 'NONE';

export interface SeasonalConfig {
  event: SeasonalEvent;
  theme: string;
  effects: string[];
  active: boolean;
  startDate: string; // MM-DD format
  endDate: string;   // MM-DD format
  backgroundGradient?: string;
  particleConfig?: object;
}

export interface SeasonalEffectContextType {
  currentEvent: SeasonalEvent;
  config: SeasonalConfig | null;
  isEnabled: boolean;
  toggleEffects: () =>void;
}

// Seasonal events configuration
export const SEASONAL_EVENTS: SeasonalConfig[] = [
  {
    event: 'CHRISTMAS',
    theme: 'christmas',
    effects: ['snowfall', 'christmas_lights'],
    active: true,
    startDate: '12-01',
    endDate: '12-31',
    backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  {
    event: 'LUNAR_NEW_YEAR',
    theme: 'tet',
    effects: ['falling_apricot', 'gold_coins', 'fireworks'],
    active: true,
    startDate: '01-15',
    endDate: '02-15',
    backgroundGradient: 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6347 100%)',
  },
  {
    event: 'HALLOWEEN',
    theme: 'halloween',
    effects: ['bats', 'pumpkins', 'ghosts'],
    active: true,
    startDate: '10-25',
    endDate: '11-01',
    backgroundGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f3d 50%, #4a2c4a 100%)',
  },
  {
    event: 'TEACHER_DAY',
    theme: 'teacher',
    effects: ['confetti', 'flowers'],
    active: true,
    startDate: '11-18',
    endDate: '11-21',
    backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
];
