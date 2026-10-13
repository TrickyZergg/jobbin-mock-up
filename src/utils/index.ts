import type { Tone } from '../components/atoms';
export const DEMO_TODAY = new Date('2026-10-12T12:00:00+03:00');
export function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('ro-RO', options).format(date); }
export function formatCurrency(value: number) { return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value); }
export function statusTone(status: string): Tone { if (['Activ', 'Verificat', 'Angajat', 'Finalizată', 'Finalizat', 'Rezolvat'].includes(status)) return 'success'; if (['Suspendat', 'Respins', 'Anulat', 'Închis', 'Ridicată', 'Rambursare'].includes(status)) return 'danger'; if (['În verificare', 'În evaluare', 'În așteptare', 'Pauză', 'Medie', 'Invitat'].includes(status)) return 'warning'; if (['Nou', 'Nouă', 'Interviu', 'Programat', 'Deschis', 'În lucru'].includes(status)) return 'info'; return 'neutral'; }
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const content = '\uFEFF' + [headers.map(escape).join(';'), ...rows.map(row => headers.map(key => escape(row[key])).join(';'))].join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
