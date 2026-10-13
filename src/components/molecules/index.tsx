import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X, Search, ChevronLeft, ChevronRight, TrendingUp, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, EmptyState, Spinner } from '../atoms';

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) { return <div className="page-header"><div>{eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-header__description">{description}</p>}</div>{action && <div className="page-header__action">{action}</div>}</div>; }
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`panel ${className}`}>{children}</section>; }
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="field"><span className="field__label">{label}</span>{children}{hint && <small className="field__hint">{hint}</small>}</label>; }
export function SearchField({ value, onChange, placeholder = 'Caută…' }: { value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="search-field"><Search size={18} aria-hidden="true"/><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder}/>{value && <button type="button" onClick={() => onChange('')} aria-label="Golește căutarea"><X size={15}/></button>}</label>; }
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onClose); callback.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('button, input, select, textarea, [tabindex="0"]')?.focus());
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') callback.current();
      if (event.key !== 'Tab') return;
      const nodes = [...(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') ?? [])];
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(frame); document.body.style.overflow = bodyOverflow; document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [open]);
  if (!open) return null;
  return <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div ref={ref} className={`modal ${wide ? 'modal--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal__header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Închide fereastra"><X size={20}/></button></div><div className="modal__body">{children}</div></div></div>;
}
export function ConfirmDialog({ open, onClose, onConfirm, title, description, busy }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; busy?: boolean }) { return <Modal open={open} onClose={onClose} title={title}><p className="confirm-description">{description}</p><div className="form-actions"><Button variant="secondary" onClick={onClose}>Anulează</Button><Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Se procesează…' : 'Confirmă'}</Button></div></Modal>; }
export function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="pagination"><span>{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} din ${total} rezultate` : '0 rezultate'}</span><div><button className="icon-button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Pagina anterioară"><ChevronLeft size={18}/></button><span className="pagination__current">{page} / {pages}</span><button className="icon-button" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Pagina următoare"><ChevronRight size={18}/></button></div></div>;
}
export function StatCard({ label, value, change, icon: Icon, tone = 'blue' }: { label: string; value: ReactNode; change?: string; icon: LucideIcon; tone?: string }) { return <article className={`stat-card stat-card--${tone}`}><div className="stat-card__top"><span>{label}</span><span className="stat-card__icon"><Icon size={20} strokeWidth={1.8}/></span></div><div className="stat-card__value">{value}</div>{change && <div className="stat-card__change"><TrendingUp size={13}/><span>{change}</span></div>}</article>; }
export function DataState({ isLoading, error, children }: { isLoading?: boolean; error?: unknown; children: ReactNode }) { if (isLoading) return <div className="loading-state"><Spinner/><p>Pregătim datele pentru tine…</p></div>; if (error) return <EmptyState icon={AlertCircle} title="Datele nu au putut fi încărcate" description="Reîncarcă pagina și încearcă din nou."/>; return <>{children}</>; }
