const PERSONA_TYPES = Object.freeze([
  'cricketer',
  'singer',
  'painter',
  'chess_player',
  'carrom_player',
  'volunteer',
]);

const PERSONA_LABELS = Object.freeze({
  cricketer: 'Cricketer',
  singer: 'Singer',
  painter: 'Painter',
  chess_player: 'Chess Player',
  carrom_player: 'Carrom Player',
  volunteer: 'Volunteer',
});

const APPAREL_SIZE_OPTIONS = Object.freeze(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL', '6XL']);

const BOWLING_STYLE_OPTIONS = Object.freeze([
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
]);

const PERSONA_FIELD_DEFS = Object.freeze({
  cricketer: [
    { key: 'batting_style', label: 'Batting Style', type: 'select', options: ['Right-hand', 'Left-hand'] },
    { key: 'bowling_style', label: 'Bowling Style', type: 'select', options: BOWLING_STYLE_OPTIONS },
    { key: 'is_wicketkeeper', label: 'Wicket Keeper', type: 'select', options: ['Yes', 'No'] },
    { key: 'tshirt_number', label: 'T-shirt Number', type: 'number' },
    { key: 'tshirt_size', label: 'T-shirt Size', type: 'select', options: APPAREL_SIZE_OPTIONS },
    { key: 'trouser_size', label: 'Trouser Size', type: 'select', options: APPAREL_SIZE_OPTIONS },
  ],
  singer: [
    { key: 'genre', label: 'Preferred Genre', type: 'text' },
    { key: 'instruments', label: 'Instruments', type: 'text' },
    { key: 'performance_type', label: 'Performance Type', type: 'select', options: ['Solo', 'Group', 'Both'] },
  ],
  painter: [
    { key: 'medium', label: 'Medium', type: 'select', options: ['Oil', 'Watercolour', 'Acrylic', 'Digital', 'Mixed'] },
    { key: 'style', label: 'Style', type: 'text' },
    { key: 'portfolio_link', label: 'Portfolio Link', type: 'text' },
  ],
  chess_player: [
    { key: 'chess_rating', label: 'Chess Rating', type: 'number' },
  ],
  carrom_player: [
    { key: 'preferred_hand', label: 'Preferred Hand', type: 'select', options: ['Right', 'Left', 'Both'] },
  ],
  volunteer: [
    { key: 'interest_area', label: 'Area of Interest', type: 'text' },
    { key: 'availability', label: 'Availability', type: 'select', options: ['Weekdays', 'Weekends', 'Both'] },
  ],
});

function sanitizeAnswers(personaType, answers = {}) {
  const defs = PERSONA_FIELD_DEFS[personaType];
  if (!defs) return {};

  const clean = {};
  for (const field of defs) {
    const raw = answers[field.key];
    if (raw == null || raw === '') continue;

    if (field.type === 'number') {
      const num = Number(raw);
      if (!Number.isNaN(num)) clean[field.key] = num;
      continue;
    }

    const value = String(raw).trim();
    if (!value) continue;

    if (field.type === 'select' && field.options && !field.options.includes(value)) {
      continue;
    }

    clean[field.key] = value;
  }

  return clean;
}

module.exports = {
  PERSONA_TYPES,
  PERSONA_LABELS,
  PERSONA_FIELD_DEFS,
  sanitizeAnswers,
};
