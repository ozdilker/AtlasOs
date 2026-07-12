import type { InspectionSubject } from '../models/inspection-subject.js';

export abstract class Inspector {
  abstract inspect(input: unknown): InspectionSubject;
}
