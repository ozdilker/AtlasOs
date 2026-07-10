export type PlannedFile = {
  readonly relativePath: string;
  readonly encoding: string;
  readonly renderStrategy: 'template' | 'empty';
  readonly templateId?: string;
};

export type GenerationPlan = {
  readonly projectName: string;
  readonly directories: readonly string[];
  readonly plannedFiles: readonly PlannedFile[];
};
