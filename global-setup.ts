import { chromium } from '@playwright/test';
import { spawn, ChildProcess, execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

let devServerProcess: ChildProcess | null = null;
const PID_FILE = path.join(__dirname, '.playwright-dev-server.pid');
let serverStartedThisRun = false;
const WATCH_PORTS = [3000, 8080];

// Get credentials from environment variables
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';
const TEST_PIN = process.env.TEST_PIN || '';

if (!TEST_PASSWORD || !TEST_PIN) {
  throw new Error('TEST_PASSWORD and TEST_PIN environment variables must be set');
}

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function terminateProcessTree(pid: number): Promise<void> {
  if (!pid || Number.isNaN(pid)) {
    return;
  }

  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // ignore errors
    }
    return;
  }

  let signalSent = false;
  try {
    process.kill(-pid, 'SIGTERM');
    signalSent = true;
  } catch {
    // ignore
  }

  try {
    process.kill(pid, 'SIGTERM');
    signalSent = true;
  } catch {
    // ignore
  }

  if (!signalSent) {
    return;
  }

  const timeoutAt = Date.now() + 5000;
  while (Date.now() < timeoutAt) {
    try {
      process.kill(pid, 0);
      await wait(150);
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

function collectPidsOnPort(port: number): number[] {
  try {
    if (process.platform === 'win32') {
      const stdout = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      return stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split(/\s+/);
          return Number(parts[parts.length - 1]);
        })
        .filter((pid) => !Number.isNaN(pid) && pid > 0);
    }

    const stdout = execSync(`lsof -ti tcp:${port}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    if (!stdout) {
      return [];
    }

    return stdout
      .split(/\s+/)
      .map((pid) => Number(pid))
      .filter((pid) => !Number.isNaN(pid) && pid > 0);
  } catch {
    return [];
  }
}

async function ensurePortAvailable(port: number): Promise<void> {
  const pids = collectPidsOnPort(port);
  if (!pids.length) {
    return;
  }

  console.log(
    `Port ${port} appears busy (pids: ${pids.join(', ')}). Attempting to terminate occupying processes...`
  );

  for (const pid of pids) {
    await terminateProcessTree(pid);
  }

  await wait(350);

  const remaining = collectPidsOnPort(port);
  if (remaining.length) {
    throw new Error(
      `Port ${port} is still occupied by pid(s) ${remaining.join(
        ', '
      )}. Please stop these processes and retry.`
    );
  } else {
    console.log(`Port ${port} cleared successfully.`);
  }
}

async function cleanupStaleDevServer(): Promise<void> {
  try {
    const contents = await fs.readFile(PID_FILE, 'utf-8');
    const data = JSON.parse(contents);
    const recordedPid = Number(data?.pid);
    if (!Number.isNaN(recordedPid) && recordedPid > 0) {
      console.log(`Ensuring previous dev server process (${recordedPid}) is stopped...`);
      await terminateProcessTree(recordedPid);
    }
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.warn('Failed to inspect previous dev server PID file:', error);
    }
  }

  for (const port of WATCH_PORTS) {
    await ensurePortAvailable(port);
  }
}

async function waitForDevServerReady(child: ChildProcess): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Dev server failed to start within 120 seconds'));
    }, 120000);

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start dev server: ${error.message}`));
    });

    child.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timeout);
        reject(new Error(`Dev server exited with code ${code}`));
      }
    });

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        const str = data.toString();
        console.log(`[dev-server] ${str.trim()}`);
        if (str.includes('webpack compiled') || str.includes('Compiled successfully')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        const str = data.toString();
        console.error(`[dev-server] ${str.trim()}`);
      });
    }
  });
}

async function startDevServer(): Promise<void> {
  console.log('Starting dev server...');

  await cleanupStaleDevServer();
  await fs.rm(PID_FILE, { force: true }).catch(() => {});

  devServerProcess = spawn('yarn', ['dev'], {
    cwd: __dirname,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env },
    detached: true,
  });

  if (!devServerProcess) {
    throw new Error('Failed to spawn dev server process');
  }

  await waitForDevServerReady(devServerProcess);

  await new Promise((resolve) => setTimeout(resolve, 3000));

  if (devServerProcess.pid) {
    try {
      await fs.writeFile(
        PID_FILE,
        JSON.stringify({ pid: devServerProcess.pid }),
        'utf-8'
      );
    } catch (error) {
      console.warn('Unable to persist dev server PID for teardown:', error);
    }

    devServerProcess.unref();
  }

  serverStartedThisRun = true;
  console.log('Dev server ready.');
}

async function authenticateDashboard(): Promise<void> {
  const authFile = path.join(__dirname, 'client/playwright/.auth/user.json');

  const authBrowser = await chromium.launch({
    headless: false,
  });

  try {
    const context = await authBrowser.newContext({
      ignoreHTTPSErrors: true,
      permissions: ['camera'],
    });
    const authPage = await context.newPage();

    await authPage.goto('https://localhost:3000/', { waitUntil: 'load', timeout: 20000 });

    await authPage.evaluate(() => {
      const overlay = document.getElementById('webpack-dev-server-client-overlay');
      if (overlay) {
        overlay.remove();
      }
    }).catch(() => {});

    const passcodeInput = authPage.locator('input[placeholder="Enter passcode"]');
    if (await passcodeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passcodeInput.fill(TEST_PASSWORD);
      await authPage.getByRole('button', { name: 'Submit' }).click();
      await authPage.waitForTimeout(1000);
    }

    await authPage.evaluate(() => {
      const overlay = document.getElementById('webpack-dev-server-client-overlay');
      if (overlay) {
        overlay.remove();
      }
    }).catch(() => {});

    await authPage.waitForSelector('text=1', { timeout: 10000 });

    const pinDigits = TEST_PIN.split('');
    for (const digit of pinDigits) {
      await authPage.getByText(digit, { exact: true }).click();
    }

    await authPage.waitForSelector('button:has-text("Admission")', { timeout: 10000 });

    await context.storageState({ path: authFile });
  } finally {
    await authBrowser.close();
  }
}

async function globalSetup() {
  console.log('Checking if dev server is already running...');
  let serverRunning = false;

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ ignoreHTTPSErrors: true });

    try {
      const response = await page.goto('https://localhost:3000', {
        waitUntil: 'domcontentloaded',
        timeout: 5000,
      });

      if (response && response.ok()) {
        const hasContent = await page.locator('body').count() > 0;
        if (hasContent) {
          serverRunning = true;
          console.log('Dev server already running, reusing existing server');
        }
      }
    } catch {
      console.log('Dev server not responding properly, will start a new one');
    } finally {
      await browser.close();
    }
  } catch {
    console.log('Could not check server status, will start a new one');
  }

  if (!serverRunning) {
    await startDevServer();
  } else {
    await fs.rm(PID_FILE, { force: true }).catch(() => {});
  }

  const reuseExistingServer = !serverStartedThisRun;

  try {
    await authenticateDashboard();
    console.log('Authentication setup complete');
  } catch (error) {
    if (reuseExistingServer) {
      console.log('Existing dev server became unreachable, starting a fresh instance...');
      await startDevServer();
      await authenticateDashboard();
      console.log('Authentication setup complete');
    } else {
      throw error;
    }
  }

  console.log('Global setup complete');
}

export default globalSetup;
