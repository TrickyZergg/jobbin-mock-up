import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Bell, Check, CheckCheck, ChevronRight, CreditCard, Download, Headphones, Mail, Plus, RotateCcw, Send, Settings2, ShieldCheck, TrendingUp, Users, Wallet } from 'lucide-react';
import { Avatar, Badge, Button, EmptyState, Input, Select } from '../components/atoms';
import { ConfirmDialog, DataState, Field, Modal, PageHeader, Panel, SearchField, StatCard } from '../components/molecules';
import { useCreateEntityMutation, useGetDatabaseQuery, useMarkNotificationsReadMutation, useResetDemoMutation, useUpdateEntityMutation, useUpdateSettingsMutation } from '../services/adminApi';
import { useAppDispatch } from '../store/hooks';
import { addToast } from '../store/uiSlice';
import type { Admin, Notification, Settings, Ticket, Transaction } from '../types';
import { downloadCsv, formatCurrency, formatDate, statusTone } from '../utils';
import './OperationsPages.scss';

function useFeedback() {
  const dispatch = useAppDispatch();
  return (message: string, tone: 'success' | 'error' = 'success') => dispatch(addToast({ message, tone }));
}

const notificationLabels: Record<Notification['type'], string> = { candidate: 'Candidați', employer: 'Angajatori', job: 'Joburi', system: 'Sistem' };
const notificationIcons = { candidate: Users, employer: ShieldCheck, job: CreditCard, system: Bell };

export function NotificationsPage() {
  const { data, isLoading, error } = useGetDatabaseQuery();
  const [update, updateState] = useUpdateEntityMutation();
  const [create, createState] = useCreateEntityMutation();
  const [markAll, markAllState] = useMarkNotificationsReadMutation();
  const feedback = useFeedback();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', type: 'system' });
  const unread = data?.notifications.filter(item => !item.read).length ?? 0;
  const visible = data?.notifications.filter(item => (tab !== 'unread' || !item.read) && (category === 'all' || item.type === category) && `${item.title} ${item.description}`.toLocaleLowerCase('ro').includes(query.toLocaleLowerCase('ro'))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) ?? [];

  async function markRead(item: Notification) {
    try {
      await update({ collection: 'notifications', id: item.id, changes: { read: true } }).unwrap();
      feedback('Notificarea a fost marcată ca citită.');
    } catch { feedback('Notificarea nu a putut fi actualizată.', 'error'); }
  }

  async function markEverything() {
    try { await markAll().unwrap(); feedback('Toate notificările sunt acum citite.'); }
    catch { feedback('Notificările nu au putut fi actualizate.', 'error'); }
  }

  async function submitNotification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await create({ collection: 'notifications', record: { ...draft, title: draft.title.trim(), description: draft.description.trim(), read: false, createdAt: new Date().toISOString() } }).unwrap();
      setCompose(false); setDraft({ title: '', description: '', type: 'system' });
      feedback('Notificarea a fost adăugată în centrul de notificări.');
    } catch { feedback('Notificarea nu a putut fi adăugată.', 'error'); }
  }

  return <div className="notifications-page">
    <PageHeader eyebrow="LA ZI CU PLATFORMĂ" title="Notificări" description="Toate noutățile importante, într-un singur loc." action={<Button icon={Plus} onClick={() => setCompose(true)}>Adaugă notificare</Button>} />
    <DataState isLoading={isLoading} error={error}>
      <Panel className="notifications-page__panel">
        <div className="notifications-page__top">
          <div className="operations-tabs" role="tablist" aria-label="Starea notificărilor">
            <button className={`operations-tabs__tab ${tab === 'all' ? 'operations-tabs__tab--active' : ''}`} role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>Toate <span>{data?.notifications.length ?? 0}</span></button>
            <button className={`operations-tabs__tab ${tab === 'unread' ? 'operations-tabs__tab--active' : ''}`} role="tab" aria-selected={tab === 'unread'} onClick={() => setTab('unread')}>Necitite <span>{unread}</span></button>
          </div>
          <Button variant="ghost" size="sm" icon={CheckCheck} disabled={unread === 0 || markAllState.isLoading} onClick={markEverything}>Marchează toate ca citite</Button>
        </div>
        <div className="toolbar notifications-page__toolbar">
          <SearchField value={query} onChange={setQuery} placeholder="Caută o notificare..." />
          <Select aria-label="Categoria notificărilor" value={category} onChange={event => setCategory(event.target.value)}><option value="all">Toate categoriile</option>{Object.entries(notificationLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select>
        </div>
        <div className="notifications-page__list">
          {visible.map(item => {
            const Icon = notificationIcons[item.type];
            return <article className={`notification-item ${!item.read ? 'notification-item--unread' : ''}`} key={item.id}>
              <span className={`notification-item__icon notification-item__icon--${item.type}`}><Icon size={20} /></span>
              <div className="notification-item__content"><div className="notification-item__heading"><h3>{item.title}</h3>{!item.read && <span className="notification-item__dot" aria-label="Necitită" />}</div><p>{item.description}</p><div className="notification-item__meta"><Badge tone="neutral">{notificationLabels[item.type]}</Badge><span>{formatDate(item.createdAt)}</span></div></div>
              {!item.read && <Button variant="ghost" size="sm" icon={Check} disabled={updateState.isLoading} onClick={() => markRead(item)}>Marchează citită</Button>}
            </article>;
          })}
          {visible.length === 0 && <EmptyState icon={Bell} title="Totul este la zi" description="Nu există notificări pentru filtrele selectate." />}
        </div>
      </Panel>
    </DataState>
    <Modal open={compose} onClose={() => setCompose(false)} title="Adaugă o notificare">
      <form onSubmit={submitNotification} className="operations-form">
        <Field label="Titlu"><Input autoFocus required maxLength={100} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="De exemplu: Actualizare program de lucru" /></Field>
        <Field label="Categorie"><Select value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value })}>{Object.entries(notificationLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Field>
        <Field label="Mesaj"><textarea className="operations-textarea" required maxLength={600} rows={4} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="Scrie detaliile notificării..." /></Field>
        <div className="form-actions"><Button variant="secondary" type="button" onClick={() => setCompose(false)}>Anulează</Button><Button type="submit" icon={Plus} disabled={createState.isLoading || !draft.title.trim() || !draft.description.trim()}>Adaugă notificarea</Button></div>
      </form>
    </Modal>
  </div>;
}

export function WalletPage() {
  const { data, isLoading, error } = useGetDatabaseQuery();
  const [create, createState] = useCreateEntityMutation();
  const feedback = useFeedback();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [topUp, setTopUp] = useState(false);
  const [refund, setRefund] = useState<Transaction | null>(null);
  const [draft, setDraft] = useState<{ company: string; amount: string; type: 'Abonament' | 'Credite' }>({ company: '', amount: '250', type: 'Credite' });
  const transactions = data?.transactions ?? [];
  const completed = transactions.filter(item => item.status === 'Finalizată');
  const total = completed.reduce((sum, item) => sum + item.amount, 0);
  const revenue = completed.filter(item => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const refunded = Math.abs(completed.filter(item => item.amount < 0).reduce((sum, item) => sum + item.amount, 0));
  const pending = transactions.filter(item => item.status === 'În așteptare').reduce((sum, item) => sum + item.amount, 0);
  const visible = transactions.filter(item => (type === 'all' || item.type === type) && (status === 'all' || item.status === status) && `${item.company} ${item.id}`.toLocaleLowerCase('ro').includes(query.toLocaleLowerCase('ro'))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function exportTransactions() {
    downloadCsv('jobbin-tranzactii.csv', visible.map(item => ({ ID: item.id, Companie: item.company, Tip: item.type, 'Sumă (RON)': item.amount, Status: item.status, Data: item.createdAt.slice(0, 10) })));
    feedback(`${visible.length} tranzacții au fost exportate.`);
  }

  async function submitCredit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !draft.company) return;
    try {
      await create({ collection: 'transactions', record: { company: draft.company, amount: Math.round(amount * 100) / 100, type: draft.type, status: 'Finalizată', createdAt: new Date().toISOString() } }).unwrap();
      setTopUp(false); setDraft({ company: '', amount: '250', type: 'Credite' }); feedback(`Încasarea demonstrativă pentru ${draft.company} a fost înregistrată.`);
    } catch { feedback('Tranzacția nu a putut fi adăugată.', 'error'); }
  }

  async function submitRefund() {
    if (!refund || transactions.some(item => item.id === `refund-${refund.id}`)) return;
    try {
      await create({ collection: 'transactions', record: { id: `refund-${refund.id}`, company: refund.company, amount: -refund.amount, type: 'Rambursare', status: 'Finalizată', createdAt: new Date().toISOString() } }).unwrap();
      setRefund(null); feedback('Rambursarea demonstrativă a fost înregistrată.');
    } catch { feedback('Rambursarea nu a putut fi înregistrată.', 'error'); }
  }

  return <div className="wallet-page">
    <PageHeader eyebrow="FINANCIAR · PLATFORMA JOBBIN" title="Încasări" description="Centralizează plățile angajatorilor și rambursările din întreaga platformă Jobbin." action={<div className="operations-actions"><Button variant="secondary" icon={Download} onClick={exportTransactions} disabled={!visible.length}>Exportă</Button><Button icon={Plus} onClick={() => setTopUp(true)}>Înregistrează încasare</Button></div>} />
    <DataState isLoading={isLoading} error={error}>
      <div className="operations-stats"><StatCard label="Încasări nete" value={formatCurrency(total)} icon={Wallet} /><StatCard label="Încasări totale" value={formatCurrency(revenue)} icon={TrendingUp} /><StatCard label="În așteptare" value={formatCurrency(pending)} icon={CreditCard} tone="warning" /><StatCard label="Rambursări" value={formatCurrency(refunded)} icon={RotateCcw} tone="pink" /></div>
      <Panel className="wallet-page__panel">
        <div className="operations-panel-heading"><div><h2>Istoric tranzacții</h2><p>{transactions.length} tranzacții înregistrate · valori în RON</p></div><Badge tone="info">Mediu demonstrativ</Badge></div>
        <div className="toolbar"><SearchField value={query} onChange={setQuery} placeholder="Caută companie sau ID..." /><div className="filters"><Select aria-label="Tipul tranzacției" value={type} onChange={event => setType(event.target.value)}><option value="all">Toate tipurile</option><option>Abonament</option><option>Credite</option><option>Rambursare</option></Select><Select aria-label="Starea tranzacției" value={status} onChange={event => setStatus(event.target.value)}><option value="all">Toate stările</option><option>Finalizată</option><option>În așteptare</option></Select></div></div>
        {visible.length ? <div className="operations-table-scroll"><table className="data-table"><thead><tr><th>Companie / tranzacție</th><th>Tip</th><th>Sumă</th><th>Status</th><th>Data</th><th><span className="operations-visually-hidden">Acțiuni</span></th></tr></thead><tbody>{visible.map(item => {
          const wasRefunded = transactions.some(other => other.id === `refund-${item.id}`);
          return <tr key={item.id}><td><span className="cell-title">{item.company}</span><span className="cell-subtitle">#{item.id.length > 18 ? item.id.slice(0, 18) : item.id}</span></td><td>{item.type}</td><td className={`wallet-page__amount ${item.amount < 0 ? 'wallet-page__amount--negative' : ''}`}>{item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}</td><td><Badge tone={item.status === 'Finalizată' ? 'success' : 'warning'}>{item.status}</Badge></td><td className="text-muted">{formatDate(item.createdAt)}</td><td>{item.amount > 0 && item.status === 'Finalizată' && (wasRefunded ? <Badge tone="neutral">Rambursată</Badge> : <Button variant="ghost" size="sm" onClick={() => setRefund(item)}>Rambursează</Button>)}</td></tr>;
        })}</tbody></table></div> : <EmptyState icon={Wallet} title="Nicio tranzacție găsită" description="Modifică filtrele sau înregistrează o încasare pentru un angajator." />}
      </Panel>
    </DataState>
    <Modal open={topUp} onClose={() => setTopUp(false)} title="Înregistrează încasare">
      <form onSubmit={submitCredit} className="operations-form"><div className="operations-note"><CreditCard size={20} /><p>Adaugă o încasare demonstrativă de la un angajator Jobbin. Nu se efectuează o plată reală.</p></div><Field label="Angajator"><Select required value={draft.company} onChange={event => setDraft({ ...draft, company: event.target.value })}><option value="">Selectează angajatorul</option>{data?.employers.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</Select></Field><Field label="Tip încasare"><Select value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value as 'Abonament' | 'Credite' })}><option>Abonament</option><option>Credite</option></Select></Field><Field label="Sumă (RON)"><Input type="number" required min="1" max="100000" step="0.01" value={draft.amount} onChange={event => setDraft({ ...draft, amount: event.target.value })} /></Field><div className="form-actions"><Button type="button" variant="secondary" onClick={() => setTopUp(false)}>Anulează</Button><Button type="submit" disabled={createState.isLoading || !draft.company || Number(draft.amount) <= 0}>Înregistrează încasarea</Button></div></form>
    </Modal>
    <ConfirmDialog open={!!refund} onClose={() => setRefund(null)} onConfirm={submitRefund} title="Confirmă rambursarea" description={`Se va înregistra o rambursare demonstrativă de ${formatCurrency(refund?.amount ?? 0)} pentru ${refund?.company ?? ''}. Încasările nete vor fi actualizate.`} busy={createState.isLoading} />
  </div>;
}

export function SupportPage() {
  const { data, isLoading, error } = useGetDatabaseQuery();
  const [update, updateState] = useUpdateEntityMutation();
  const [create, createState] = useCreateEntityMutation();
  const feedback = useFeedback();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [newTicket, setNewTicket] = useState(false);
  const [draft, setDraft] = useState({ author: '', email: '', subject: '', message: '', priority: 'Medie' });
  const selected = data?.tickets.find(item => item.id === selectedId);
  const tickets = data?.tickets ?? [];
  const visible = tickets.filter(item => (status === 'all' || item.status === status) && (priority === 'all' || item.priority === priority) && `${item.subject} ${item.author} ${item.email}`.toLocaleLowerCase('ro').includes(query.toLocaleLowerCase('ro'))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function openTicket(item: Ticket) { setSelectedId(item.id); setReply(item.reply); }

  async function saveReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    try {
      await update({ collection: 'tickets', id: selected.id, changes: { reply: reply.trim(), status: selected.status === 'Rezolvat' ? 'Rezolvat' : 'În lucru' } }).unwrap();
      feedback('Răspunsul a fost salvat în tichet.');
    } catch { feedback('Răspunsul nu a putut fi salvat.', 'error'); }
  }

  async function changeStatus(nextStatus: Ticket['status']) {
    if (!selected) return;
    try { await update({ collection: 'tickets', id: selected.id, changes: { status: nextStatus } }).unwrap(); feedback(nextStatus === 'Rezolvat' ? 'Tichetul a fost rezolvat.' : 'Tichetul a fost redeschis.'); }
    catch { feedback('Tichetul nu a putut fi actualizat.', 'error'); }
  }

  async function submitTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await create({ collection: 'tickets', record: { ...draft, subject: draft.subject.trim(), author: draft.author.trim(), message: draft.message.trim(), status: 'Deschis', reply: '', createdAt: new Date().toISOString() } }).unwrap();
      setNewTicket(false); setDraft({ author: '', email: '', subject: '', message: '', priority: 'Medie' }); feedback('Tichetul a fost creat.');
    } catch { feedback('Tichetul nu a putut fi creat.', 'error'); }
  }

  return <div className="support-page">
    <PageHeader eyebrow="APROAPE DE UTILIZATORI" title="Centru de suport" description="Transformă întrebările în răspunsuri și experiențe mai bune." action={<Button icon={Plus} onClick={() => setNewTicket(true)}>Tichet nou</Button>} />
    <DataState isLoading={isLoading} error={error}>
      <div className="operations-stats operations-stats--three"><StatCard label="Tichete deschise" value={tickets.filter(item => item.status === 'Deschis').length} icon={Headphones} /><StatCard label="În lucru" value={tickets.filter(item => item.status === 'În lucru').length} icon={Mail} tone="warning" /><StatCard label="Rezolvate" value={tickets.filter(item => item.status === 'Rezolvat').length} icon={CheckCheck} tone="success" /></div>
      <Panel><div className="operations-panel-heading"><div><h2>Solicitări de asistență</h2><p>Gestionează conversațiile cu utilizatorii Jobbin.</p></div></div><div className="toolbar"><SearchField value={query} onChange={setQuery} placeholder="Caută subiect, nume sau e-mail..." /><div className="filters"><Select aria-label="Starea tichetului" value={status} onChange={event => setStatus(event.target.value)}><option value="all">Toate stările</option><option>Deschis</option><option>În lucru</option><option>Rezolvat</option></Select><Select aria-label="Prioritatea tichetului" value={priority} onChange={event => setPriority(event.target.value)}><option value="all">Toate prioritățile</option><option>Ridicată</option><option>Medie</option><option>Scăzută</option></Select></div></div>
        {visible.length ? <div className="support-page__tickets">{visible.map(item => <button className="support-ticket" key={item.id} onClick={() => openTicket(item)}><Avatar name={item.author} size="md" /><span className="support-ticket__body"><span className="support-ticket__title">{item.subject}</span><span className="support-ticket__author">{item.author} · {formatDate(item.createdAt)}</span><span className="support-ticket__preview">{item.message}</span></span><span className="support-ticket__badges"><Badge tone={statusTone(item.status)}>{item.status}</Badge><Badge tone={item.priority === 'Ridicată' ? 'danger' : item.priority === 'Medie' ? 'warning' : 'neutral'}>{item.priority}</Badge></span><ChevronRight className="support-ticket__arrow" size={19} /></button>)}</div> : <EmptyState icon={Headphones} title="Niciun tichet găsit" description="Încearcă o altă căutare sau modifică filtrele." />}
      </Panel>
    </DataState>
    <Modal open={!!selected} onClose={() => setSelectedId(null)} title={selected?.subject ?? 'Detalii tichet'} wide>
      {selected && <div className="ticket-detail"><div className="ticket-detail__identity"><Avatar name={selected.author} /><div><strong>{selected.author}</strong><span>{selected.email}</span></div><Badge tone={statusTone(selected.status)}>{selected.status}</Badge></div><div className="ticket-detail__message"><span>Solicitare · {formatDate(selected.createdAt)}</span><p>{selected.message}</p></div>{selected.reply && <div className="ticket-detail__message ticket-detail__message--reply"><span>Ultimul răspuns salvat</span><p>{selected.reply}</p></div>}<form className="operations-form" onSubmit={saveReply}><Field label="Răspunsul tău" hint="Răspunsul este salvat în demonstrație."><textarea className="operations-textarea" rows={5} required maxLength={2000} value={reply} onChange={event => setReply(event.target.value)} placeholder="Scrie un răspuns clar și prietenos..." /></Field><div className="form-actions"><Button type="button" variant="secondary" disabled={updateState.isLoading} onClick={() => changeStatus(selected.status === 'Rezolvat' ? 'Deschis' : 'Rezolvat')}>{selected.status === 'Rezolvat' ? 'Redeschide tichetul' : 'Marchează rezolvat'}</Button><Button type="submit" icon={Send} disabled={updateState.isLoading || !reply.trim()}>Salvează răspunsul</Button></div></form></div>}
    </Modal>
    <Modal open={newTicket} onClose={() => setNewTicket(false)} title="Creează un tichet" wide><form onSubmit={submitTicket} className="operations-form"><div className="form-grid"><Field label="Nume utilizator"><Input required value={draft.author} onChange={event => setDraft({ ...draft, author: event.target.value })} /></Field><Field label="E-mail"><Input required type="email" value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })} /></Field></div><Field label="Subiect"><Input required maxLength={120} value={draft.subject} onChange={event => setDraft({ ...draft, subject: event.target.value })} /></Field><Field label="Prioritate"><Select value={draft.priority} onChange={event => setDraft({ ...draft, priority: event.target.value })}><option>Scăzută</option><option>Medie</option><option>Ridicată</option></Select></Field><Field label="Mesaj"><textarea className="operations-textarea" required maxLength={2000} rows={4} value={draft.message} onChange={event => setDraft({ ...draft, message: event.target.value })} /></Field><div className="form-actions"><Button type="button" variant="secondary" onClick={() => setNewTicket(false)}>Anulează</Button><Button type="submit" disabled={createState.isLoading || !draft.author.trim() || !draft.subject.trim() || !draft.message.trim()}>Creează tichetul</Button></div></form></Modal>
  </div>;
}

const defaultProfile = { name: '', email: '', phone: '' };
const preferences: { key: keyof Pick<Settings, 'jobApproval' | 'employerVerification' | 'emailNotifications' | 'weeklyReport' | 'twoFactor'>; title: string; description: string; section: 'platform' | 'notifications' | 'security' }[] = [
  { key: 'jobApproval', title: 'Aprobarea manuală a joburilor', description: 'Toate joburile noi din Jobbin trebuie aprobate înainte de publicare.', section: 'platform' },
  { key: 'employerVerification', title: 'Verificarea angajatorilor', description: 'Verifică fiecare angajator nou înainte de activarea contului Jobbin.', section: 'platform' },
  { key: 'emailNotifications', title: 'Notificări prin e-mail', description: 'Alerte pentru echipa de administrare despre activitatea întregii platforme.', section: 'notifications' },
  { key: 'weeklyReport', title: 'Raport săptămânal', description: 'Rezumat săptămânal al candidaților, angajatorilor și joburilor din Jobbin.', section: 'notifications' },
  { key: 'twoFactor', title: 'Autentificare în doi pași', description: 'Preferință de securitate pentru accesul administratorilor în panoul Jobbin.', section: 'security' },
];

export function SettingsPage() {
  const { data, isLoading, error } = useGetDatabaseQuery();
  const [updateSettings, settingsState] = useUpdateSettingsMutation();
  const [create, createState] = useCreateEntityMutation();
  const [update, updateState] = useUpdateEntityMutation();
  const [reset, resetState] = useResetDemoMutation();
  const feedback = useFeedback();
  const [profile, setProfile] = useState(defaultProfile);
  const [invite, setInvite] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '', role: 'Moderator' });
  useEffect(() => { if (data?.settings) { const { name, email, phone } = data.settings; setProfile({ name, email, phone }); } }, [data?.settings.name, data?.settings.email, data?.settings.phone]);
  const profileChanged = data?.settings && Object.entries(profile).some(([key, value]) => value !== data.settings[key as keyof typeof profile]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { await updateSettings({ ...profile, name: profile.name.trim() }).unwrap(); feedback('Profilul administratorului Jobbin a fost actualizat.'); }
    catch { feedback('Profilul nu a putut fi salvat.', 'error'); }
  }

  async function toggle(key: typeof preferences[number]['key']) {
    if (!data) return;
    try { await updateSettings({ [key]: !data.settings[key] }).unwrap(); feedback('Preferința a fost actualizată.'); }
    catch { feedback('Preferința nu a putut fi actualizată.', 'error'); }
  }

  async function inviteAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (data?.admins.some(item => item.email.toLowerCase() === draft.email.trim().toLowerCase())) { feedback('Există deja un coleg cu această adresă de e-mail.', 'error'); return; }
    try {
      await create({ collection: 'admins', record: { ...draft, name: draft.name.trim(), email: draft.email.trim(), status: 'Invitat' } }).unwrap();
      setInvite(false); setDraft({ name: '', email: '', role: 'Moderator' }); feedback('Invitația a fost salvată în demonstrație.');
    } catch { feedback('Colegul nu a putut fi adăugat.', 'error'); }
  }

  async function changeRole(admin: Admin, role: string) {
    try { await update({ collection: 'admins', id: admin.id, changes: { role } }).unwrap(); feedback(`Rolul pentru ${admin.name} a fost actualizat.`); }
    catch { feedback('Rolul nu a putut fi actualizat.', 'error'); }
  }

  async function resetDemo() {
    try { await reset().unwrap(); setResetOpen(false); feedback('Demonstrația a revenit la datele inițiale.'); }
    catch { feedback('Datele nu au putut fi resetate.', 'error'); }
  }

  function preferenceGroup(section: typeof preferences[number]['section']) {
    return <div className="settings-page__preferences">{preferences.filter(item => item.section === section).map(item => <div key={item.key} className="setting-toggle"><div><h3>{item.title}</h3><p>{item.description}</p></div><button type="button" role="switch" aria-checked={!!data?.settings[item.key]} aria-label={item.title} disabled={settingsState.isLoading} className={`setting-toggle__switch ${data?.settings[item.key] ? 'setting-toggle__switch--on' : ''}`} onClick={() => toggle(item.key)}><span /></button></div>)}</div>;
  }

  return <div className="settings-page">
    <PageHeader eyebrow="ADMINISTRAREA PLATFORMEI" title="Setări platformă" description="Configurează regulile și echipa de administrare pentru întreaga platformă Jobbin." />
    <DataState isLoading={isLoading} error={error}>
      <div className="settings-page__layout">
        <div className="settings-page__main">
          <Panel><div className="operations-panel-heading"><div><h2>Profilul administratorului Jobbin</h2><p>Contul tău de administrator al întregii platforme.</p></div><Avatar name={profile.name || 'Admin'} size="lg" /></div><form onSubmit={saveProfile} className="operations-form"><div className="form-grid"><Field label="Nume complet"><Input required maxLength={100} value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} /></Field><Field label="E-mail"><Input required type="email" value={profile.email} onChange={event => setProfile({ ...profile, email: event.target.value })} /></Field><Field label="Telefon"><Input required type="tel" maxLength={25} value={profile.phone} onChange={event => setProfile({ ...profile, phone: event.target.value })} /></Field><Field label="Operatorul platformei"><Input readOnly value="GETJOBBIN S.R.L." /></Field></div><div className="form-actions"><Button variant="secondary" type="button" disabled={!profileChanged} onClick={() => { if (data) { const { name, email, phone } = data.settings; setProfile({ name, email, phone }); } }}>Renunță la modificări</Button><Button type="submit" icon={Check} disabled={!profileChanged || settingsState.isLoading || !profile.name.trim() || !profile.phone.trim()}>Salvează modificările</Button></div></form></Panel>
          <Panel><div className="operations-panel-heading"><div><h2>Echipa de administrare Jobbin</h2><p>{data?.admins.length ?? 0} membri cu roluri la nivelul întregii platforme</p></div><Button variant="secondary" size="sm" icon={Plus} onClick={() => setInvite(true)}>Invită în echipa Jobbin</Button></div><div className="settings-page__team">{data?.admins.map(admin => <div className="team-member" key={admin.id}><Avatar name={admin.name} /><div className="team-member__identity"><strong>{admin.name}</strong><span>{admin.email}</span></div><Badge tone={admin.status === 'Activ' ? 'success' : 'warning'}>{admin.status}</Badge><Select aria-label={`Rolul lui ${admin.name}`} value={admin.role} disabled={updateState.isLoading || (admin.role === 'Administrator' && data.admins.filter(item => item.role === 'Administrator' && item.status === 'Activ').length <= 1 && admin.status === 'Activ')} onChange={event => changeRole(admin, event.target.value)}><option>Administrator</option><option>Moderator</option><option>Suport</option></Select></div>)}</div><p className="settings-page__team-note">Roluri pentru administrarea întregii platforme: Administrator, Moderator și Suport. Cel puțin un administrator activ trebuie păstrat în echipă.</p></Panel>
          <Panel className="settings-page__reset"><div><h2>Un nou început pentru prezentare</h2><p>Restabilește toate datele inițiale. Modificările făcute în demonstrație vor fi eliminate.</p></div><Button variant="danger" icon={RotateCcw} onClick={() => setResetOpen(true)}>Resetează demonstrația</Button></Panel>
        </div>
        <div className="settings-page__aside"><Panel><div className="operations-panel-heading"><div><h2><Settings2 size={18} /> Reguli Jobbin</h2><p>Politici globale pentru toți utilizatorii.</p></div></div>{preferenceGroup('platform')}</Panel><Panel><div className="operations-panel-heading"><div><h2><Bell size={18} /> Alertele administratorilor</h2><p>Noutăți despre întreaga platformă.</p></div></div>{preferenceGroup('notifications')}</Panel><Panel><div className="operations-panel-heading"><div><h2><ShieldCheck size={18} /> Acces administrativ</h2><p>Protecția panoului global Jobbin.</p></div></div>{preferenceGroup('security')}<p className="settings-page__team-note">Activarea autentificării și trimiterea mesajelor vor fi disponibile după conectarea serviciilor reale.</p></Panel></div>
      </div>
    </DataState>
    <Modal open={invite} onClose={() => setInvite(false)} title="Invită în echipa de administrare Jobbin"><form className="operations-form" onSubmit={inviteAdmin}><Field label="Nume complet"><Input autoFocus required maxLength={100} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></Field><Field label="E-mail"><Input type="email" required value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })} /></Field><Field label="Rol în administrarea platformei"><Select value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value })}><option>Administrator</option><option>Moderator</option><option>Suport</option></Select></Field><div className="operations-note"><Mail size={20} /><p>Invitația în echipa Jobbin rămâne în demonstrație; nu se trimite un e-mail.</p></div><div className="form-actions"><Button variant="secondary" type="button" onClick={() => setInvite(false)}>Anulează</Button><Button type="submit" disabled={createState.isLoading || !draft.name.trim()}>Salvează invitația</Button></div></form></Modal>
    <ConfirmDialog open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={resetDemo} title="Resetezi demonstrația?" description="Toate înregistrările și setările vor reveni la starea inițială. Modificările din această demonstrație se vor pierde." busy={resetState.isLoading} />
  </div>;
}

// Keep the presentation's date deterministic so the same seeded data can be reviewed at any time.
const reportingDate = new Date('2026-10-12T23:59:59+03:00');
const dayMs = 86_400_000;

export function ReportsPage() {
  const { data, isLoading, error } = useGetDatabaseQuery();
  const feedback = useFeedback();
  const [period, setPeriod] = useState('30');
  const report = useMemo(() => {
    const timestamps = data ? [...data.candidates, ...data.applications, ...data.jobs, ...data.transactions].map(item => new Date(item.createdAt).getTime()) : [];
    const earliest = timestamps.length ? Math.min(...timestamps) : reportingDate.getTime() - 29 * dayMs;
    const end = Math.max(reportingDate.getTime(), ...timestamps);
    const start = period === 'all' ? earliest : end - (Number(period) - 1) * dayMs;
    const inPeriod = (item: { createdAt: string }) => { const time = new Date(item.createdAt).getTime(); return time >= start && time <= end; };
    const candidates = data?.candidates.filter(inPeriod) ?? [];
    const applications = data?.applications.filter(inPeriod) ?? [];
    const jobs = data?.jobs.filter(inPeriod) ?? [];
    const transactions = data?.transactions.filter(item => inPeriod(item) && item.status === 'Finalizată') ?? [];
    const statuses = ['Nouă', 'În evaluare', 'Interviu', 'Angajat', 'Respins'] as const;
    const funnel = statuses.map(label => ({ label, count: applications.filter(item => item.status === label).length }));
    const cities = Object.entries(candidates.reduce<Record<string, number>>((acc, item) => { acc[item.city] = (acc[item.city] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
    const binWidth = (end - start + 1) / 6;
    const bins = Array.from({ length: 6 }, (_, index) => {
      const binStart = start + binWidth * index;
      const binEnd = index === 5 ? end + 1 : start + binWidth * (index + 1);
      const count = (items: { createdAt: string }[]) => items.filter(item => { const timestamp = new Date(item.createdAt).getTime(); return timestamp >= binStart && timestamp < binEnd; }).length;
      return { label: new Date(binStart).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }), candidates: count(candidates), applications: count(applications) };
    });
    return { candidates, applications, jobs, transactions, funnel, cities, bins, revenue: transactions.reduce((sum, item) => sum + item.amount, 0), start, end };
  }, [data, period]);
  const hired = report.applications.filter(item => item.status === 'Angajat').length;
  const conversion = report.applications.length ? hired / report.applications.length * 100 : 0;
  const maximum = Math.max(4, Math.ceil(Math.max(0, ...report.bins.flatMap(item => [item.candidates, item.applications])) / 4) * 4);

  function exportReport() {
    const rows: Record<string, unknown>[] = [
      { Indicator: 'Candidați noi', Valoare: report.candidates.length },
      { Indicator: 'Aplicări', Valoare: report.applications.length },
      { Indicator: 'Joburi create', Valoare: report.jobs.length },
      { Indicator: 'Candidați angajați', Valoare: hired },
      { Indicator: 'Rată de angajare (%)', Valoare: Number(conversion.toFixed(1)) },
      { Indicator: 'Încasări nete (RON)', Valoare: report.revenue },
      ...report.funnel.map(item => ({ Indicator: `Aplicări: ${item.label}`, Valoare: item.count })),
      ...report.cities.map(([city, count]) => ({ Indicator: `Candidați: ${city}`, Valoare: count })),
    ].map(item => ({ ...item, 'De la': new Date(report.start).toISOString().slice(0, 10), 'Până la': new Date(report.end).toISOString().slice(0, 10) }));
    downloadCsv('jobbin-raport.csv', rows); feedback('Raportul pentru perioada selectată a fost exportat.');
  }

  return <div className="reports-page">
    <PageHeader eyebrow="DATE CARE CONTEAZĂ" title="Rapoarte și statistici" description="Înțelege evoluția platformei și oportunitățile de creștere." action={<Button variant="secondary" icon={Download} onClick={exportReport} disabled={!data}>Exportă raportul</Button>} />
    <DataState isLoading={isLoading} error={error}>
      <div className="reports-page__period"><span><BarChart3 size={17} /> {formatDate(new Date(report.start).toISOString())} – {formatDate(new Date(report.end).toISOString())}</span><div className="operations-tabs" role="tablist" aria-label="Perioada raportului">{[['30', '30 de zile'], ['90', '90 de zile'], ['all', 'Tot istoricul']].map(([value, label]) => <button key={value} role="tab" aria-selected={period === value} className={`operations-tabs__tab ${period === value ? 'operations-tabs__tab--active' : ''}`} onClick={() => setPeriod(value)}>{label}</button>)}</div></div>
      <div className="operations-stats"><StatCard label="Candidați noi" value={report.candidates.length} icon={Users} /><StatCard label="Aplicări la joburi" value={report.applications.length} icon={Send} tone="pink" /><StatCard label="Rată de angajare" value={`${conversion.toLocaleString('ro-RO', { maximumFractionDigits: 1 })}%`} icon={CheckCheck} tone="success" /><StatCard label="Încasări nete" value={formatCurrency(report.revenue)} icon={Wallet} /></div>
      <Panel className="reports-page__evolution"><div className="operations-panel-heading"><div><h2>Evoluția platformei</h2><p>Înscrieri și aplicări în perioada selectată.</p></div><div className="reports-page__legend"><span><i />Candidați noi</span><span><i />Aplicări</span></div></div><div className="reports-page__chart"><svg viewBox="0 0 640 235" role="img" aria-label="Grafic cu numărul de candidați noi și aplicări, grupat în șase intervale"><title>Evoluția candidaților și aplicărilor</title>{[0, 1, 2, 3, 4].map(index => <g key={index}><line x1="35" x2="630" y1={195 - index * 42} y2={195 - index * 42} stroke="#eef0f6" /><text x="27" y={199 - index * 42} textAnchor="end" className="reports-page__chart-label">{Math.round(maximum * index / 4)}</text></g>)}{report.bins.map((item, index) => <g key={index}><rect x={58 + index * 98} y={195 - item.candidates / maximum * 168} width="24" height={item.candidates / maximum * 168} rx="5" fill="#4866ff"><title>{item.label}: {item.candidates} candidați noi</title></rect><rect x={86 + index * 98} y={195 - item.applications / maximum * 168} width="24" height={item.applications / maximum * 168} rx="5" fill="#ff3976"><title>{item.label}: {item.applications} aplicări</title></rect><text x={84 + index * 98} y="223" textAnchor="middle" className="reports-page__chart-label">{item.label}</text></g>)}</svg></div><div className="reports-page__chart-summary"><span><strong>{report.candidates.length}</strong> candidați noi</span><span><strong>{report.applications.length}</strong> aplicări</span><span><strong>{report.jobs.length}</strong> joburi create</span></div></Panel>
      <div className="reports-page__bottom"><Panel><div className="operations-panel-heading"><div><h2>Statusul aplicărilor</h2><p>Distribuția celor {report.applications.length} aplicări din perioadă.</p></div></div><div className="reports-page__funnel">{report.funnel.map(item => <div className="report-progress" key={item.label}><div><span>{item.label}</span><strong>{item.count}<small>{report.applications.length ? Math.round(item.count / report.applications.length * 100) : 0}%</small></strong></div><span className="report-progress__track"><span style={{ width: `${report.applications.length ? item.count / report.applications.length * 100 : 0}%` }} /></span></div>)}</div><p className="reports-page__footnote">Rata de angajare = aplicări cu status „Angajat” / total aplicări.</p></Panel><Panel><div className="operations-panel-heading"><div><h2>De unde vin candidații</h2><p>Orașele cu cele mai multe înscrieri noi.</p></div></div>{report.cities.length ? <div className="reports-page__cities">{report.cities.slice(0, 6).map(([city, count], index) => <div className="report-city" key={city}><span className="report-city__rank">{String(index + 1).padStart(2, '0')}</span><div><strong>{city}</strong><span>{count === 1 ? '1 candidat nou' : `${count} candidați noi`}</span></div><span className="report-city__percentage">{Math.round(count / report.candidates.length * 100)}%</span></div>)}</div> : <EmptyState title="Nicio înscriere în această perioadă" icon={Users} />}</Panel></div>
    </DataState>
  </div>;
}

