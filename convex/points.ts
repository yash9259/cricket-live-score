
export const POINTS_CONFIG = {
  BATTING: {
    RUN: 1,
    FOUR_BONUS: 2,
    SIX_BONUS: 4,
  },
  BOWLING: {
    WICKET: 20,
    MAIDEN: 15,
  }
};

/**
 * Calculates batting points for a single ball or a whole inning.
 */
export function calculateBattingPoints(params: {
  runs: number,
  fours?: number,
  sixes?: number,
  isSuperBall?: boolean
}) {
  let points = 0;
  points += params.runs * POINTS_CONFIG.BATTING.RUN;
  points += (params.fours || 0) * POINTS_CONFIG.BATTING.FOUR_BONUS;
  points += (params.sixes || 0) * POINTS_CONFIG.BATTING.SIX_BONUS;

  return params.isSuperBall ? points * 2 : points;
}

/**
 * Calculates bowling points for a single ball or a whole inning.
 */
export function calculateBowlingPoints(params: {
  wickets: number,
  maidens: number,
  isSuperBall?: boolean
}) {
  let points = 0;
  points += params.wickets * POINTS_CONFIG.BOWLING.WICKET;
  points += params.maidens * POINTS_CONFIG.BOWLING.MAIDEN;

  return params.isSuperBall ? points * 2 : points;
}

