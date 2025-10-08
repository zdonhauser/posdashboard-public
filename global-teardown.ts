import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const PID_FILE = path.join(__dirname, '.playwright-dev-server.pid');

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function terminateProcessTree(pid: number): Promise<void> {
  if (process.platform === 'win32') {
    execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    return;
  }

  let signalSent = false;
  try {
    process.kill(-pid, 'SIGTERM');
    signalSent = true;
  } catch {
    // Ignore if process group doesn't exist
  }

  try {
    process.kill(pid, 'SIGTERM');
    signalSent = true;
  } catch {
    // Process may already be gone
  }

  if (!signalSent) {
    return;
  }

  const timeoutAt = Date.now() + 5000;
  while (Date.now() < timeoutAt) {
    try {
      process.kill(pid, 0);
      await wait(200);
    } catch {
      return;
    }
  }

  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    // ignore
  }

  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // ignore
  }
}

async function globalTeardown() {
  let recordedPid: number | null = null;

  try {
    const contents = await fs.readFile(PID_FILE, 'utf-8');
    const data = JSON.parse(contents);
    if (data?.pid) {
      const parsed = Number(data.pid);
      if (!Number.isNaN(parsed) && parsed > 0) {
        recordedPid = parsed;
      }
    }
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      console.log('No PID file found, assuming existing dev server was reused.');
    } else {
      console.warn('Failed to read dev server PID file:', error);
    }
  }

  if (recordedPid) {
    console.log(`Shutting down dev server (pid ${recordedPid})...`);
    try {
      await terminateProcessTree(recordedPid);
      console.log('Dev server shut down successfully');
    } catch (error) {
      console.warn('Dev server cleanup encountered an issue:', error);
    }
  }

  await fs.rm(PID_FILE, { force: true }).catch(() => {});

  console.log('Global teardown complete');
}

export default globalTeardown;
