import { formatCurrency, formatDate, initials, statusTone } from './index';
describe('Romanian formatting', () => {
  it('preserves bani for fractional transactions', () => { expect(formatCurrency(149.99)).toContain('149,99'); expect(formatCurrency(-149.99)).toContain('-149,99'); });
  it('handles missing dates and multi-part Romanian names', () => { expect(formatDate('invalid')).toBe('—'); expect(initials('  Ioana Maria Pop  ')).toBe('IM'); expect(initials('')).toBe(''); });
  it('distinguishes moderation and recruitment statuses', () => { expect(statusTone('În verificare')).toBe('warning'); expect(statusTone('Suspendat')).toBe('danger'); expect(statusTone('Angajat')).toBe('success'); });
});
