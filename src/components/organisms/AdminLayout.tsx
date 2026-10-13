import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UsersRound, Building2, BriefcaseBusiness, ClipboardList, CalendarDays, Bell, Wallet, ChartNoAxesCombined, Settings2, LifeBuoy, ChevronDown, Search, Menu, X, ArrowUpRight, Command, Check, Sparkles, LogOut, ShieldCheck } from 'lucide-react';
import { useGetDatabaseQuery } from '../../services/adminApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToast, removeToast, setGlobalSearch } from '../../store/uiSlice';
import { Avatar, Badge, Button, EmptyState } from '../atoms';
import { Modal } from '../molecules';

const navigation = [
  { to: '/', label: 'Privire de ansamblu', icon: LayoutDashboard },
  { to: '/candidati', label: 'Candidați', icon: UsersRound },
  { to: '/angajatori', label: 'Angajatori', icon: Building2 },
  { to: '/joburi', label: 'Joburi', icon: BriefcaseBusiness },
  { to: '/aplicari', label: 'Aplicări', icon: ClipboardList },
  { to: '/evenimente', label: 'Evenimente', icon: CalendarDays },
];
const platform = [
  { to: '/incasari', label: 'Încasări', icon: Wallet },
  { to: '/rapoarte', label: 'Rapoarte', icon: ChartNoAxesCombined },
  { to: '/notificari', label: 'Notificări', icon: Bell },
  { to: '/asistenta', label: 'Asistență', icon: LifeBuoy },
  { to: '/setari', label: 'Setări', icon: Settings2 },
];

export function ToastRegion() {
  const toasts = useAppSelector(state => state.ui.toasts);
  const dispatch = useAppDispatch();
  useEffect(() => { const timers = toasts.map(toast => setTimeout(() => dispatch(removeToast(toast.id)), 4500)); return () => timers.forEach(clearTimeout); }, [toasts, dispatch]);
  return <div className="toast-region" aria-live="polite">{toasts.map(toast => <div className={`toast toast--${toast.tone}`} key={toast.id}><Check size={19}/><span>{toast.message}</span><button onClick={() => dispatch(removeToast(toast.id))} aria-label="Închide notificarea"><X size={16}/></button></div>)}</div>;
}

export default function AdminLayout() {
  const { data } = useGetDatabaseQuery();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const query = useAppSelector(state => state.ui.globalSearch);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const unread = data?.notifications.filter(item => !item.read).length ?? 0;
  const pendingJobs = data?.jobs.filter(item => item.status === 'În verificare').length ?? 0;
  const openTickets = data?.tickets.filter(item => item.status !== 'Rezolvat').length ?? 0;
  const profileName = data?.settings.name || 'Andreea Popescu';
  useEffect(() => { setMenuOpen(false); setAccountOpen(false); window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => {
    function handleKey(event: KeyboardEvent) { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(value => !value); } if (event.key === 'Escape') { setMenuOpen(false); setAccountOpen(false); } }
    document.addEventListener('keydown', handleKey); return () => document.removeEventListener('keydown', handleKey);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector<HTMLElement>('button')?.focus();
    function trap(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const nodes = [...(menuRef.current?.querySelectorAll<HTMLElement>('a, button') ?? [])];
      if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus(); }
      if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus(); }
    }
    document.addEventListener('keydown', trap);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', trap); menuButtonRef.current?.focus(); };
  }, [menuOpen]);
  useEffect(() => { if (searchOpen) setTimeout(() => inputRef.current?.focus(), 0); }, [searchOpen]);
  const needle = query.trim().toLocaleLowerCase('ro');
  const results = needle && data ? [
    ...data.candidates.filter(item => `${item.name} ${item.role} ${item.city}`.toLocaleLowerCase('ro').includes(needle)).slice(0, 4).map(item => ({ id: item.id, title: item.name, description: `${item.role} · ${item.city}`, path: '/candidati', type: 'Candidat' })),
    ...data.employers.filter(item => item.name.toLocaleLowerCase('ro').includes(needle)).slice(0, 3).map(item => ({ id: item.id, title: item.name, description: item.city, path: '/angajatori', type: 'Angajator' })),
    ...data.jobs.filter(item => `${item.title} ${item.company}`.toLocaleLowerCase('ro').includes(needle)).slice(0, 3).map(item => ({ id: item.id, title: item.title, description: item.company, path: '/joburi', type: 'Job' })),
  ] : [];
  const openResult = (path: string, title?: string) => { setSearchOpen(false); dispatch(setGlobalSearch('')); navigate(title ? `${path}?q=${encodeURIComponent(title)}` : path); };
  const renderNav = (items: typeof navigation) => items.map(({ to, label, icon: Icon }) => <NavLink end={to === '/'} key={to} to={to} className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}><Icon size={19} strokeWidth={1.7}/><span>{label}</span>{to === '/joburi' && pendingJobs > 0 && <span className="sidebar__count">{pendingJobs}</span>}{to === '/notificari' && unread > 0 && <span className="sidebar__count sidebar__count--blue">{unread}</span>}{to === '/asistenta' && openTickets > 0 && <span className="sidebar__count">{openTickets}</span>}</NavLink>);
  return <div className="admin-layout">
    <a className="skip-link" href="#main-content">Mergi la conținut</a>
    {menuOpen && <button className="sidebar-overlay" onClick={() => setMenuOpen(false)} aria-label="Închide meniul"/>}
    <aside ref={menuRef} className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`} aria-label="Navigare principală" {...(menuOpen ? { role: 'dialog', 'aria-modal': true } : {})}>
      <div className="sidebar__brand"><NavLink to="/" aria-label="Jobbin · Acasă"><img src="/jobbin-logo.png" alt="Jobbin"/></NavLink><button className="icon-button sidebar__close" onClick={() => setMenuOpen(false)} aria-label="Închide meniul"><X size={21}/></button></div>
      <span className="sidebar__workspace"><ShieldCheck size={13}/> Administrare platformă</span>
      <nav><p className="sidebar__label">GESTIONARE</p>{renderNav(navigation)}<p className="sidebar__label sidebar__label--second">PLATFORMĂ</p>{renderNav(platform)}</nav>
      <div className="sidebar__bottom"><div className="sidebar__tip"><span className="sidebar__tip-icon"><Sparkles size={18}/></span><strong>Oameni. Oportunități.</strong><p>Conectezi talentul cu locul potrivit.</p><NavLink to="/rapoarte">Vezi impactul tău <ArrowUpRight size={14}/></NavLink></div><button className="sidebar__profile" onClick={() => navigate('/setari')}><Avatar name={profileName} color="#fce6ed" size="sm"/><span><strong>{profileName}</strong><small>Administrator Jobbin</small></span><Settings2 size={16}/></button></div>
    </aside>
    <div className="admin-layout__workspace">
      <header className="topbar"><button ref={menuButtonRef} className="icon-button topbar__menu" onClick={() => setMenuOpen(true)} aria-label="Deschide meniul" aria-expanded={menuOpen}><Menu size={22}/></button><button className="topbar__search" onClick={() => setSearchOpen(true)} aria-label="Caută în platformă"><Search size={19}/><span>Caută în platformă…</span><kbd><Command size={11}/> K</kbd></button><div className="topbar__right"><span className="demo-pill"><span/> Mod demo</span><span className="topbar__divider"/><button className="icon-button topbar__bell" onClick={() => navigate('/notificari')} aria-label={`Notificări, ${unread} necitite`}><Bell size={21}/>{unread > 0 && <span className="topbar__notification-dot"/>}</button><div className="account-menu"><button className="topbar__account" onClick={() => setAccountOpen(value => !value)} aria-expanded={accountOpen} aria-label="Meniul contului"><Avatar name={profileName} size="sm" color="#e9edff"/><span>{profileName.split(' ')[0]}</span><ChevronDown size={14}/></button>{accountOpen && <><button className="account-menu__backdrop" tabIndex={-1} onClick={() => setAccountOpen(false)} aria-label="Închide meniul contului"/><div className="account-menu__dropdown"><strong>Contul meu</strong><button onClick={() => navigate('/setari')}><Settings2 size={16}/> Setări platformă</button><button onClick={() => { setAccountOpen(false); setSignedOut(true); }}><LogOut size={16}/> Ieșire din demo</button></div></>}</div></div></header>
      <main id="main-content" className="main-content" tabIndex={-1}><Outlet/></main><footer className="workspace-footer"><span>© 2026 Jobbin. Oportunități pentru fiecare.</span><span><span className="workspace-footer__dot"/> Toate sistemele sunt operaționale <span className="workspace-footer__version">v1.0 demo</span></span></footer>
    </div>
    <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Caută în Jobbin"><div className="command-search"><Search size={20}/><input ref={inputRef} value={query} onChange={event => dispatch(setGlobalSearch(event.target.value))} placeholder="Nume, companie sau job…" aria-label="Căutare globală"/></div>{needle ? results.length ? <div className="command-results">{results.map(result => <button key={result.id} onClick={() => openResult(result.path, result.title)}><span><strong>{result.title}</strong><small>{result.description}</small></span><Badge tone="info">{result.type}</Badge><ArrowUpRight size={17}/></button>)}</div> : <EmptyState title="Niciun rezultat" description="Încearcă un alt nume, o companie sau un rol."/> : <div className="command-shortcuts"><p className="text-muted">Acces rapid</p>{navigation.slice(1, 5).map(item => <button key={item.to} onClick={() => openResult(item.to)}><item.icon size={18}/>{item.label}<ArrowUpRight size={16}/></button>)}<small>Folosește Ctrl / ⌘ + K din orice pagină.</small></div>}</Modal>
    <Modal open={signedOut} onClose={() => setSignedOut(false)} title="Sesiune demo încheiată"><EmptyState icon={ShieldCheck} title="Ne revedem curând!" description="Acesta este un prototip local. Poți reveni oricând în spațiul de administrare."/><Button onClick={() => { setSignedOut(false); dispatch(addToast({ message: 'Bine ai revenit în Jobbin Admin.' })); }}>Revino în demo</Button></Modal>
    <ToastRegion/>
  </div>;
}
