import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ApplicationsPage, CandidatesPage, EmployersPage, EventsPage, JobsPage } from './ResourcePages';
import { createAppStore } from '../store';
import type { AppStore } from '../store';
import { adminApi } from '../services/adminApi';
import { getMockDatabase } from '../services/mockDatabase';

const stores: AppStore[] = [];
function renderPage(page: ReactNode, path: string) {
  const store = createAppStore();
  stores.push(store);
  return render(<Provider store={store}><MemoryRouter initialEntries={[path]}>{page}</MemoryRouter></Provider>);
}

beforeEach(() => { getMockDatabase().resetDemo(); });
afterEach(() => { cleanup(); stores.splice(0).forEach(store => store.dispatch(adminApi.util.resetApiState())); });

describe('Resource pages connected to the mock RTK Query transport', () => {
  it('searches Romanian names without diacritics and saves a candidate status from their profile', async () => {
    const user = userEvent.setup();
    renderPage(<CandidatesPage />, '/candidati?q=muresan');
    await user.click(await screen.findByRole('button', { name: 'Vezi profilul Alexandru Mureșan' }));
    const dialog = screen.getByRole('dialog', { name: 'Profil candidat' });
    expect(within(dialog).getByRole('heading', { name: 'Alexandru Mureșan' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Vezi profilul Andreea Popescu' })).not.toBeInTheDocument();
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Status cont candidat' }), 'Suspendat');
    await waitFor(() => expect(getMockDatabase().getDatabase().candidates.find(candidate => candidate.name === 'Alexandru Mureșan')?.status).toBe('Suspendat'));
    await waitFor(() => expect(within(dialog).getByRole('combobox', { name: 'Status cont candidat' })).toHaveValue('Suspendat'));
  });

  it('opens the dashboard create-job handoff, rejects incomplete data and saves a valid job for moderation', async () => {
    const user = userEvent.setup();
    renderPage(<JobsPage />, '/joburi?create=1');
    const dialog = await screen.findByRole('dialog', { name: 'O nouă oportunitate' });
    await within(dialog).findByRole('option', { name: 'TechWave Solutions' });
    fireEvent.submit(within(dialog).getByRole('button', { name: 'Creează jobul' }).closest('form')!);
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Completează toate câmpurile');
    expect(getMockDatabase().getDatabase().jobs).toHaveLength(12);
    await user.type(within(dialog).getByLabelText('Titlul jobului'), 'Specialist testare automată');
    await user.selectOptions(within(dialog).getByLabelText('Companie'), 'emp-1');
    await user.type(within(dialog).getByLabelText('Locație'), 'Oradea');
    await user.type(within(dialog).getByLabelText(/^Interval salarial/), '5.000 – 7.000 lei');
    await user.type(within(dialog).getByLabelText(/^Descrierea jobului/), 'Căutăm un coleg atent la detalii pentru testarea produselor noastre.');
    await user.click(within(dialog).getByRole('button', { name: 'Creează jobul' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const created = getMockDatabase().getDatabase().jobs.find(job => job.title === 'Specialist testare automată');
    expect(created).toMatchObject({ status: 'În verificare', company: 'TechWave Solutions', employerId: 'emp-1', applications: 0 });
  });

  it('persists a selected recruitment stage and updates the visible pipeline', async () => {
    const user = userEvent.setup();
    renderPage(<ApplicationsPage />, '/aplicari?q=Andreea');
    const stage = await screen.findByRole('combobox', { name: 'Etapa recrutării pentru Andreea Popescu, Dezvoltator frontend React' });
    await user.selectOptions(stage, 'Interviu');
    await waitFor(() => expect(getMockDatabase().getDatabase().applications.find(application => application.id === 'app-1')?.status).toBe('Interviu'));
    await waitFor(() => expect(stage).toHaveValue('Interviu'));
    await user.click(screen.getByRole('button', { name: /Interviu/ }));
    expect(stage).toBeInTheDocument();
  });

  it('verifies an employer and requires confirmation before suspending its account', async () => {
    const user = userEvent.setup();
    renderPage(<EmployersPage />, '/angajatori?status=%C3%8En%20verificare');
    await user.click(await screen.findByRole('button', { name: 'Detalii BuildPro Construct' }));
    await user.click(screen.getByRole('button', { name: 'Verifică angajatorul' }));
    await waitFor(() => expect(getMockDatabase().getDatabase().employers.find(employer => employer.id === 'emp-8')?.status).toBe('Verificat'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Verifică angajatorul' })).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Suspendă contul' }));
    expect(getMockDatabase().getDatabase().employers.find(employer => employer.id === 'emp-8')?.status).toBe('Verificat');
    await user.click(within(screen.getByRole('dialog', { name: 'Suspendă angajatorul' })).getByRole('button', { name: 'Confirmă' }));
    await waitFor(() => expect(getMockDatabase().getDatabase().employers.find(employer => employer.id === 'emp-8')?.status).toBe('Suspendat'));
  });

  it('cancels a scheduled event only after confirmation', async () => {
    const user = userEvent.setup();
    renderPage(<EventsPage />, '/evenimente?status=Programat');
    const cancelButtons = await screen.findAllByRole('button', { name: 'Anulează' });
    const original = getMockDatabase().getDatabase().events.filter(event => event.status === 'Programat').sort((a, b) => a.date.localeCompare(b.date))[0];
    await user.click(cancelButtons[0]);
    expect(getMockDatabase().getDatabase().events.find(event => event.id === original.id)?.status).toBe('Programat');
    await user.click(within(screen.getByRole('dialog', { name: 'Anulează evenimentul' })).getByRole('button', { name: 'Confirmă' }));
    await waitFor(() => expect(getMockDatabase().getDatabase().events.find(event => event.id === original.id)?.status).toBe('Anulat'));
    await waitFor(() => expect(screen.queryByRole('heading', { name: original.title })).not.toBeInTheDocument());
  });
});
