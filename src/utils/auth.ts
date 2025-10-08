export interface LockoutRecord {
  count: number;
  lockouts: number;
  lockoutTimestamp?: number;
}

const ipLoginAttempts: Record<string, LockoutRecord> = {};

export const MAX_ATTEMPTS = 5;
export const BASE_LOCKOUT_DURATION_MS = 60 * 1000;

export interface LockoutStatus {
  isLockedOut: boolean;
  remainingLockout: number;
}

/**
 * Track login attempts for an IP address and determine whether it should be locked.
 * @param ip The IP address to track.
 * @param currentTimestamp Timestamp override (primarily for testing).
 */
export function handleLockout(
  ip: string,
  currentTimestamp: number = Date.now()
): LockoutStatus {
  if (!ip) {
    throw new Error("IP address is required.");
  }

  if (!ipLoginAttempts[ip]) {
    ipLoginAttempts[ip] = { count: 0, lockouts: 0 };
  }

  const record = ipLoginAttempts[ip];

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockouts += 1;
    const multiplier = Math.pow(2, Math.max(record.lockouts - 1, 0));
    const lockoutDuration = BASE_LOCKOUT_DURATION_MS * multiplier;

    record.lockoutTimestamp = currentTimestamp + lockoutDuration;
    record.count = 0;
  }

  const remainingLockout =
    record.lockoutTimestamp !== undefined
      ? Math.max(record.lockoutTimestamp - currentTimestamp, 0)
      : 0;

  return {
    isLockedOut: remainingLockout > 0,
    remainingLockout,
  };
}

/**
 * Reset lockout tracking for a specific IP address.
 */
export function resetLockout(ip: string): void {
  if (!ip) {
    throw new Error("IP address is required.");
  }

  delete ipLoginAttempts[ip];
}

/**
 * Retrieve the current lockout record. Useful for diagnostics and testing.
 */
export function getLockoutRecord(ip: string): LockoutRecord | undefined {
  return ipLoginAttempts[ip];
}

/**
 * Clear all lockout records. Exposed for resetting state between tests.
 */
export function clearLockouts(): void {
  for (const key of Object.keys(ipLoginAttempts)) {
    delete ipLoginAttempts[key];
  }
}
