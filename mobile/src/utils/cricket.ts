/**
 * Cricket overs are not decimal quantities.
 * Stored "legal balls" → display as overs.balls (e.g. 17 balls → 2.5).
 */
export function ballsToOversDisplay(legalBalls: number): string {
  if (!Number.isFinite(legalBalls) || legalBalls < 0) return '0.0'
  const whole = Math.floor(legalBalls / 6)
  const balls = legalBalls % 6
  return `${whole}.${balls}`
}

/** Parse display overs like "12.3" into legal balls (12*6 + 3). */
export function oversDisplayToBalls(value: string): number {
  const [oversPart, ballsPart = '0'] = value.trim().split('.')
  const overs = Number(oversPart)
  const balls = Number(ballsPart)
  if (!Number.isFinite(overs) || !Number.isFinite(balls) || balls > 5 || balls < 0) {
    throw new Error(`Invalid overs display: ${value}`)
  }
  return overs * 6 + balls
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
