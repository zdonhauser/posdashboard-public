import { acquireLock, releaseLock, isLocked, clearLocks } from "@utils/locks";

describe("utils/locks", () => {
  afterEach(() => {
    clearLocks();
  });

  it("acquires and releases a lock", async () => {
    const key = "order-1";

    await acquireLock(key);
    expect(isLocked(key)).toBe(true);

    releaseLock(key);
    expect(isLocked(key)).toBe(false);
  });

  it("serializes concurrent access for the same key", async () => {
    const key = "shared";
    const sequence: string[] = [];

    const first = (async () => {
      await acquireLock(key);
      sequence.push("first-acquired");
      await new Promise((resolve) => setTimeout(resolve, 5));
      releaseLock(key);
      sequence.push("first-released");
    })();

    const second = (async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      await acquireLock(key);
      sequence.push("second-acquired");
      releaseLock(key);
    })();

    await Promise.all([first, second]);

    expect(sequence).toEqual([
      "first-acquired",
      "first-released",
      "second-acquired",
    ]);
  });

  it("rejects attempts to acquire a lock without a key", async () => {
    await expect(acquireLock("")).rejects.toThrow("Lock key is required.");
  });
});
