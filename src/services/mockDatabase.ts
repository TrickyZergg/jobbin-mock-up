import type { Activity, Collection, Database, Entity, EntityCreation, EntityMutation, Settings } from '../types';
import { createSeedDatabase } from './seed';

export const DEMO_STORAGE_KEY = 'jobbin-admin-demo-v1';
export type DemoStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export class MockApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'MockApiError';
  }
}

type RecordValue = Record<string, unknown>;
type Validator = (value: unknown) => boolean;
const text: Validator = (value) => typeof value === 'string' && value.trim().length > 0;
const string: Validator = (value) => typeof value === 'string';
const email: Validator = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const boolean: Validator = (value) => typeof value === 'boolean';
const finite: Validator = (value) => typeof value === 'number' && Number.isFinite(value);
const nonnegative: Validator = (value) => finite(value) && Number(value) >= 0;
const percentage: Validator = (value) => nonnegative(value) && Number(value) <= 100;
const integer: Validator = (value) => nonnegative(value) && Number.isInteger(value);
const iso: Validator = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const date: Validator = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const time: Validator = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const oneOf = (...values: string[]): Validator => (value) => typeof value === 'string' && values.includes(value);
const common = { id: text };
const schemas: Record<Collection, Record<string, Validator>> = {
  candidates: { ...common, name: text, email, phone: text, role: text, city: text, status: oneOf('Activ', 'Suspendat', 'Nou'), rating: (value) => nonnegative(value) && Number(value) <= 5, response: percentage, attendance: percentage, skills: (value) => Array.isArray(value) && value.every(text), createdAt: iso, color: text },
  employers: { ...common, name: text, email, city: text, industry: text, cui: text, status: oneOf('Verificat', 'În verificare', 'Suspendat'), plan: oneOf('Starter', 'Business', 'Premium'), color: text, createdAt: iso },
  jobs: { ...common, title: text, employerId: text, company: text, city: text, type: oneOf('Full-time', 'Part-time', 'Contract'), salary: text, category: text, status: oneOf('Activ', 'În verificare', 'Pauză', 'Închis'), applications: integer, description: string, createdAt: iso },
  applications: { ...common, candidateId: text, candidate: text, jobId: text, job: text, company: text, status: oneOf('Nouă', 'În evaluare', 'Interviu', 'Angajat', 'Respins'), createdAt: iso },
  events: { ...common, title: text, date, time, city: text, type: oneOf('Interviu', 'Târg de joburi', 'Webinar'), attendees: integer, status: oneOf('Programat', 'Finalizat', 'Anulat'), description: string },
  notifications: { ...common, title: text, description: string, type: oneOf('candidate', 'employer', 'job', 'system'), read: boolean, createdAt: iso },
  transactions: { ...common, company: text, type: oneOf('Abonament', 'Credite', 'Rambursare'), amount: finite, status: oneOf('Finalizată', 'În așteptare'), createdAt: iso },
  tickets: { ...common, subject: text, author: text, email, priority: oneOf('Scăzută', 'Medie', 'Ridicată'), status: oneOf('Deschis', 'În lucru', 'Rezolvat'), message: text, reply: string, createdAt: iso },
  admins: { ...common, name: text, email, role: oneOf('Administrator', 'Moderator', 'Suport'), status: oneOf('Activ', 'Invitat') },
};
const settingsSchema: Record<keyof Settings, Validator> = { name: text, email, phone: text, company: text, jobApproval: boolean, employerVerification: boolean, emailNotifications: boolean, weeklyReport: boolean, twoFactor: boolean };
const activitySchema: Record<keyof Activity, Validator> = { id: text, description: text, type: oneOf('candidate', 'employer', 'job', 'system'), createdAt: iso };
const collectionLabels: Record<Collection, string> = { candidates: 'candidatul', employers: 'angajatorul', jobs: 'jobul', applications: 'aplicarea', events: 'evenimentul', notifications: 'notificarea', transactions: 'tranzacția', tickets: 'tichetul', admins: 'administratorul' };
const collectionTypes: Partial<Record<Collection, Activity['type']>> = { candidates: 'candidate', employers: 'employer', jobs: 'job', applications: 'candidate' };

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const isRecord = (value: unknown): value is RecordValue => typeof value === 'object' && value !== null && !Array.isArray(value);
const validRecord = (value: unknown, schema: Record<string, Validator>): value is RecordValue => isRecord(value) && Object.entries(schema).every(([key, validate]) => validate(value[key])) && Object.keys(value).every((key) => Object.prototype.hasOwnProperty.call(schema, key));

/** Reject incompatible or malformed persisted data before it reaches React. */
export function isValidDatabase(value: unknown): value is Database {
  if (!isRecord(value) || !validRecord(value.settings, settingsSchema) || !Array.isArray(value.activity) || !value.activity.every((item) => validRecord(item, activitySchema))) return false;
  for (const collection of Object.keys(schemas) as Collection[]) {
    const items = value[collection];
    if (!Array.isArray(items) || !items.every((item) => validRecord(item, schemas[collection])) || new Set(items.map((item) => item.id)).size !== items.length) return false;
  }
  const database = value as unknown as Database;
  if (!database.admins.some((admin) => admin.role === 'Administrator' && admin.status === 'Activ')) return false;
  const candidates = new Map(database.candidates.map((candidate) => [candidate.id, candidate]));
  const employers = new Map(database.employers.map((employer) => [employer.id, employer]));
  const jobs = new Map(database.jobs.map((job) => [job.id, job]));
  return database.jobs.every((job) => employers.get(job.employerId)?.name === job.company && job.applications === database.applications.filter((application) => application.jobId === job.id).length)
    && database.applications.every((application) => candidates.get(application.candidateId)?.name === application.candidate && jobs.get(application.jobId)?.title === application.job && jobs.get(application.jobId)?.company === application.company);
}

const browserStorage = (): DemoStorage | undefined => {
  try { return typeof window !== 'undefined' ? window.localStorage : undefined; }
  catch { return undefined; }
};

/** A replaceable transport repository. It never contacts a server or a real account. */
export function createMockDatabase(storage: DemoStorage | undefined = browserStorage()) {
  let database = createSeedDatabase();
  try {
    const persisted = storage?.getItem(DEMO_STORAGE_KEY);
    if (persisted) {
      const parsed: unknown = JSON.parse(persisted);
      if (isValidDatabase(parsed)) database = clone(parsed);
      else storage?.removeItem(DEMO_STORAGE_KEY);
    }
  } catch { /* Private browsing and corrupt JSON both fall back to an in-memory demo. */ }

  const rows = (draft: Database, collection: Collection): Entity[] => draft[collection] as Entity[];
  const assertCollection = (collection: Collection) => {
    if (!Object.prototype.hasOwnProperty.call(schemas, collection)) throw new MockApiError(400, 'Colecția solicitată nu există.');
  };
  const assertFields = (record: RecordValue, schema: Record<string, Validator>, partial = false) => {
    if (!isRecord(record) || Object.keys(record).some((key) => !Object.prototype.hasOwnProperty.call(schema, key))) throw new MockApiError(400, 'Datele trimise conțin câmpuri necunoscute.');
    const fields = partial ? Object.keys(record) : Object.keys(schema);
    for (const field of fields) {
      if (!schema[field](record[field])) throw new MockApiError(422, `Valoare invalidă pentru câmpul „${field}”.`);
    }
  };
  const syncReferences = (draft: Database) => {
    draft.jobs.forEach((job) => {
      const employer = draft.employers.find((item) => item.id === job.employerId);
      if (!employer) throw new MockApiError(422, 'Selectează un angajator existent pentru acest job.');
      job.company = employer.name;
      job.applications = draft.applications.filter((application) => application.jobId === job.id).length;
    });
    draft.applications.forEach((application) => {
      const candidate = draft.candidates.find((item) => item.id === application.candidateId);
      const job = draft.jobs.find((item) => item.id === application.jobId);
      if (!candidate || !job) throw new MockApiError(422, 'Selectează un candidat și un job existente pentru aplicare.');
      application.candidate = candidate.name;
      application.job = job.title;
      application.company = job.company;
    });
    if (!draft.admins.some((admin) => admin.role === 'Administrator' && admin.status === 'Activ')) throw new MockApiError(409, 'Păstrează cel puțin un administrator activ în echipă.');
  };
  const makeId = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  const audit = (draft: Database, description: string, type: Activity['type'] = 'system') => {
    draft.activity.unshift({ id: makeId('activity'), description, type, createdAt: new Date().toISOString() });
    draft.activity = draft.activity.slice(0, 100);
  };
  const commit = (draft: Database) => {
    syncReferences(draft);
    database = draft;
    try { storage?.setItem(DEMO_STORAGE_KEY, JSON.stringify(database)); }
    catch { /* Continue operating in memory if storage is disabled or full. */ }
  };
  const displayName = (record: Entity) => {
    const value = record as unknown as RecordValue;
    return String(value.name ?? value.title ?? value.subject ?? value.candidate ?? value.company ?? value.id);
  };
  const defaults = (collection: Collection): RecordValue => {
    const createdAt = new Date().toISOString();
    const defaultValues: Record<Collection, RecordValue> = {
      candidates: { name: 'Candidat nou', email: 'candidat@example.ro', phone: '0700 000 000', role: 'Nespecificat', city: 'Oradea', status: 'Nou', rating: 5, response: 0, attendance: 100, skills: [], color: '#dfe6ff', createdAt },
      employers: { name: 'Companie nouă', email: 'office@example.ro', city: 'Oradea', industry: 'Servicii', cui: 'RO00000000', status: 'În verificare', plan: 'Starter', color: '#dfe6ff', createdAt },
      jobs: { title: 'Job nou', employerId: database.employers[0]?.id ?? '', company: database.employers[0]?.name ?? '', city: 'Oradea', type: 'Full-time', salary: 'De negociat', category: 'Altele', status: database.settings.jobApproval ? 'În verificare' : 'Activ', applications: 0, description: '', createdAt },
      applications: { candidateId: database.candidates[0]?.id ?? '', candidate: database.candidates[0]?.name ?? '', jobId: database.jobs[0]?.id ?? '', job: database.jobs[0]?.title ?? '', company: database.jobs[0]?.company ?? '', status: 'Nouă', createdAt },
      events: { title: 'Eveniment nou', date: createdAt.slice(0, 10), time: '10:00', city: 'Online', type: 'Webinar', attendees: 0, status: 'Programat', description: '' },
      notifications: { title: 'Notificare nouă', description: '', type: 'system', read: false, createdAt },
      transactions: { company: 'GETJOBBIN S.R.L.', type: 'Credite', amount: 0, status: 'Finalizată', createdAt },
      tickets: { subject: 'Solicitare nouă', author: 'Utilizator', email: 'utilizator@example.ro', priority: 'Medie', status: 'Deschis', message: 'Solicitare de asistență.', reply: '', createdAt },
      admins: { name: 'Colegul nou', email: 'coleg@example.ro', role: 'Moderator', status: 'Invitat' },
    };
    return { id: makeId(collection.slice(0, -1)), ...defaultValues[collection] };
  };

  return {
    getDatabase: (): Database => clone(database),
    createEntity: ({ collection, record }: EntityCreation): Entity => {
      assertCollection(collection);
      assertFields(record, schemas[collection], true);
      const draft = clone(database);
      const entity = { ...defaults(collection), ...clone(record) } as unknown as Entity;
      assertFields(entity as unknown as RecordValue, schemas[collection]);
      if (rows(draft, collection).some((item) => item.id === entity.id)) throw new MockApiError(409, 'Există deja o înregistrare cu acest identificator.');
      if (collection === 'admins' && draft.admins.some((admin) => admin.email.toLowerCase() === String(record.email).toLowerCase())) throw new MockApiError(409, 'Această adresă de e-mail există deja în echipă.');
      rows(draft, collection).unshift(entity);
      audit(draft, `A fost adăugat ${collectionLabels[collection]} „${displayName(entity)}”.`, collectionTypes[collection]);
      commit(draft);
      return clone(rows(draft, collection).find((item) => item.id === entity.id)!);
    },
    updateEntity: ({ collection, id, changes }: EntityMutation): Entity => {
      assertCollection(collection);
      if (!rows(database, collection).some((item) => item.id === id)) throw new MockApiError(404, 'Înregistrarea solicitată nu mai există.');
      if (!isRecord(changes)) throw new MockApiError(400, 'Trimite un obiect valid cu modificările înregistrării.');
      if (Object.prototype.hasOwnProperty.call(changes, 'id')) throw new MockApiError(400, 'Identificatorul unei înregistrări nu poate fi modificat.');
      assertFields(changes, schemas[collection], true);
      const draft = clone(database);
      const item = rows(draft, collection).find((entity) => entity.id === id)!;
      Object.assign(item, clone(changes));
      if (collection === 'admins' && draft.admins.some((admin) => admin.id !== id && admin.email.toLowerCase() === String((item as unknown as RecordValue).email).toLowerCase())) throw new MockApiError(409, 'Această adresă de e-mail există deja în echipă.');
      audit(draft, `A fost actualizat ${collectionLabels[collection]} „${displayName(item)}”.`, collectionTypes[collection]);
      commit(draft);
      return clone(item);
    },
    deleteEntity: ({ collection, id }: { collection: Collection; id: string }): void => {
      assertCollection(collection);
      const index = rows(database, collection).findIndex((item) => item.id === id);
      if (index === -1) throw new MockApiError(404, 'Înregistrarea solicitată nu mai există.');
      const draft = clone(database);
      const [item] = rows(draft, collection).splice(index, 1);
      if (collection === 'candidates') draft.applications = draft.applications.filter((application) => application.candidateId !== id);
      if (collection === 'employers') draft.jobs = draft.jobs.filter((job) => job.employerId !== id);
      if (collection === 'jobs' || collection === 'employers') {
        const remainingJobs = new Set(draft.jobs.map((job) => job.id));
        draft.applications = draft.applications.filter((application) => remainingJobs.has(application.jobId));
      }
      audit(draft, `A fost șters ${collectionLabels[collection]} „${displayName(item)}”.`, collectionTypes[collection]);
      commit(draft);
    },
    updateSettings: (changes: Partial<Settings>): Settings => {
      assertFields(changes as RecordValue, settingsSchema, true);
      const draft = clone(database);
      draft.settings = { ...draft.settings, ...changes };
      audit(draft, 'Au fost actualizate setările platformei.');
      commit(draft);
      return clone(draft.settings);
    },
    markNotificationsRead: (): void => {
      const draft = clone(database);
      const unread = draft.notifications.filter((notification) => !notification.read).length;
      if (!unread) return;
      draft.notifications.forEach((notification) => { notification.read = true; });
      audit(draft, `${unread} notificări au fost marcate ca citite.`);
      commit(draft);
    },
    resetDemo: (): Database => {
      const draft = createSeedDatabase();
      audit(draft, 'Datele demonstrative au fost restaurate.');
      commit(draft);
      return clone(database);
    },
  };
}

export type MockDatabase = ReturnType<typeof createMockDatabase>;
let sharedDatabase: MockDatabase | undefined;
export const getMockDatabase = (): MockDatabase => sharedDatabase ??= createMockDatabase();
