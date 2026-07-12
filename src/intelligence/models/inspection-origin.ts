export const InspectionOrigin = {
  Generation: 'generation',
  Filesystem: 'filesystem',
  Remote: 'remote',
  Plugin: 'plugin',
} as const;

export type InspectionOrigin = (typeof InspectionOrigin)[keyof typeof InspectionOrigin];
