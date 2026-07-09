import type { Command } from 'commander';

export function registerInitCommand(program: Command): void {
  program.command('init').description('Initialize a new Atlas project');
}
