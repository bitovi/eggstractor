/**
 * Used for showing progress in the UI. It is capped at 95% during the time that
 * nodes are being processed to tokens. The last 5% is reserved for
 * transforming the tokens to the requested format.
 */
export const MAX_PROGRESS_PERCENTAGE = 95;

/**
 * Promise wrapped setTimeout.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
