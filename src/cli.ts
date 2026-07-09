import { Command } from 'commander';
import { registerInitCommand } from './commands/init/index.js';
import { version } from './version.js';

export function createProgram(): Command {
  const program = new Command();

  program.name('atlas').description('Atlas CLI').version(version);

  registerInitCommand(program);

  return program;
}

export function runCli(argv: string[]): void {
  const program = createProgram();
  program.parse(argv);
}
