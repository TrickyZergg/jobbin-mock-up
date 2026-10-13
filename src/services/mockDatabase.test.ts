import { describe, expect, it } from 'vitest';
import type { Candidate, Employer, Job } from '../types';
import { createMockDatabase, DEMO_STORAGE_KEY, isValidDatabase, MockApiError } from './mockDatabase';
import type { DemoStorage } from './mockDatabase';
import { createSeedDatabase } from './seed';

function memoryStorage(initial?: string): DemoStorage {
  const values = new Map<string, string>(initial === undefined ? [] : [[DEMO_STORAGE_KEY, initial]]);
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); } };
}

describe('persisted demo database', () => {
  it('provides Romanian fixtures with valid references and useful future events', () => {
    const database = createSeedDatabase();
    expect(isValidDatabase(database)).toBe(true);
    expect(database.candidates).toHaveLength(32);
    expect(database.applications).toHaveLength(32);
    expect(database.events.every((event) => event.date > '2026-10-12')).toBe(true);
  });

  it('creates, updates, reloads and deletes a candidate with an audit trail', () => {
    const storage = memoryStorage();
    const repository = createMockDatabase(storage);
    const candidate = repository.createEntity({ collection: 'candidates', record: { name: 'Roxana Dima', email: 'roxana@example.ro', city: 'Oradea' } }) as Candidate;
    expect(candidate.id).toBeTruthy();
    expect(candidate.status).toBe('Nou');
    expect(repository.updateEntity({ collection: 'candidates', id: candidate.id, changes: { status: 'Activ', role: 'Designer' } })).toMatchObject({ status: 'Activ', role: 'Designer' });
    const reloaded = createMockDatabase(storage);
    expect(reloaded.getDatabase().candidates.find((item) => item.id === candidate.id)).toMatchObject({ name: 'Roxana Dima', status: 'Activ' });
    expect(reloaded.getDatabase().activity[0].description).toContain('Roxana Dima');
    reloaded.deleteEntity({ collection: 'candidates', id: candidate.id });
    expect(createMockDatabase(storage).getDatabase().candidates.some((item) => item.id === candidate.id)).toBe(false);
  });

  it('keeps snapshots isolated from repository state', () => {
    const repository = createMockDatabase(memoryStorage());
    const snapshot = repository.getDatabase();
    snapshot.candidates[0].name = 'Modified outside repository';
    snapshot.candidates[0].skills.push('Changed');
    expect(repository.getDatabase().candidates[0].name).toBe('Andreea Popescu');
    expect(repository.getDatabase().candidates[0].skills).not.toContain('Changed');
  });

  it.each(['{broken-json', JSON.stringify({ candidates: [] })])('recovers from malformed persistence without throwing', (stored) => {
    const repository = createMockDatabase(memoryStorage(stored));
    expect(repository.getDatabase().candidates).toHaveLength(32);
    expect(isValidDatabase(repository.getDatabase())).toBe(true);
  });

  it('rejects a persisted database with broken references or invalid status', () => {
    const fixture = createSeedDatabase();
    fixture.jobs[0].employerId = 'missing-employer';
    expect(isValidDatabase(fixture)).toBe(false);
    expect(createMockDatabase(memoryStorage(JSON.stringify(fixture))).getDatabase().jobs[0].employerId).toBe('emp-1');
    const invalid = createSeedDatabase();
    (invalid.candidates[0] as unknown as { status: string }).status = 'Invalid';
    expect(isValidDatabase(invalid)).toBe(false);
  });

  it('validates fields and rejects unknown IDs without changing persisted data', () => {
    const storage = memoryStorage();
    const repository = createMockDatabase(storage);
    const before = repository.getDatabase();
    expect(() => repository.updateEntity({ collection: 'candidates', id: 'missing', changes: { name: 'Test' } })).toThrow(MockApiError);
    expect(() => repository.deleteEntity({ collection: 'jobs', id: 'missing' })).toThrow('nu mai există');
    expect(() => repository.updateEntity({ collection: 'candidates', id: 'cand-1', changes: { rating: 7 } })).toThrow('rating');
    expect(() => repository.createEntity({ collection: 'candidates', record: { email: 'invalid' } })).toThrow('email');
    expect(() => repository.updateEntity({ collection: 'candidates', id: 'cand-1', changes: { id: 'rewrite' } })).toThrow('Identificatorul');
    expect(() => repository.updateEntity({ collection: 'candidates', id: 'cand-1', changes: { unknown: true } })).toThrow('necunoscute');
    expect(repository.getDatabase()).toEqual(before);
    expect(storage.getItem(DEMO_STORAGE_KEY)).toBeNull();
  });

  it('synchronizes linked names and application counts after edits and deletion', () => {
    const repository = createMockDatabase(memoryStorage());
    repository.updateEntity({ collection: 'candidates', id: 'cand-1', changes: { name: 'Andreea Marin' } });
    repository.updateEntity({ collection: 'employers', id: 'emp-1', changes: { name: 'TechWave România' } });
    repository.updateEntity({ collection: 'jobs', id: 'job-1', changes: { title: 'Inginer frontend' } });
    expect(repository.getDatabase().applications.find((application) => application.id === 'app-1')).toMatchObject({ candidate: 'Andreea Marin', job: 'Inginer frontend', company: 'TechWave România' });
    const previousCount = repository.getDatabase().jobs.find((job) => job.id === 'job-1')!.applications;
    repository.createEntity({ collection: 'applications', record: { candidateId: 'cand-2', jobId: 'job-1' } });
    expect(repository.getDatabase().jobs.find((job) => job.id === 'job-1')!.applications).toBe(previousCount + 1);
    repository.deleteEntity({ collection: 'candidates', id: 'cand-2' });
    expect(repository.getDatabase().applications.some((application) => application.candidateId === 'cand-2')).toBe(false);
    expect(isValidDatabase(repository.getDatabase())).toBe(true);
    repository.deleteEntity({ collection: 'employers', id: 'emp-1' });
    const database = repository.getDatabase();
    expect(database.jobs.some((job) => job.employerId === 'emp-1')).toBe(false);
    expect(database.applications.some((application) => application.jobId === 'job-1')).toBe(false);
    expect(isValidDatabase(database)).toBe(true);
  });

  it('fails atomically when a linked employer does not exist', () => {
    const repository = createMockDatabase(memoryStorage());
    const before = repository.getDatabase();
    expect(() => repository.createEntity({ collection: 'jobs', record: { employerId: 'missing-employer' } })).toThrow('angajator existent');
    expect(repository.getDatabase()).toEqual(before);
    const employer = repository.createEntity({ collection: 'employers', record: { name: 'Compania nouă' } }) as Employer;
    const job = repository.createEntity({ collection: 'jobs', record: { title: 'Analist', employerId: employer.id } }) as Job;
    expect(job.company).toBe('Compania nouă');
  });

  it('preserves explicit refund IDs, permits negative refunds and prevents duplicates', () => {
    const repository = createMockDatabase(memoryStorage());
    const request = { collection: 'transactions' as const, record: { id: 'refund-txn-1', company: 'TechWave Solutions', type: 'Rambursare', amount: -499 } };
    expect(repository.createEntity(request)).toMatchObject({ id: 'refund-txn-1', amount: -499 });
    expect(() => repository.createEntity(request)).toThrow('deja');
    expect(repository.getDatabase().transactions.filter((transaction) => transaction.id === 'refund-txn-1')).toHaveLength(1);
  });

  it('protects the last active administrator and duplicate team invitations', () => {
    const repository = createMockDatabase(memoryStorage());
    expect(() => repository.deleteEntity({ collection: 'admins', id: 'admin-1' })).toThrow('administrator activ');
    expect(() => repository.updateEntity({ collection: 'admins', id: 'admin-1', changes: { role: 'Suport' } })).toThrow('administrator activ');
    expect(() => repository.createEntity({ collection: 'admins', record: { email: 'ALEXANDRA@jobbin.ro' } })).toThrow('deja');
    expect(repository.getDatabase().admins.find((admin) => admin.id === 'admin-1')?.role).toBe('Administrator');
  });

  it('persists settings and read states and resets the entire demonstration', () => {
    const storage = memoryStorage();
    const repository = createMockDatabase(storage);
    repository.updateSettings({ company: 'Compania mea', twoFactor: true });
    repository.markNotificationsRead();
    const reloaded = createMockDatabase(storage);
    expect(reloaded.getDatabase().settings).toMatchObject({ company: 'Compania mea', twoFactor: true });
    expect(reloaded.getDatabase().notifications.every((notification) => notification.read)).toBe(true);
    reloaded.resetDemo();
    expect(createMockDatabase(storage).getDatabase().settings.company).toBe('GETJOBBIN S.R.L.');
    expect(reloaded.getDatabase().notifications.some((notification) => !notification.read)).toBe(true);
    expect(reloaded.getDatabase().activity[0].description).toContain('restaurate');
  });

  it('continues working if browser storage is unavailable', () => {
    const inaccessible = () => { throw new Error('Storage blocked'); };
    const repository = createMockDatabase({ getItem: inaccessible, setItem: inaccessible, removeItem: inaccessible });
    expect(() => repository.updateSettings({ weeklyReport: false })).not.toThrow();
    expect(repository.getDatabase().settings.weeklyReport).toBe(false);
  });
});
