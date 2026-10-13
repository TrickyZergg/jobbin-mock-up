import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, Check, CheckCircle2, Clock3, Download, Eye, Mail, MapPin, Pencil, Plus, Search, ShieldCheck, Star, Users, X } from 'lucide-react';
import { Avatar, Badge, Button, EmptyState, Input, Select } from '../components/atoms';
import { ConfirmDialog, DataState, Field, Modal, PageHeader, Pagination, Panel, SearchField } from '../components/molecules';
import { useCreateEntityMutation, useGetDatabaseQuery, useUpdateEntityMutation } from '../services/adminApi';
import { useAppDispatch } from '../store/hooks';
import { addToast } from '../store/uiSlice';
import type { Application, Candidate, Collection, Employer, Event, Job } from '../types';
import { downloadCsv, formatDate, statusTone } from '../utils';
import './ResourcePages.scss';

const PAGE_SIZE = 8;
const candidateStatuses: Candidate['status'][] = ['Activ', 'Nou', 'Suspendat'];
const employerStatuses: Employer['status'][] = ['Verificat', 'În verificare', 'Suspendat'];
const jobStatuses: Job['status'][] = ['Activ', 'În verificare', 'Pauză', 'Închis'];
const applicationStatuses: Application['status'][] = ['Nouă', 'În evaluare', 'Interviu', 'Angajat', 'Respins'];
const eventStatuses: Event['status'][] = ['Programat', 'Finalizat', 'Anulat'];
const contains = (value: string, query: string) => value.toLocaleLowerCase('ro').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query.toLocaleLowerCase('ro').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());

function useRecordActions() {
  const dispatch = useAppDispatch();
  const [update, { isLoading: updating }] = useUpdateEntityMutation();
  const [create, { isLoading: creating }] = useCreateEntityMutation();
  const notify = (message: string, tone: 'success' | 'error' = 'success') => dispatch(addToast({ message, tone }));
  const change = async (collection: Collection, id: string, changes: Record<string, unknown>, message: string) => {
    try { await update({ collection, id, changes }).unwrap(); notify(message); return true; }
    catch { notify('Modificarea nu a putut fi salvată. Încearcă din nou.', 'error'); return false; }
  };
  const add = async (collection: Collection, record: Record<string, unknown>, message: string) => {
    try { await create({ collection, record }).unwrap(); notify(message); return true; }
    catch { notify('Înregistrarea nu a putut fi adăugată. Încearcă din nou.', 'error'); return false; }
  };
  return { change, add, busy: updating || creating, notify };
}

function useFilters() {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const urlStatus = searchParams.get('status') ?? 'Toate';
  const [query, setQuery] = useState(urlQuery);
  const [status, setStatus] = useState(urlStatus);
  const [page, setPage] = useState(1);
  useEffect(() => { setQuery(urlQuery); }, [urlQuery]);
  useEffect(() => { setStatus(urlStatus); }, [urlStatus]);
  useEffect(() => { setPage(1); }, [query, status]);
  return { query, setQuery, status, setStatus, page, setPage };
}

function ResourceToolbar({ query, onQueryChange, status, onStatusChange, statuses, placeholder, onExport, extra, exportDisabled }: {
  query: string; onQueryChange: (value: string) => void; status: string; onStatusChange: (value: string) => void; statuses: string[]; placeholder: string; onExport: () => void; extra?: ReactNode; exportDisabled?: boolean;
}) {
  return <div className="resource-page__toolbar toolbar">
    <SearchField value={query} onChange={onQueryChange} placeholder={placeholder} />
    <div className="resource-page__filters filters">
      <Select aria-label="Filtrează după status" value={status} onChange={event => onStatusChange(event.target.value)}><option value="Toate">Toate statusurile</option>{statuses.map(value => <option key={value}>{value}</option>)}</Select>
      {extra}
      <Button variant="secondary" size="sm" icon={Download} onClick={onExport} disabled={exportDisabled} title="Exportă lista filtrată în format CSV">Exportă</Button>
    </div>
  </div>;
}

function ResultFooter({ count, page, onPageChange, noun }: { count: number; page: number; onPageChange: (page: number) => void; noun: string }) {
  return <div className="resource-page__footer"><span className="text-muted">{count} {noun} în total</span><Pagination page={page} total={count} pageSize={PAGE_SIZE} onChange={onPageChange} /></div>;
}

function SummaryPill({ label, value, tone = 'blue' }: { label: string; value: number; tone?: 'blue' | 'green' | 'pink' | 'orange' }) {
  return <div className={`resource-summary resource-summary--${tone}`}><span className="resource-summary__dot" /><strong>{value}</strong><span>{label}</span></div>;
}

function CandidateProfile({ candidate, applications, onClose }: { candidate: Candidate | undefined; applications: Application[]; onClose: () => void }) {
  const { change, busy } = useRecordActions();
  if (!candidate) return null;
  return <Modal open={!!candidate} onClose={onClose} title="Profil candidat" wide>
    <div className="profile-card">
      <div className="profile-card__identity"><Avatar name={candidate.name} color={candidate.color} size="lg" /><div><h3>{candidate.name}</h3><p>{candidate.role}</p><span className="profile-card__location"><MapPin size={14} />{candidate.city}</span></div><Badge tone={statusTone(candidate.status)}>{candidate.status}</Badge></div>
      <div className="profile-card__metrics"><div><strong>{candidate.response}%</strong><span>Rată de răspuns</span></div><div><strong>{candidate.attendance}%</strong><span>Prezență la interviuri</span></div><div><strong><Star size={16} />{candidate.rating.toFixed(1)}</strong><span>Evaluare candidat</span></div></div>
      <div className="profile-card__section"><h4>Date de contact</h4><div className="profile-card__contact"><a href={`mailto:${candidate.email}`}><Mail size={16} />{candidate.email}</a><a href={`tel:${candidate.phone}`}>{candidate.phone}</a><span className="text-muted">Membru din {formatDate(candidate.createdAt)}</span></div></div>
      <div className="profile-card__section"><h4>Competențe</h4><div className="profile-card__tags">{candidate.skills.map(skill => <Badge key={skill} tone="info">{skill}</Badge>)}</div></div>
      <div className="profile-card__section"><h4>Aplicări recente <span className="text-muted">({applications.length})</span></h4>{applications.length ? <div className="profile-card__applications">{applications.map(application => <div key={application.id}><div><strong>{application.job}</strong><span>{application.company} · {formatDate(application.createdAt)}</span></div><Badge tone={statusTone(application.status)}>{application.status}</Badge></div>)}</div> : <p className="text-muted">Candidatul nu are încă aplicări înregistrate.</p>}</div>
      <div className="profile-card__section"><Field label="Status cont"><Select value={candidate.status} disabled={busy} onChange={event => void change('candidates', candidate.id, { status: event.target.value }, 'Statusul candidatului a fost actualizat.')} aria-label="Status cont candidat">{candidateStatuses.map(status => <option key={status}>{status}</option>)}</Select></Field><p className="text-muted profile-card__hint">Un cont suspendat nu poate trimite aplicări noi.</p></div>
    </div>
  </Modal>;
}

export function CandidatesPage() {
  const { data, isLoading, error } = useGetDatabaseQuery();
  const filters = useFilters();
  const [city, setCity] = useState('Toate');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const candidates = data?.candidates ?? [];
  const filtered = useMemo(() => candidates.filter(candidate => contains(`${candidate.name} ${candidate.email} ${candidate.role} ${candidate.city}`, filters.query) && (filters.status === 'Toate' || candidate.status === filters.status) && (city === 'Toate' || candidate.city === city)), [candidates, filters.query, filters.status, city]);
  const page = Math.min(filters.page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const selected = candidates.find(candidate => candidate.id === selectedId);
  return <div className="resource-page resource-page--candidates">
    <PageHeader eyebrow="COMUNITATE" title="Candidați" description="Administrează toate conturile de candidați înregistrate pe platforma Jobbin." />
    <div className="resource-page__summary"><SummaryPill label="candidați înregistrați" value={candidates.length} /><SummaryPill label="conturi active" value={candidates.filter(item => item.status === 'Activ').length} tone="green" /><SummaryPill label="candidați noi" value={candidates.filter(item => item.status === 'Nou').length} tone="pink" /></div>
    <Panel className="resource-page__panel">
      <ResourceToolbar query={filters.query} onQueryChange={filters.setQuery} status={filters.status} onStatusChange={filters.setStatus} statuses={candidateStatuses} placeholder="Caută după nume, rol sau e-mail..." extra={<Select aria-label="Filtrează după oraș" value={city} onChange={event => { setCity(event.target.value); filters.setPage(1); }}><option value="Toate">Toate orașele</option>{[...new Set(candidates.map(candidate => candidate.city))].sort().map(value => <option key={value}>{value}</option>)}</Select>} exportDisabled={!filtered.length} onExport={() => downloadCsv('jobbin-candidati.csv', filtered.map(candidate => ({ Nume: candidate.name, Email: candidate.email, Telefon: candidate.phone, Rol: candidate.role, Oraș: candidate.city, Status: candidate.status, Evaluare: candidate.rating })))} />
      <DataState isLoading={isLoading} error={error}>
        {filtered.length ? <><div className="resource-page__table-scroll"><table className="data-table resource-table"><thead><tr><th>Candidat</th><th>Locație</th><th>Status</th><th>Răspuns</th><th>Evaluare</th><th aria-label="Acțiuni" /></tr></thead><tbody>{filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(candidate => <tr key={candidate.id}><td data-label="Candidat"><button className="resource-table__identity" onClick={() => setSelectedId(candidate.id)}><Avatar name={candidate.name} color={candidate.color} /><span><strong className="cell-title">{candidate.name}</strong><span className="cell-subtitle">{candidate.role}</span></span></button></td><td data-label="Locație"><span className="resource-table__location"><MapPin size={14} />{candidate.city}</span></td><td data-label="Status"><Badge tone={statusTone(candidate.status)}>{candidate.status}</Badge></td><td data-label="Răspuns"><div className="resource-table__progress"><span>{candidate.response}%</span><div><i style={{ width: `${candidate.response}%` }} /></div></div></td><td data-label="Evaluare"><span className="resource-table__rating"><Star size={14} fill="currentColor" />{candidate.rating.toFixed(1)}</span></td><td className="resource-table__actions"><Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => setSelectedId(candidate.id)} aria-label={`Vezi profilul ${candidate.name}`}>Profil</Button></td></tr>)}</tbody></table></div><ResultFooter count={filtered.length} page={page} onPageChange={filters.setPage} noun="candidați" /></> : <EmptyState icon={Users} title="Niciun candidat găsit" description="Încearcă un alt nume sau ajustează filtrele." />}
      </DataState>
    </Panel>
    <CandidateProfile candidate={selected} applications={(data?.applications ?? []).filter(application => application.candidateId === selectedId)} onClose={() => setSelectedId(null)} />
  </div>;
}

export function EmployersPage() {
  const { data, isLoading, error } = useGetDatabaseQuery();
  const filters = useFilters();
  const { change, busy } = useRecordActions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Employer | null>(null);
  const employers = data?.employers ?? [];
  const filtered = employers.filter(employer => contains(`${employer.name} ${employer.email} ${employer.city} ${employer.cui}`, filters.query) && (filters.status === 'Toate' || employer.status === filters.status));
  const page = Math.min(filters.page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const selected = employers.find(employer => employer.id === selectedId);
  const companyJobs = (data?.jobs ?? []).filter(job => job.employerId === selectedId);
  return <div className="resource-page resource-page--employers">
    <PageHeader eyebrow="PARTENERI" title="Angajatori" description="Verifică și administrează toate companiile înregistrate pe platforma Jobbin." />
    <div className="resource-page__summary"><SummaryPill label="companii înregistrate" value={employers.length} /><SummaryPill label="verificate" value={employers.filter(item => item.status === 'Verificat').length} tone="green" /><SummaryPill label="în verificare" value={employers.filter(item => item.status === 'În verificare').length} tone="orange" /></div>
    <Panel className="resource-page__panel"><ResourceToolbar query={filters.query} onQueryChange={filters.setQuery} status={filters.status} onStatusChange={filters.setStatus} statuses={employerStatuses} placeholder="Caută o companie, un CUI sau un oraș..." exportDisabled={!filtered.length} onExport={() => downloadCsv('jobbin-angajatori.csv', filtered.map(employer => ({ Companie: employer.name, CUI: employer.cui, Email: employer.email, Oraș: employer.city, Industrie: employer.industry, Abonament: employer.plan, Status: employer.status })))} />
      <DataState isLoading={isLoading} error={error}>{filtered.length ? <><div className="resource-page__table-scroll"><table className="data-table resource-table"><thead><tr><th>Companie</th><th>Industrie</th><th>Abonament</th><th>Joburi</th><th>Status</th><th aria-label="Acțiuni" /></tr></thead><tbody>{filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(employer => <tr key={employer.id}><td data-label="Companie"><button className="resource-table__identity" onClick={() => setSelectedId(employer.id)}><Avatar name={employer.name} color={employer.color} /><span><strong className="cell-title">{employer.name}</strong><span className="cell-subtitle">{employer.city} · CUI {employer.cui}</span></span></button></td><td data-label="Industrie">{employer.industry}</td><td data-label="Abonament"><Badge tone={employer.plan === 'Premium' ? 'info' : 'neutral'}>{employer.plan}</Badge></td><td data-label="Joburi"><strong>{(data?.jobs ?? []).filter(job => job.employerId === employer.id && job.status === 'Activ').length}</strong><span className="text-muted"> active</span></td><td data-label="Status"><Badge tone={statusTone(employer.status)}>{employer.status}</Badge></td><td className="resource-table__actions"><Button variant="ghost" size="sm" icon={Eye} aria-label={`Detalii ${employer.name}`} onClick={() => setSelectedId(employer.id)}>Detalii</Button></td></tr>)}</tbody></table></div><ResultFooter count={filtered.length} page={page} onPageChange={filters.setPage} noun="companii" /></> : <EmptyState icon={Building2} title="Nicio companie găsită" description="Ajustează filtrele pentru a vedea mai multe companii." />}</DataState>
    </Panel>
    <Modal open={!!selected && !confirmation} onClose={() => setSelectedId(null)} title="Detalii angajator" wide>{selected && <div className="profile-card"><div className="profile-card__identity"><Avatar name={selected.name} color={selected.color} size="lg" /><div><h3>{selected.name}</h3><p>{selected.industry}</p><span className="profile-card__location"><MapPin size={14} />{selected.city}</span></div><Badge tone={statusTone(selected.status)}>{selected.status}</Badge></div><div className="profile-card__details"><div><span>CUI</span><strong>{selected.cui}</strong></div><div><span>Abonament</span><strong>{selected.plan}</strong></div><div><span>Înregistrată la</span><strong>{formatDate(selected.createdAt)}</strong></div><div><span>E-mail</span><a href={`mailto:${selected.email}`}>{selected.email}</a></div></div><div className="profile-card__section"><h4>Joburi publicate <span className="text-muted">({companyJobs.length})</span></h4>{companyJobs.length ? <div className="profile-card__applications">{companyJobs.map(job => <div key={job.id}><div><strong>{job.title}</strong><span>{job.city} · {job.applications} aplicări</span></div><Badge tone={statusTone(job.status)}>{job.status}</Badge></div>)}</div> : <p className="text-muted">Compania nu a publicat încă joburi.</p>}</div><div className="profile-card__notice"><ShieldCheck size={20} /><p>Verifică datele companiei înainte de aprobare. Suspendarea oprește accesul companiei la publicarea joburilor noi.</p></div><div className="form-actions">{selected.status !== 'Verificat' && <Button icon={CheckCircle2} disabled={busy} onClick={() => void change('employers', selected.id, { status: 'Verificat' }, 'Compania a fost verificată.')}>Verifică angajatorul</Button>}{selected.status !== 'Suspendat' && <Button variant="danger" disabled={busy} onClick={() => setConfirmation(selected)}>Suspendă contul</Button>}{selected.status === 'Suspendat' && <Button variant="secondary" disabled={busy} onClick={() => void change('employers', selected.id, { status: 'În verificare' }, 'Compania a fost reactivată pentru verificare.')}>Reactivează contul</Button>}</div></div>}</Modal>
    <ConfirmDialog open={!!confirmation} onClose={() => setConfirmation(null)} title="Suspendă angajatorul" description={`Contul companiei ${confirmation?.name ?? ''} va fi suspendat. Poți reactiva contul oricând.`} busy={busy} onConfirm={async () => { if (confirmation && await change('employers', confirmation.id, { status: 'Suspendat' }, 'Contul companiei a fost suspendat.')) setConfirmation(null); }} />
  </div>;
}

type JobDraft = Pick<Job, 'title' | 'employerId' | 'city' | 'type' | 'salary' | 'category' | 'description'>;
const emptyJob: JobDraft = { title: '', employerId: '', city: '', type: 'Full-time', salary: '', category: 'IT & Tehnologie', description: '' };
const jobCategories = ['IT & Tehnologie', 'Vânzări', 'Marketing', 'Financiar', 'HoReCa', 'Logistică', 'Administrativ', 'Altele'];

export function JobsPage() {
  const { data, isLoading, error } = useGetDatabaseQuery();
  const filters = useFilters();
  const { change, add, busy } = useRecordActions();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<JobDraft>(emptyJob);
  const [formError, setFormError] = useState('');
  const [confirmation, setConfirmation] = useState<{ job: Job; status: Job['status'] } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setEditingId(null); setDraft({ ...emptyJob }); setFormError(''); setEditorOpen(true);
      setSearchParams(current => { const next = new URLSearchParams(current); next.delete('create'); return next; }, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const jobs = data?.jobs ?? [];
  const employers = data?.employers ?? [];
  const filtered = jobs.filter(job => contains(`${job.title} ${job.company} ${job.city} ${job.category}`, filters.query) && (filters.status === 'Toate' || job.status === filters.status));
  const page = Math.min(filters.page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  function openEditor(job?: Job) { setEditingId(job?.id ?? null); setDraft(job ? { title: job.title, employerId: job.employerId, city: job.city, type: job.type, salary: job.salary, category: job.category, description: job.description } : { ...emptyJob }); setFormError(''); setEditorOpen(true); }
  const setField = <K extends keyof JobDraft>(key: K, value: JobDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  async function saveJob(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.employerId || !draft.city.trim() || !draft.salary.trim() || draft.description.trim().length < 20) { setFormError('Completează toate câmpurile. Descrierea trebuie să aibă cel puțin 20 de caractere.'); return; }
    const employer = employers.find(item => item.id === draft.employerId);
    if (!employer || employer.status === 'Suspendat') { setFormError('Alege o companie cu un cont activ.'); return; }
    const record = { ...draft, title: draft.title.trim(), city: draft.city.trim(), description: draft.description.trim(), company: employer.name };
    const saved = editingId ? await change('jobs', editingId, record, 'Jobul a fost actualizat.') : await add('jobs', { ...record, id: crypto.randomUUID(), status: 'În verificare', applications: 0, createdAt: new Date().toISOString() }, 'Jobul a fost creat și trimis pentru verificare.');
    if (saved) setEditorOpen(false);
  }
  return <div className="resource-page resource-page--jobs">
    <PageHeader eyebrow="OPORTUNITĂȚI" title="Joburi" description="Moderează anunțurile din întreaga platformă și creează joburi în numele angajatorilor." action={<Button icon={Plus} onClick={() => openEditor()}>Adaugă job</Button>} />
    <div className="resource-page__summary"><SummaryPill label="joburi active" value={jobs.filter(item => item.status === 'Activ').length} tone="green" /><SummaryPill label="de aprobat" value={jobs.filter(item => item.status === 'În verificare').length} tone="orange" /><SummaryPill label="aplicări primite" value={jobs.reduce((total, job) => total + job.applications, 0)} /></div>
    <Panel className="resource-page__panel"><ResourceToolbar query={filters.query} onQueryChange={filters.setQuery} status={filters.status} onStatusChange={filters.setStatus} statuses={jobStatuses} placeholder="Caută un job, o companie sau o locație..." exportDisabled={!filtered.length} onExport={() => downloadCsv('jobbin-joburi.csv', filtered.map(job => ({ Titlu: job.title, Companie: job.company, Oraș: job.city, Tip: job.type, Salariu: job.salary, Status: job.status, Aplicări: job.applications })))} />
      <DataState isLoading={isLoading} error={error}>{filtered.length ? <><div className="resource-page__table-scroll"><table className="data-table resource-table"><thead><tr><th>Job</th><th>Locație & tip</th><th>Salariu</th><th>Aplicări</th><th>Status</th><th aria-label="Acțiuni" /></tr></thead><tbody>{filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(job => <tr key={job.id}><td data-label="Job"><button className="resource-table__identity" onClick={() => openEditor(job)}><span className="resource-table__job-icon"><BriefcaseBusiness size={19} /></span><span><strong className="cell-title">{job.title}</strong><span className="cell-subtitle">{job.company}</span></span></button></td><td data-label="Locație & tip"><span className="cell-title resource-table__location"><MapPin size={13} />{job.city}</span><span className="cell-subtitle">{job.type}</span></td><td data-label="Salariu">{job.salary}</td><td data-label="Aplicări"><span className="resource-table__count">{job.applications}</span></td><td data-label="Status"><Badge tone={statusTone(job.status)}>{job.status}</Badge></td><td className="resource-table__actions"><div className="resource-table__action-group"><Button variant="ghost" size="sm" icon={Pencil} aria-label={`Editează ${job.title}`} onClick={() => openEditor(job)} />{job.status === 'În verificare' && <Button variant="secondary" size="sm" icon={Check} onClick={() => setConfirmation({ job, status: 'Activ' })}>Aprobă</Button>}{job.status === 'Activ' && <Button variant="ghost" size="sm" onClick={() => setConfirmation({ job, status: 'Pauză' })}>Pauză</Button>}{job.status === 'Pauză' && <Button variant="secondary" size="sm" onClick={() => setConfirmation({ job, status: 'Activ' })}>Reactivează</Button>}{job.status !== 'Închis' && <Button variant="ghost" size="sm" icon={X} aria-label={`Închide ${job.title}`} onClick={() => setConfirmation({ job, status: 'Închis' })} />}</div></td></tr>)}</tbody></table></div><ResultFooter count={filtered.length} page={page} onPageChange={filters.setPage} noun="joburi" /></> : <EmptyState icon={BriefcaseBusiness} title="Niciun job găsit" description="Modifică filtrele sau adaugă o nouă oportunitate." />}</DataState>
    </Panel>
    <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editingId ? 'Editează jobul' : 'O nouă oportunitate'} wide><form onSubmit={saveJob} className="resource-form"><div className="profile-card__notice"><ShieldCheck size={20} /><p>Ca administrator Jobbin, creezi sau editezi acest job în numele angajatorului selectat. Joburile noi se publică pe platformă după aprobare.</p></div><div className="form-grid"><Field label="Titlul jobului"><Input required value={draft.title} onChange={event => setField('title', event.target.value)} placeholder="Ex. Specialist marketing" maxLength={120} /></Field><Field label="Companie"><Select required value={draft.employerId} onChange={event => setField('employerId', event.target.value)}><option value="">Alege compania</option>{employers.map(employer => <option key={employer.id} value={employer.id} disabled={employer.status === 'Suspendat'}>{employer.name}{employer.status === 'Suspendat' ? ' (suspendată)' : ''}</option>)}</Select></Field><Field label="Locație"><Input required value={draft.city} onChange={event => setField('city', event.target.value)} placeholder="Ex. Oradea / Remote" /></Field><Field label="Tip contract"><Select value={draft.type} onChange={event => setField('type', event.target.value as Job['type'])}>{['Full-time', 'Part-time', 'Contract'].map(type => <option key={type}>{type}</option>)}</Select></Field><Field label="Interval salarial" hint="Afișează suma netă și moneda."><Input required value={draft.salary} onChange={event => setField('salary', event.target.value)} placeholder="Ex. 4.500 – 6.000 lei" /></Field><Field label="Categorie"><Select value={draft.category} onChange={event => setField('category', event.target.value)}>{[...new Set([...jobCategories, draft.category])].map(category => <option key={category}>{category}</option>)}</Select></Field></div><Field label="Descrierea jobului" hint="Include responsabilitățile, cerințele și beneficiile."><textarea className="resource-form__textarea" required minLength={20} rows={5} value={draft.description} onChange={event => setField('description', event.target.value)} placeholder="Descrie oportunitatea pentru viitorii candidați..." /></Field>{formError && <p className="resource-form__error" role="alert">{formError}</p>}<div className="form-actions"><Button variant="secondary" type="button" onClick={() => setEditorOpen(false)}>Renunță</Button><Button type="submit" disabled={busy} icon={Check}>{busy ? 'Se salvează...' : editingId ? 'Salvează modificările' : 'Creează jobul'}</Button></div></form></Modal>
    <ConfirmDialog open={!!confirmation} onClose={() => setConfirmation(null)} busy={busy} title={confirmation?.status === 'Activ' ? 'Publică jobul' : confirmation?.status === 'Pauză' ? 'Pune jobul în pauză' : 'Închide jobul'} description={confirmation?.status === 'Activ' ? `„${confirmation?.job.title}” va fi disponibil candidaților.` : confirmation?.status === 'Pauză' ? `„${confirmation?.job.title}” nu va primi aplicări noi până la reactivare.` : `„${confirmation?.job.title ?? ''}” va fi marcat ca închis. Aplicările existente rămân disponibile.`} onConfirm={async () => { if (confirmation && await change('jobs', confirmation.job.id, { status: confirmation.status }, 'Statusul jobului a fost actualizat.')) setConfirmation(null); }} />
  </div>;
}

export function ApplicationsPage() {
  const { data, isLoading, error } = useGetDatabaseQuery();
  const filters = useFilters();
  const { change, busy } = useRecordActions();
  const [company, setCompany] = useState('Toate');
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const applications = data?.applications ?? [];
  const filtered = applications.filter(application => contains(`${application.candidate} ${application.job} ${application.company}`, filters.query) && (filters.status === 'Toate' || application.status === filters.status) && (company === 'Toate' || application.company === company));
  const page = Math.min(filters.page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  return <div className="resource-page resource-page--applications">
    <PageHeader eyebrow="RECRUTARE" title="Aplicări" description="Vizualizează aplicările din întreaga platformă și urmărește etapele de recrutare ale angajatorilor." />
    <div className="application-pipeline" aria-label="Etapele recrutării">{applicationStatuses.map((status, index) => <button key={status} className={`application-pipeline__stage${filters.status === status ? ' application-pipeline__stage--active' : ''}`} onClick={() => filters.setStatus(filters.status === status ? 'Toate' : status)} aria-pressed={filters.status === status}><span className={`application-pipeline__dot application-pipeline__dot--${index}`} /><span>{status}</span><strong>{applications.filter(application => application.status === status).length}</strong></button>)}</div>
    <Panel className="resource-page__panel"><ResourceToolbar query={filters.query} onQueryChange={filters.setQuery} status={filters.status} onStatusChange={filters.setStatus} statuses={applicationStatuses} placeholder="Caută un candidat, job sau angajator..." extra={<Select aria-label="Filtrează după companie" value={company} onChange={event => { setCompany(event.target.value); filters.setPage(1); }}><option value="Toate">Toate companiile</option>{[...new Set(applications.map(application => application.company))].sort().map(value => <option key={value}>{value}</option>)}</Select>} exportDisabled={!filtered.length} onExport={() => downloadCsv('jobbin-aplicari.csv', filtered.map(application => ({ Candidat: application.candidate, Job: application.job, Companie: application.company, Etapă: application.status, Data: formatDate(application.createdAt) })))} />
      <DataState isLoading={isLoading} error={error}>{filtered.length ? <><div className="resource-page__table-scroll"><table className="data-table resource-table"><thead><tr><th>Candidat</th><th>Oportunitate</th><th>Data aplicării</th><th>Etapă recrutare</th><th aria-label="Acțiuni" /></tr></thead><tbody>{filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(application => { const candidate = data?.candidates.find(item => item.id === application.candidateId); return <tr key={application.id}><td data-label="Candidat"><button className="resource-table__identity" onClick={() => setCandidateId(application.candidateId)}><Avatar name={application.candidate} color={candidate?.color} /><span><strong className="cell-title">{application.candidate}</strong><span className="cell-subtitle">{candidate?.role ?? 'Candidat Jobbin'}</span></span></button></td><td data-label="Oportunitate"><strong className="cell-title">{application.job}</strong><span className="cell-subtitle">{application.company}</span></td><td data-label="Data aplicării">{formatDate(application.createdAt)}</td><td data-label="Etapă recrutare"><Select value={application.status} disabled={busy} aria-label={`Etapa recrutării pentru ${application.candidate}, ${application.job}`} className="resource-table__stage-select" onChange={event => void change('applications', application.id, { status: event.target.value }, `Aplicarea pentru ${application.candidate} a fost actualizată.`)}>{applicationStatuses.map(status => <option key={status}>{status}</option>)}</Select></td><td className="resource-table__actions"><Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => setCandidateId(application.candidateId)} aria-label={`Profil candidat ${application.candidate}`}>Profil</Button></td></tr>; })}</tbody></table></div><ResultFooter count={filtered.length} page={page} onPageChange={filters.setPage} noun="aplicări" /></> : <EmptyState icon={Search} title="Nicio aplicare găsită" description="Selectează o altă etapă sau ajustează căutarea." />}</DataState>
    </Panel>
    <CandidateProfile candidate={data?.candidates.find(candidate => candidate.id === candidateId)} applications={applications.filter(application => application.candidateId === candidateId)} onClose={() => setCandidateId(null)} />
  </div>;
}

type EventDraft = Pick<Event, 'title' | 'date' | 'time' | 'city' | 'type' | 'description'>;
const emptyEvent: EventDraft = { title: '', date: '', time: '10:00', city: '', type: 'Interviu', description: '' };

export function EventsPage() {
  const { data, isLoading, error } = useGetDatabaseQuery();
  const filters = useFilters();
  const { change, add, busy } = useRecordActions();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft>(emptyEvent);
  const [formError, setFormError] = useState('');
  const [confirmation, setConfirmation] = useState<Event | null>(null);
  const events = data?.events ?? [];
  const filtered = events.filter(event => contains(`${event.title} ${event.city} ${event.type}`, filters.query) && (filters.status === 'Toate' || event.status === filters.status)).sort((a, b) => a.date.localeCompare(b.date));
  const page = Math.min(filters.page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  function openEditor(event?: Event) { setEditingId(event?.id ?? null); setDraft(event ? { title: event.title, date: event.date.slice(0, 10), time: event.time, city: event.city, type: event.type, description: event.description } : { ...emptyEvent }); setFormError(''); setEditorOpen(true); }
  const setField = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  async function saveEvent(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.date || !draft.time || !draft.city.trim() || draft.description.trim().length < 10) { setFormError('Completează toate câmpurile. Adaugă o descriere de cel puțin 10 caractere.'); return; }
    const record = { ...draft, title: draft.title.trim(), city: draft.city.trim(), description: draft.description.trim() };
    const saved = editingId ? await change('events', editingId, record, 'Evenimentul a fost actualizat.') : await add('events', { ...record, id: crypto.randomUUID(), attendees: 0, status: 'Programat' }, 'Evenimentul a fost creat.');
    if (saved) setEditorOpen(false);
  }
  return <div className="resource-page resource-page--events">
    <PageHeader eyebrow="AGENDA COMUNITĂȚII" title="Evenimente" description="Administrează evenimentele și întâlnirile întregii comunități Jobbin." action={<Button icon={Plus} onClick={() => openEditor()}>Adaugă eveniment</Button>} />
    <div className="resource-page__summary"><SummaryPill label="evenimente programate" value={events.filter(item => item.status === 'Programat').length} /><SummaryPill label="participanți înscriși" value={events.filter(item => item.status === 'Programat').reduce((total, event) => total + event.attendees, 0)} tone="pink" /><SummaryPill label="evenimente finalizate" value={events.filter(item => item.status === 'Finalizat').length} tone="green" /></div>
    <Panel className="resource-page__panel"><ResourceToolbar query={filters.query} onQueryChange={filters.setQuery} status={filters.status} onStatusChange={filters.setStatus} statuses={eventStatuses} placeholder="Caută un eveniment sau o locație..." exportDisabled={!filtered.length} onExport={() => downloadCsv('jobbin-evenimente.csv', filtered.map(event => ({ Eveniment: event.title, Dată: event.date, Oră: event.time, Locație: event.city, Tip: event.type, Participanți: event.attendees, Status: event.status })))} />
      <DataState isLoading={isLoading} error={error}>{filtered.length ? <><div className="event-list">{filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(event => { const date = new Date(`${event.date.slice(0, 10)}T12:00:00`); return <article className={`event-card${event.status === 'Anulat' ? ' event-card--cancelled' : ''}`} key={event.id}><div className="event-card__date"><span>{date.toLocaleDateString('ro-RO', { month: 'short' }).replace('.', '')}</span><strong>{date.getDate()}</strong><span>{date.toLocaleDateString('ro-RO', { weekday: 'short' })}</span></div><div className="event-card__content"><div className="event-card__badges"><Badge tone="info">{event.type}</Badge><Badge tone={statusTone(event.status)}>{event.status}</Badge></div><h3>{event.title}</h3><p>{event.description}</p><div className="event-card__meta"><span><Clock3 size={14} />{event.time}</span><span><MapPin size={14} />{event.city}</span><span><Users size={14} />{event.attendees} participanți</span></div></div><div className="event-card__actions"><Button variant="secondary" size="sm" icon={Pencil} aria-label={`Editează ${event.title}`} onClick={() => openEditor(event)}>Editează</Button>{event.status === 'Programat' && <><Button variant="ghost" size="sm" icon={CheckCircle2} onClick={() => void change('events', event.id, { status: 'Finalizat' }, 'Evenimentul a fost marcat ca finalizat.')} disabled={busy}>Finalizează</Button><Button variant="ghost" size="sm" icon={X} onClick={() => setConfirmation(event)}>Anulează</Button></>}{event.status === 'Anulat' && <Button variant="ghost" size="sm" onClick={() => void change('events', event.id, { status: 'Programat' }, 'Evenimentul a fost reprogramat.')} disabled={busy}>Reactivează</Button>}</div></article>; })}</div><ResultFooter count={filtered.length} page={page} onPageChange={filters.setPage} noun="evenimente" /></> : <EmptyState icon={CalendarDays} title="Agenda este liberă" description="Adaugă un eveniment nou sau ajustează filtrele." />}</DataState>
    </Panel>
    <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editingId ? 'Editează evenimentul' : 'Creează un eveniment'} wide><form className="resource-form" onSubmit={saveEvent}><Field label="Numele evenimentului"><Input required value={draft.title} onChange={event => setField('title', event.target.value)} placeholder="Ex. Întâlnire cu angajatorii din Oradea" maxLength={120} /></Field><div className="form-grid"><Field label="Data"><Input type="date" required value={draft.date} onChange={event => setField('date', event.target.value)} /></Field><Field label="Ora"><Input type="time" required value={draft.time} onChange={event => setField('time', event.target.value)} /></Field><Field label="Locație"><Input required value={draft.city} onChange={event => setField('city', event.target.value)} placeholder="Oraș, adresă sau Online" /></Field><Field label="Tip eveniment"><Select value={draft.type} onChange={event => setField('type', event.target.value as Event['type'])}>{['Interviu', 'Târg de joburi', 'Webinar'].map(type => <option key={type}>{type}</option>)}</Select></Field></div><Field label="Descriere"><textarea className="resource-form__textarea" required minLength={10} rows={4} value={draft.description} onChange={event => setField('description', event.target.value)} placeholder="Ce ar trebui să știe participanții?" /></Field>{formError && <p role="alert" className="resource-form__error">{formError}</p>}<div className="form-actions"><Button type="button" variant="secondary" onClick={() => setEditorOpen(false)}>Renunță</Button><Button type="submit" icon={Check} disabled={busy}>{busy ? 'Se salvează...' : editingId ? 'Salvează modificările' : 'Creează evenimentul'}</Button></div></form></Modal>
    <ConfirmDialog open={!!confirmation} onClose={() => setConfirmation(null)} title="Anulează evenimentul" description={`„${confirmation?.title ?? ''}” va fi marcat ca anulat. Poți reactiva evenimentul ulterior.`} busy={busy} onConfirm={async () => { if (confirmation && await change('events', confirmation.id, { status: 'Anulat' }, 'Evenimentul a fost anulat.')) setConfirmation(null); }} />
  </div>;
}
