import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { createProgram } from '../../src/cli.js';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const cliEntrypoint = join(repositoryRoot, 'src/index.ts');
const tsxExecutable = join(
  repositoryRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
);
const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-smoke-'));
  tempDirectories.push(directory);
  return directory;
}

function runCli(
  args: string[],
  options?: { cwd?: string },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(tsxExecutable, [cliEntrypoint, ...args], {
      cwd: options?.cwd ?? repositoryRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });
  });
}

describe('CLI smoke', () => {
  it('exposes init and doctor commands and version from createProgram', () => {
    const program = createProgram();

    expect(program.name()).toBe('atlas');
    expect(program.version()).toBe('0.2.0-alpha');
    expect(program.commands.map((command) => command.name())).toEqual(['init', 'doctor']);
  });

  it('prints help output from the CLI entrypoint', async () => {
    const { stdout, exitCode } = await runCli(['--help']);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Usage: atlas');
    expect(stdout).toContain('init');
    expect(stdout).toContain('doctor');
  });

  it('initializes a project through the CLI entrypoint subprocess', async () => {
    const baseDirectory = await createTempDirectory();
    const projectName = 'SmokeProject';
    const { stdout, stderr, exitCode } = await runCli(['init', projectName], {
      cwd: baseDirectory,
    });

    expect(stderr, `CLI stderr: ${stderr}`).toBe('');
    expect(exitCode).toBe(0);
    expect(stdout).toContain(`Successfully initialized Atlas project: ${projectName}`);
    expect(await readFile(join(baseDirectory, projectName, 'README.md'), 'utf8')).toContain(
      `# ${projectName}`,
    );
  });
});
