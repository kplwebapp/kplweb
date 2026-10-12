const POINTS = Object.freeze({ WIN: 2, TIE: 1, NO_RESULT: 1, LOSS: 0 });

/** Cricket overs notation: 19.3 means 19 overs and 3 balls. */
const oversToBalls = (overs) => {
  const whole = Math.trunc(overs);
  return whole * 6 + Math.round((overs - whole) * 10);
};

const hasScores = (m) =>
  [m.team1_runs, m.team1_overs, m.team2_runs, m.team2_overs].every((v) => v !== null && v !== undefined) &&
  m.team1_overs > 0 &&
  m.team2_overs > 0;

const round3 = (value) => Math.round(value * 1000) / 1000;

/**
 * Builds the standings from league-stage results.
 * Win 2, tie/no result 1, loss 0. Net run rate uses the overs entered for each innings,
 * so an all-out innings must be entered as the full quota of overs.
 */
const buildPointsTable = (teams, matches) => {
  const rows = new Map(
    teams.map((t) => [
      t.team_id,
      {
        team_id: t.team_id,
        team_name: t.team_name,
        short_name: t.short_name,
        team_logo: t.team_logo,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        no_result: 0,
        points: 0,
        runsFor: 0,
        ballsFaced: 0,
        runsAgainst: 0,
        ballsBowled: 0,
      },
    ])
  );

  for (const m of matches) {
    if (m.stage !== 'LEAGUE' || m.status === 'SCHEDULED') continue;
    const a = rows.get(m.team1_id);
    const b = rows.get(m.team2_id);
    if (!a || !b) continue;

    a.played += 1;
    b.played += 1;

    if (m.status === 'NO_RESULT') {
      a.no_result += 1;
      b.no_result += 1;
      a.points += POINTS.NO_RESULT;
      b.points += POINTS.NO_RESULT;
      continue;
    }

    if (m.result === 'TIE') {
      a.tied += 1;
      b.tied += 1;
      a.points += POINTS.TIE;
      b.points += POINTS.TIE;
    } else {
      const [winner, loser] = m.result === 'TEAM1' ? [a, b] : [b, a];
      winner.won += 1;
      winner.points += POINTS.WIN;
      loser.lost += 1;
      loser.points += POINTS.LOSS;
    }

    if (hasScores(m)) {
      const balls1 = oversToBalls(m.team1_overs);
      const balls2 = oversToBalls(m.team2_overs);
      a.runsFor += m.team1_runs;
      a.ballsFaced += balls1;
      a.runsAgainst += m.team2_runs;
      a.ballsBowled += balls2;
      b.runsFor += m.team2_runs;
      b.ballsFaced += balls2;
      b.runsAgainst += m.team1_runs;
      b.ballsBowled += balls1;
    }
  }

  const table = [...rows.values()].map(({ runsFor, ballsFaced, runsAgainst, ballsBowled, ...row }) => ({
    ...row,
    net_run_rate:
      ballsFaced > 0 && ballsBowled > 0
        ? round3(runsFor / (ballsFaced / 6) - runsAgainst / (ballsBowled / 6))
        : null,
  }));

  table.sort(
    (x, y) =>
      y.points - x.points ||
      (y.net_run_rate ?? -Infinity) - (x.net_run_rate ?? -Infinity) ||
      y.won - x.won ||
      x.team_name.localeCompare(y.team_name)
  );

  return table.map((row, index) => ({ position: index + 1, ...row }));
};

module.exports = { buildPointsTable, POINTS };
