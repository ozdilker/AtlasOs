export type ProjectConfig = {
  readonly name?: string;
};

export type DoctorConfig = {
  readonly profile: string;
  readonly format: string;
};

export type TemplateConfig = {
  readonly directory: string;
};

export type AtlasConfig = {
  readonly project: ProjectConfig;
  readonly doctor: DoctorConfig;
  readonly templates: TemplateConfig;
};
