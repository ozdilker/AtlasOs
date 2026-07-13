export const ReporterFormat = {
  Terminal: 'terminal',
  Json: 'json',
} as const;

export type ReporterFormat = (typeof ReporterFormat)[keyof typeof ReporterFormat];
