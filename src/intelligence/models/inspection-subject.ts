import type { InspectionFile } from './inspection-file.js';
import type { InspectionOrigin } from './inspection-origin.js';

export type InspectionSubject = {
  readonly id: string;
  readonly origin: InspectionOrigin;
  readonly projectName: string;
  readonly generatedAt: string;
  readonly files: readonly InspectionFile[];
  readonly metadata: Readonly<Record<string, string>>;
};
