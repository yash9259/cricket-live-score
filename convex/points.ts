
export const POINTS_CONFIG = {
  BATTING: {
    RUN: 1,
    DOT: -2,
    DUCK: -5,
  },
  BOWLING: {
    WICKET: 10,
    DOT: 2,
    EXTRA: -2, // Wide or No Ball
    MAIDEN: 20,
  }
};

/**
 * Calculates batting points for a single ball or a whole inning.
 * For a whole inning, duck penalty should only be applied if runs === 0 and isOut is true.
 */
export function calculateBattingPoints(params: {
  runs: number,
  dots: number,
  isOut: boolean,
  isSuperBall?: boolean
}) {
  let points = 0;
  points += params.runs * POINTS_CONFIG.BATTING.RUN;
  points += params.dots * POINTS_CONFIG.BATTING.DOT;
  
  if (params.isOut && params.runs === 0) {
    points += POINTS_CONFIG.BATTING.DUCK;
  }

  return params.isSuperBall ? points * 2 : points;
}

/**
 * Calculates bowling points for a single ball or a whole inning.
 */
export function calculateBowlingPoints(params: {
  wickets: number,
  dots: number,
  extras: number,
  maidens: number,
  isSuperBall?: boolean
}) {
  let points = 0;
  points += params.wickets * POINTS_CONFIG.BOWLING.WICKET;
  points += params.dots * POINTS_CONFIG.BOWLING.DOT;
  points += params.extras * POINTS_CONFIG.BOWLING.EXTRA;
  points += params.maidens * POINTS_CONFIG.BOWLING.MAIDEN;

  return params.isSuperBall ? points * 2 : points;
}
