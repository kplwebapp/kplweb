/** Sport-aware score helpers for tournament_matches.score_data + cricket columns. */

const SPORT_SLUGS = Object.freeze({
  cricket: 'cricket',
  carrom: 'carrom',
  chess: 'chess',
});

const normaliseSport = (slug) => {
  const value = String(slug || '').toLowerCase();
  if (value === SPORT_SLUGS.carrom) return SPORT_SLUGS.carrom;
  if (value === SPORT_SLUGS.chess) return SPORT_SLUGS.chess;
  return SPORT_SLUGS.cricket;
};

const emptyCricket = () => ({
  team1_runs: null,
  team1_wickets: null,
  team1_overs: null,
  team2_runs: null,
  team2_wickets: null,
  team2_overs: null,
});

/**
 * Validates and normalises score fields for the tournament's sport.
 * Cricket uses dedicated columns; carrom/chess use score_data JSON.
 */
const normaliseSportScores = (sportSlug, data) => {
  const sport = normaliseSport(sportSlug);
  const next = { ...data, score_data: data.score_data ?? null };

  if (sport === SPORT_SLUGS.cricket) {
    // Keep CricHeroes-style live/full scoreboard JSON when present.
    const raw = data.score_data;
    if (raw && typeof raw === 'object' && (raw.sport === 'cricket' || Array.isArray(raw.innings))) {
      next.score_data = {
        sport: 'cricket',
        innings: Array.isArray(raw.innings) ? raw.innings : [],
        live: raw.live ?? null,
      };
    } else {
      next.score_data = null;
    }
    return next;
  }

  Object.assign(next, emptyCricket());

  if (sport === SPORT_SLUGS.carrom) {
    const team1Points = data.score_data?.team1_points ?? data.team1_points ?? null;
    const team2Points = data.score_data?.team2_points ?? data.team2_points ?? null;
    next.score_data =
      team1Points == null && team2Points == null
        ? null
        : {
            sport: 'carrom',
            team1_points: team1Points == null ? null : Number(team1Points),
            team2_points: team2Points == null ? null : Number(team2Points),
          };
    return next;
  }

  // chess
  const team1Points = data.score_data?.team1_points ?? data.team1_points ?? null;
  const team2Points = data.score_data?.team2_points ?? data.team2_points ?? null;
  next.score_data =
    team1Points == null && team2Points == null
      ? null
      : {
          sport: 'chess',
          team1_points: team1Points == null ? null : Number(team1Points),
          team2_points: team2Points == null ? null : Number(team2Points),
        };
  return next;
};

const formatMatchScore = (match, sportSlug) => {
  const sport = normaliseSport(sportSlug || match.score_data?.sport);
  if (sport === SPORT_SLUGS.carrom || sport === SPORT_SLUGS.chess) {
    const s1 = match.score_data?.team1_points;
    const s2 = match.score_data?.team2_points;
    if (s1 == null && s2 == null) return null;
    return {
      team1: s1 == null ? '—' : String(s1),
      team2: s2 == null ? '—' : String(s2),
      label: sport === SPORT_SLUGS.chess ? 'points' : 'points',
    };
  }

  const fmt = (runs, wickets, overs) => {
    if (runs == null) return null;
    const score = wickets == null ? `${runs}` : `${runs}/${wickets}`;
    return overs == null ? score : `${score} (${overs} ov)`;
  };
  const team1 = fmt(match.team1_runs, match.team1_wickets, match.team1_overs);
  const team2 = fmt(match.team2_runs, match.team2_wickets, match.team2_overs);
  if (!team1 && !team2) return null;
  return { team1: team1 || '—', team2: team2 || '—', label: 'innings' };
};

module.exports = {
  SPORT_SLUGS,
  normaliseSport,
  normaliseSportScores,
  formatMatchScore,
};
