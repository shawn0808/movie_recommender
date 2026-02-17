/** Format NTRP level to 1 decimal place (e.g. 3.0, 3.5, 4.0) */
export function formatNtrp(level: number): string {
  return Number(level).toFixed(1);
}

/** Format NTRP range for display */
export function formatNtrpRange(min: number, max: number): string {
  return `${formatNtrp(min)}–${formatNtrp(max)}`;
}
