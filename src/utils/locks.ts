const activeLocks = new Set<string>();

/**
 * Acquire an in-memory lock for the provided key. If the lock is already held,
 * the promise resolves once the existing holder releases it.
 */
export async function acquireLock(key: string): Promise<void> {
  if (!key) {
    throw new Error("Lock key is required.");
  }

  await new Promise<void>((resolve) => {
    const attempt = () => {
      if (!activeLocks.has(key)) {
        activeLocks.add(key);
        resolve();
        return;
      }
      setImmediate(attempt);
    };

    attempt();
  });
}

/**
 * Release an in-memory lock for the provided key. Safe to call multiple times.
 */
export function releaseLock(key: string): void {
  if (!key) {
    throw new Error("Lock key is required.");
  }

  activeLocks.delete(key);
}

/**
 * Determine whether a lock is currently held. Primarily intended for testing.
 */
export function isLocked(key: string): boolean {
  return activeLocks.has(key);
}

/**
 * Clear all locks. Exposed for test environments only.
 */
export function clearLocks(): void {
  activeLocks.clear();
}
