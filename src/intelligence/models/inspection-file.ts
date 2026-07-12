export type InspectionFile = {
  readonly relativePath: string;
  readonly content: string;
  readonly encoding: string;
  readonly size: number;
  readonly checksum?: string;
  readonly metadata?: Readonly<Record<string, string>>;
};
