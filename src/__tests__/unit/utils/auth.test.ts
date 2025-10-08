import {
  handleLockout,
  resetLockout,
  clearLockouts,
  MAX_ATTEMPTS,
  BASE_LOCKOUT_DURATION_MS,
} from "@utils/auth";

describe("utils/auth", () => {
  afterEach(() => {
    clearLockouts();
  });

  it("locks an IP after the maximum number of attempts", () => {
    const ip = "127.0.0.1";
    const now = 1_000;
    let status = { isLockedOut: false, remainingLockout: 0 };

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      status = handleLockout(ip, now);
    }

    expect(status.isLockedOut).toBe(true);
    expect(status.remainingLockout).toBe(BASE_LOCKOUT_DURATION_MS);
  });

  it("doubles the lockout duration after consecutive lock cycles", () => {
    const ip = "192.168.1.10";
    const initialTime = 5_000;
    let status = { isLockedOut: false, remainingLockout: 0 };

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      status = handleLockout(ip, initialTime);
    }

    expect(status.remainingLockout).toBe(BASE_LOCKOUT_DURATION_MS);

    const resumeTime = initialTime + BASE_LOCKOUT_DURATION_MS + 1;
    status = handleLockout(ip, resumeTime);
    expect(status.isLockedOut).toBe(false);

    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt += 1) {
      status = handleLockout(ip, resumeTime);
    }

    expect(status.remainingLockout).toBe(BASE_LOCKOUT_DURATION_MS * 2);
  });

  it("resets lockout state after successful verification", () => {
    const ip = "10.0.0.5";
    const now = 2_000;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      handleLockout(ip, now);
    }

    resetLockout(ip);

    const status = handleLockout(ip, now + BASE_LOCKOUT_DURATION_MS + 1);
    expect(status.isLockedOut).toBe(false);
    expect(status.remainingLockout).toBe(0);
  });

  it("throws when called without an IP", () => {
    expect(() => handleLockout("", 0)).toThrow("IP address is required.");
    expect(() => resetLockout("")).toThrow("IP address is required.");
  });
});
