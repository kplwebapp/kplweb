import type { CricketSkills } from '@/services/api/registrationApi';

/** Must match the "cricketer" options in backend/src/modules/profile/profile.persona.constants.js. */
const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL', '6XL'];

type SelectKey = Exclude<keyof CricketSkills, 'tshirt_number'>;

export const CRICKET_SELECT_FIELDS: { key: SelectKey; label: string; options: string[] }[] = [
  { key: 'batting_style', label: 'Batting Style', options: ['Right-hand', 'Left-hand'] },
  {
    key: 'bowling_style',
    label: 'Bowling Style',
    options: [
      'Right-arm fast',
      'Right-arm medium-fast',
      'Right-arm medium',
      'Right-arm off-spin',
      'Right-arm leg-spin',
      'Left-arm fast',
      'Left-arm medium-fast',
      'Left-arm medium',
      'Left-arm orthodox',
      'Left-arm chinaman',
      'Does not bowl',
    ],
  },
  { key: 'is_wicketkeeper', label: 'Is Wicketkeeper?', options: ['Yes', 'No'] },
  { key: 'tshirt_size', label: 'T-shirt Size', options: APPAREL_SIZES },
  { key: 'trouser_size', label: 'Trouser Size', options: APPAREL_SIZES },
];

/** Display order for the profile page and admin lists. */
export const CRICKET_SKILL_LABELS: { key: keyof CricketSkills; label: string }[] = [
  { key: 'batting_style', label: 'Batting Style' },
  { key: 'bowling_style', label: 'Bowling Style' },
  { key: 'is_wicketkeeper', label: 'Wicketkeeper' },
  { key: 'tshirt_size', label: 'T-shirt Size' },
  { key: 'trouser_size', label: 'Trouser Size' },
  { key: 'tshirt_number', label: 'T-shirt Number' },
];

export const CRICKET_CATEGORY_SLUG = 'cricket';
