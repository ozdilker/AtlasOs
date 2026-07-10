export class InitProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InitProjectError';
  }
}
