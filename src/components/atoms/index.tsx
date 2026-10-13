import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { Search, LoaderCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { initials } from '../../utils';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; icon?: LucideIcon; }
export function Button({ variant = 'primary', size = 'md', icon: Icon, className = '', children, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`button button--${variant} button--${size} ${className}`} {...props}>{Icon && <Icon size={17} strokeWidth={1.8} aria-hidden="true"/>}{children}</button>;
}
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) { return <span className={`badge badge--${tone}`}><span className="badge__dot"/>{children}</span>; }
export function Avatar({ name, color = '#e9edff', size = 'md' }: { name: string; color?: string; size?: 'sm' | 'md' | 'lg' }) { return <span className={`avatar avatar--${size}`} style={{ backgroundColor: color }}>{initials(name)}</span>; }
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className = '', ...props }, ref) { return <input ref={ref} className={`input ${className}`} {...props}/>; });
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className = '', children, ...props }, ref) { return <select ref={ref} className={`select ${className}`} {...props}>{children}</select>; });
export function Spinner() { return <span className="spinner" role="status"><LoaderCircle size={24}/><span className="sr-only">Se încarcă…</span></span>; }
export function EmptyState({ title, description, icon: Icon = Search }: { title: string; description?: string; icon?: LucideIcon }) { return <div className="empty-state"><span className="empty-state__icon"><Icon size={27}/></span><h3>{title}</h3>{description && <p>{description}</p>}</div>; }
