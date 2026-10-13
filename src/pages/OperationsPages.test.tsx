import type { ReactNode } from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { NotificationsPage, SettingsPage, SupportPage, WalletPage } from './OperationsPages';
import { createAppStore } from '../store';
import type { AppStore } from '../store';
import { adminApi } from '../services/adminApi';
import { createMockDatabase, getMockDatabase } from '../services/mockDatabase';
import { formatCurrency } from '../utils';

const stores: AppStore[] = [];
function renderPage(page: ReactNode) {
  const store = createAppStore();
  stores.push(store);
  return render(<Provider store={store}><MemoryRouter>{page}</MemoryRouter></Provider>);
}

beforeEach(() => { getMockDatabase().resetDemo(); });
afterEach(() => { cleanup(); stores.splice(0).forEach(store => store.dispatch(adminApi.util.resetApiState())); });

describe('Operational pages connected to RTK Query', () => {
  it('preserves an unsaved profile while changing preferences and persists the final settings', async () => {
    const user = userEvent.setup();
    renderPage(<SettingsPage />);
    const name = await screen.findByRole('textbox', { name: 'Nume complet' });
    const operator = screen.getByRole('textbox', { name: 'Operatorul platformei' });
    expect(operator).toHaveValue('GETJOBBIN S.R.L.');
    expect(operator).toHaveAttribute('readonly');
    await user.clear(name);
    await user.type(name, 'Alexandra Popescu');

    await user.click(screen.getByRole('switch', { name: 'Raport săptămânal' }));
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Raport săptămânal' })).toHaveAttribute('aria-checked', 'false'));
    expect(name).toHaveValue('Alexandra Popescu');
    expect(getMockDatabase().getDatabase().settings.name).toBe('Alexandra Pop');

    await user.click(screen.getByRole('button', { name: 'Salvează modificările' }));
    await waitFor(() => expect(getMockDatabase().getDatabase().settings.name).toBe('Alexandra Popescu'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Salvează modificările' })).toBeDisabled());
    expect(createMockDatabase(localStorage).getDatabase().settings).toMatchObject({ name: 'Alexandra Popescu', weeklyReport: false, company: 'GETJOBBIN S.R.L.' });
  });

  it('only allows demoting an active administrator when another active administrator exists', async () => {
    const user = userEvent.setup();
    renderPage(<SettingsPage />);
    const alexandraRole = await screen.findByRole('combobox', { name: 'Rolul lui Alexandra Pop' });
    const raduRole = screen.getByRole('combobox', { name: 'Rolul lui Radu Marin' });
    expect(alexandraRole).toBeDisabled();
    expect(raduRole).toBeEnabled();

    await user.selectOptions(raduRole, 'Administrator');
    await waitFor(() => expect(alexandraRole).toBeEnabled());
    expect(getMockDatabase().getDatabase().admins.filter(admin => admin.role === 'Administrator' && admin.status === 'Activ')).toHaveLength(2);

    await user.selectOptions(alexandraRole, 'Suport');
    await waitFor(() => {
      expect(alexandraRole).toHaveValue('Suport');
      expect(raduRole).toHaveValue('Administrator');
      expect(raduRole).toBeDisabled();
    });
    expect(getMockDatabase().getDatabase().admins.filter(admin => admin.role === 'Administrator' && admin.status === 'Activ')).toHaveLength(1);
  });

  it('removes individually read notifications from the unread tab and marks the remaining notifications read', async () => {
    const user = userEvent.setup();
    renderPage(<NotificationsPage />);
    await screen.findByRole('tab', { name: 'Necitite 4' });
    await user.click(screen.getByRole('tab', { name: 'Necitite 4' }));
    const readButtons = screen.getAllByRole('button', { name: 'Marchează citită' });
    expect(readButtons).toHaveLength(4);
    await user.click(readButtons[0]);

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Marchează citită' })).toHaveLength(3));
    expect(getMockDatabase().getDatabase().notifications.find(notification => notification.id === 'notif-1')?.read).toBe(true);
    expect(screen.queryByRole('heading', { name: 'Un angajator așteaptă verificarea' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Marchează toate ca citite' }));
    await screen.findByRole('heading', { name: 'Totul este la zi' });
    expect(screen.getByRole('tab', { name: 'Necitite 0' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Marchează toate ca citite' })).toBeDisabled();
    expect(createMockDatabase(localStorage).getDatabase().notifications.every(notification => notification.read)).toBe(true);
  });

  it('requires confirmation for a refund, adjusts net revenue, and prevents refunding the same transaction twice', async () => {
    const user = userEvent.setup();
    const initial = getMockDatabase().getDatabase();
    const original = initial.transactions.find(transaction => transaction.id === 'txn-1')!;
    const initialNet = initial.transactions.filter(transaction => transaction.status === 'Finalizată').reduce((sum, transaction) => sum + transaction.amount, 0);
    renderPage(<WalletPage />);
    const originalRow = (await screen.findByText('#txn-1')).closest('tr')!;
    const netCard = screen.getByText('Încasări nete').closest('article')!;
    expect(netCard.textContent).toContain(formatCurrency(initialNet));

    await user.click(within(originalRow).getByRole('button', { name: 'Rambursează' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirmă rambursarea' });
    expect(dialog.textContent).toContain(formatCurrency(original.amount));
    expect(getMockDatabase().getDatabase().transactions).toHaveLength(initial.transactions.length);
    await user.click(within(dialog).getByRole('button', { name: 'Anulează' }));
    expect(getMockDatabase().getDatabase().transactions).toHaveLength(initial.transactions.length);

    await user.click(within(originalRow).getByRole('button', { name: 'Rambursează' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Confirmă rambursarea' })).getByRole('button', { name: 'Confirmă' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(netCard.textContent).toContain(formatCurrency(initialNet - original.amount)));
    const updatedRow = screen.getByText('#txn-1').closest('tr')!;
    expect(within(updatedRow).getByText('Rambursată')).toBeInTheDocument();
    expect(within(updatedRow).queryByRole('button', { name: 'Rambursează' })).not.toBeInTheDocument();
    const refunds = createMockDatabase(localStorage).getDatabase().transactions.filter(transaction => transaction.id === 'refund-txn-1');
    expect(refunds).toHaveLength(1);
    expect(refunds[0]).toMatchObject({ amount: -original.amount, company: original.company, type: 'Rambursare', status: 'Finalizată' });
  });

  it('records a platform receipt for the selected employer and transaction type, preserving fractional currency amounts', async () => {
    const user = userEvent.setup();
    const initial = getMockDatabase().getDatabase();
    const initialNet = initial.transactions.filter(transaction => transaction.status === 'Finalizată').reduce((sum, transaction) => sum + transaction.amount, 0);
    renderPage(<WalletPage />);
    await screen.findByText('#txn-1');
    await user.click(screen.getByRole('button', { name: 'Înregistrează încasare' }));
    const dialog = screen.getByRole('dialog', { name: 'Înregistrează încasare' });
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Angajator' }), 'TechWave Solutions');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Tip încasare' }), 'Abonament');
    const amount = within(dialog).getByRole('spinbutton', { name: 'Sumă (RON)' });
    await user.clear(amount);
    await user.type(amount, '250.75');
    await user.click(within(dialog).getByRole('button', { name: 'Înregistrează încasarea' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const created = createMockDatabase(localStorage).getDatabase().transactions.find(transaction => transaction.company === 'TechWave Solutions' && transaction.amount === 250.75);
    expect(created).toMatchObject({ amount: 250.75, company: 'TechWave Solutions', type: 'Abonament', status: 'Finalizată' });
    await waitFor(() => expect(screen.getByText('Încasări nete').closest('article')?.textContent).toContain(formatCurrency(initialNet + 250.75)));
  });

  it('saves a support reply, moves the ticket into progress, then resolves and reopens it', async () => {
    const user = userEvent.setup();
    renderPage(<SupportPage />);
    await user.click(await screen.findByRole('button', { name: /Nu pot încărca CV-ul/ }));
    const dialog = screen.getByRole('dialog', { name: 'Nu pot încărca CV-ul' });
    const reply = 'Bună, Mihai! Te rugăm să încerci încărcarea după actualizarea paginii.';
    await user.type(within(dialog).getByRole('textbox', { name: /^Răspunsul tău/ }), reply);
    await user.click(within(dialog).getByRole('button', { name: 'Salvează răspunsul' }));

    await waitFor(() => expect(getMockDatabase().getDatabase().tickets.find(ticket => ticket.id === 'ticket-1')).toMatchObject({ reply, status: 'În lucru' }));
    await within(dialog).findByText('Ultimul răspuns salvat');
    expect(createMockDatabase(localStorage).getDatabase().tickets.find(ticket => ticket.id === 'ticket-1')?.reply).toBe(reply);

    await user.click(within(dialog).getByRole('button', { name: 'Marchează rezolvat' }));
    await within(dialog).findByRole('button', { name: 'Redeschide tichetul' });
    expect(getMockDatabase().getDatabase().tickets.find(ticket => ticket.id === 'ticket-1')?.status).toBe('Rezolvat');
    await user.click(within(dialog).getByRole('button', { name: 'Redeschide tichetul' }));
    await within(dialog).findByRole('button', { name: 'Marchează rezolvat' });
    expect(getMockDatabase().getDatabase().tickets.find(ticket => ticket.id === 'ticket-1')).toMatchObject({ status: 'Deschis', reply });
  });
});
