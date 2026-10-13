import { Route, Routes, Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AdminLayout from './components/organisms/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import { CandidatesPage, EmployersPage, JobsPage, ApplicationsPage, EventsPage } from './pages/ResourcePages';
import { NotificationsPage, WalletPage, SupportPage, SettingsPage, ReportsPage } from './pages/OperationsPages';
import { EmptyState } from './components/atoms';
export default function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="candidati" element={<CandidatesPage />} />
        <Route path="angajatori" element={<EmployersPage />} />
        <Route path="joburi" element={<JobsPage />} />
        <Route path="aplicari" element={<ApplicationsPage />} />
        <Route path="evenimente" element={<EventsPage />} />
        <Route path="incasari" element={<WalletPage />} />
        <Route path="portofel" element={<Navigate to="/incasari" replace />} />
        <Route path="rapoarte" element={<ReportsPage />} />
        <Route path="notificari" element={<NotificationsPage />} />
        <Route path="asistenta" element={<SupportPage />} />
        <Route path="setari" element={<SettingsPage />} />
        <Route path="*" element={
          <div className="not-found">
            <EmptyState title="Pagina nu a fost găsită" description="Oportunitățile te așteaptă în panoul de administrare." />
            <Link className="button button--primary" to="/"><ArrowLeft size={17} />Înapoi la început</Link>
          </div>
        } />
      </Route>
    </Routes>
  );
}
