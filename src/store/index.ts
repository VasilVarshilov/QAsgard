/**
 * QAsgard Store & Persistence Architecture
 *
 * Provides centralized access to browser storage, IndexedDB entities,
 * and workspace state management interfaces.
 */

export { browserDb } from '../services/storage/indexedDb';
export type {
  Project,
  TestSuite,
  TestCase,
  TestRun,
  TestPlan,
  Defect,
  User,
  Organization,
  AuditLogEntry,
  TestRepository,
} from '../types';
