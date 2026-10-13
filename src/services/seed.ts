import type { Database } from '../types';

/** Demo fixtures are deliberately deterministic, so previews and tests stay repeatable. */
export const DEMO_REFERENCE_DATE = '2026-10-12T09:30:00.000Z';
export const recruitmentTrend = [
  { label: 'Mai', candidates: 64, jobs: 18 },
  { label: 'Iun', candidates: 82, jobs: 24 },
  { label: 'Iul', candidates: 74, jobs: 21 },
  { label: 'Aug', candidates: 105, jobs: 32 },
  { label: 'Sep', candidates: 121, jobs: 38 },
  { label: 'Oct', candidates: 148, jobs: 46 },
];

const colors = ['#dfe6ff', '#ffe1ed', '#dff4ec', '#eee5ff', '#ffecd4', '#dff0ff'];
const names = [
  'Andreea Popescu', 'Mihai Ionescu', 'Elena Radu', 'Alexandru Mureșan',
  'Ioana Dumitrescu', 'Vlad Georgescu', 'Maria Stan', 'Răzvan Petrescu',
  'Bianca Moldovan', 'Ștefan Pavel', 'Cristina Dobre', 'David Toma',
  'Ana Marinescu', 'George Neagu', 'Diana Lungu', 'Paul Șerban',
  'Gabriela Matei', 'Robert Ilie', 'Teodora Bălan', 'Cătălin Enache',
  'Alina Ciobanu', 'Dragoș Sava', 'Simona Tudor', 'Andrei Vasile',
  'Oana Florea', 'Cosmin Bîrsan', 'Laura Mihalache', 'Sorin Nistor',
  'Raluca Cristea', 'Victor Preda', 'Denisa Coman', 'Bogdan Mocanu',
];
const cities = ['Oradea', 'Cluj-Napoca', 'București', 'Timișoara', 'Brașov', 'Iași', 'Sibiu', 'Arad'];
const roles = ['Specialist marketing', 'Dezvoltator frontend', 'Contabil', 'Agent vânzări', 'Asistent manager', 'Designer UI/UX', 'Operator logistică', 'Specialist HR'];
const skills = [
  ['Marketing digital', 'Google Ads', 'Comunicare'],
  ['React', 'TypeScript', 'CSS'],
  ['Excel', 'Contabilitate', 'SAGA'],
  ['Negociere', 'CRM', 'Vânzări B2B'],
  ['Organizare', 'Microsoft Office', 'Engleză'],
  ['Figma', 'Prototipare', 'Cercetare UX'],
  ['Gestiune stocuri', 'ERP', 'Planificare'],
  ['Recrutare', 'Comunicare', 'Legislația muncii'],
];
const iso = (day: number, hour = 10) => `2026-10-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00.000Z`;

export function createSeedDatabase(): Database {
  const employers: Database['employers'] = [
    { id: 'emp-1', name: 'TechWave Solutions', email: 'hr@techwave.ro', city: 'Cluj-Napoca', industry: 'IT & software', cui: 'RO38472109', status: 'Verificat', plan: 'Premium', color: colors[0], createdAt: '2026-08-10T09:00:00.000Z' },
    { id: 'emp-2', name: 'Nordic Retail', email: 'cariere@nordicretail.ro', city: 'Oradea', industry: 'Retail', cui: 'RO29184573', status: 'Verificat', plan: 'Business', color: colors[1], createdAt: '2026-08-18T09:00:00.000Z' },
    { id: 'emp-3', name: 'GreenLogistics', email: 'echipa@greenlogistics.ro', city: 'Timișoara', industry: 'Transport & logistică', cui: 'RO40128763', status: 'Verificat', plan: 'Business', color: colors[2], createdAt: '2026-09-02T09:00:00.000Z' },
    { id: 'emp-4', name: 'Creative Studio', email: 'hello@creativestudio.ro', city: 'București', industry: 'Marketing & design', cui: 'RO31789204', status: 'Verificat', plan: 'Premium', color: colors[3], createdAt: '2026-09-05T09:00:00.000Z' },
    { id: 'emp-5', name: 'FinExpert Consult', email: 'recrutare@finexpert.ro', city: 'Oradea', industry: 'Finanțe & contabilitate', cui: 'RO26714589', status: 'Verificat', plan: 'Business', color: colors[4], createdAt: '2026-09-08T09:00:00.000Z' },
    { id: 'emp-6', name: 'Hotel Aurora', email: 'hr@hotelaurora.ro', city: 'Brașov', industry: 'Turism & ospitalitate', cui: 'RO19853672', status: 'Verificat', plan: 'Starter', color: colors[5], createdAt: '2026-09-12T09:00:00.000Z' },
    { id: 'emp-7', name: 'MedLife Oradea', email: 'cariere@medlife-demo.ro', city: 'Oradea', industry: 'Sănătate', cui: 'RO42178536', status: 'Verificat', plan: 'Premium', color: colors[0], createdAt: '2026-09-19T09:00:00.000Z' },
    { id: 'emp-8', name: 'BuildPro Construct', email: 'office@buildpro.ro', city: 'Sibiu', industry: 'Construcții', cui: 'RO36792145', status: 'În verificare', plan: 'Starter', color: colors[4], createdAt: iso(10) },
    { id: 'emp-9', name: 'Urban Coffee', email: 'echipa@urbancoffee.ro', city: 'Iași', industry: 'HoReCa', cui: 'RO45813972', status: 'În verificare', plan: 'Starter', color: colors[1], createdAt: iso(11) },
    { id: 'emp-10', name: 'NextStep Academy', email: 'contact@nextstep.ro', city: 'București', industry: 'Educație', cui: 'RO33278619', status: 'Suspendat', plan: 'Business', color: colors[3], createdAt: '2026-09-24T09:00:00.000Z' },
  ];
  const candidates: Database['candidates'] = names.map((name, index) => ({
    id: `cand-${index + 1}`, name,
    email: `${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').replaceAll(' ', '.')}@example.ro`,
    phone: `07${String(21000000 + index * 1731).padStart(8, '0')}`,
    role: roles[index % roles.length], city: cities[index % cities.length],
    status: index === 15 || index === 27 ? 'Suspendat' : index > 25 ? 'Nou' : 'Activ',
    rating: Number((4.2 + (index % 9) / 10).toFixed(1)),
    response: [100, 92, 85, 100, 76, 95, 88, 100][index % 8],
    attendance: [100, 100, 95, 100, 90, 100, 100, 96][index % 8],
    skills: [...skills[index % skills.length]], createdAt: index < 16 ? iso(12 - Math.floor(index / 3)) : index < 29 ? `2026-09-${30 - Math.floor((index - 16) / 2)}T10:00:00.000Z` : `2026-08-${29 - (index - 29) * 3}T10:00:00.000Z`,
    color: colors[index % colors.length],
  }));
  const jobSpecs = [
    ['Dezvoltator frontend React', 0, 'Cluj-Napoca', 'IT & software', '8.000 – 12.000 lei', 'Full-time', 'Activ'],
    ['Agent de vânzări', 1, 'Oradea', 'Vânzări', '4.500 – 6.500 lei', 'Full-time', 'Activ'],
    ['Coordonator logistică', 2, 'Timișoara', 'Logistică', '5.000 – 7.000 lei', 'Full-time', 'Activ'],
    ['Designer UI/UX', 3, 'București', 'Design', '6.000 – 9.000 lei', 'Contract', 'Activ'],
    ['Contabil senior', 4, 'Oradea', 'Finanțe', '5.500 – 8.000 lei', 'Full-time', 'Activ'],
    ['Recepționer hotel', 5, 'Brașov', 'Turism', '3.500 – 4.500 lei', 'Full-time', 'Activ'],
    ['Asistent medical', 6, 'Oradea', 'Sănătate', '4.500 – 6.000 lei', 'Full-time', 'Activ'],
    ['Inginer constructor', 7, 'Sibiu', 'Construcții', '7.000 – 10.000 lei', 'Full-time', 'În verificare'],
    ['Barista', 8, 'Iași', 'HoReCa', '3.000 – 4.000 lei', 'Part-time', 'În verificare'],
    ['Specialist marketing digital', 3, 'București', 'Marketing', '5.000 – 7.500 lei', 'Full-time', 'Activ'],
    ['Specialist resurse umane', 0, 'Cluj-Napoca', 'Resurse umane', '5.000 – 6.500 lei', 'Full-time', 'Pauză'],
    ['Trainer limba engleză', 9, 'București', 'Educație', '4.000 – 6.000 lei', 'Part-time', 'Închis'],
  ] as const;
  const jobs: Database['jobs'] = jobSpecs.map(([title, employerIndex, city, category, salary, type, status], index) => ({
    id: `job-${index + 1}`, title, employerId: employers[employerIndex].id,
    company: employers[employerIndex].name, city, category, salary, type, status,
    applications: 0, createdAt: index < 8 ? iso(12 - index) : index < 10 ? `2026-09-${30 - (index - 8) * 3}T10:00:00.000Z` : `2026-08-${28 - (index - 10) * 6}T10:00:00.000Z`,
    description: `Căutăm un coleg pentru rolul de ${title.toLowerCase()}. Oferim un mediu de lucru prietenos, un program predictibil și oportunități de dezvoltare. Experiența relevantă, comunicarea clară și atenția la detalii sunt apreciate. Aplică pentru a cunoaște echipa ${employers[employerIndex].name}.`,
  }));
  const applicationStatuses: Database['applications'][number]['status'][] = ['Nouă', 'În evaluare', 'Interviu', 'Nouă', 'În evaluare', 'Angajat', 'Respins', 'Interviu'];
  const applications: Database['applications'] = candidates.map((candidate, index) => {
    const job = jobs[index % 10];
    job.applications += 1;
    return { id: `app-${index + 1}`, candidateId: candidate.id, candidate: candidate.name, jobId: job.id, job: job.title, company: job.company, status: applicationStatuses[index % 8], createdAt: iso(Math.max(1, 12 - Math.floor(index / 4)), 8 + index % 8) };
  });
  return {
    candidates, employers, jobs, applications,
    events: [
      { id: 'event-1', title: 'Interviuri · TechWave Solutions', date: '2026-10-13', time: '10:00', city: 'Cluj-Napoca', type: 'Interviu', attendees: 8, status: 'Programat', description: 'Prima rundă de discuții pentru rolul de dezvoltator frontend. Interviuri de 30 de minute cu echipa tehnică.' },
      { id: 'event-2', title: 'Jobbin Connect · Oradea', date: '2026-10-15', time: '09:00', city: 'Oradea', type: 'Târg de joburi', attendees: 124, status: 'Programat', description: 'Angajatori locali, oportunități de carieră și sesiuni de networking la Trade Center Oradea.' },
      { id: 'event-3', title: 'Cum pregătești un CV care convinge', date: '2026-10-16', time: '18:00', city: 'Online', type: 'Webinar', attendees: 46, status: 'Programat', description: 'Atelier practic pentru candidați, cu exemple de CV și feedback de la un specialist HR.' },
      { id: 'event-4', title: 'Interviuri · Nordic Retail', date: '2026-10-19', time: '11:30', city: 'Oradea', type: 'Interviu', attendees: 6, status: 'Programat', description: 'Discuții individuale cu candidații selectați pentru echipa de vânzări.' },
      { id: 'event-5', title: 'Recrutarea în 2027', date: '2026-10-22', time: '14:00', city: 'Online', type: 'Webinar', attendees: 72, status: 'Programat', description: 'Tendințe de recrutare, retenția angajaților și folosirea eficientă a platformei Jobbin.' },
      { id: 'event-6', title: 'Târg de cariere · Timișoara', date: '2026-10-28', time: '09:30', city: 'Timișoara', type: 'Târg de joburi', attendees: 185, status: 'Programat', description: 'O zi dedicată carierei, cu peste 20 de angajatori și sesiuni de orientare profesională.' },
    ],
    notifications: [
      { id: 'notif-1', title: 'Un angajator așteaptă verificarea', description: 'Urban Coffee a trimis documentele companiei. Verifică profilul pentru a activa contul.', type: 'employer', read: false, createdAt: iso(12, 9) },
      { id: 'notif-2', title: '2 joburi noi de aprobat', description: 'Inginer constructor și Barista așteaptă aprobarea publicării.', type: 'job', read: false, createdAt: iso(12, 8) },
      { id: 'notif-3', title: '6 candidați noi în comunitate', description: 'Vezi profilurile noi și ajută-i să găsească oportunitățile potrivite.', type: 'candidate', read: false, createdAt: iso(11, 17) },
      { id: 'notif-4', title: 'Un tichet necesită răspuns', description: 'Mihai Ionescu are nevoie de ajutor pentru actualizarea CV-ului.', type: 'system', read: false, createdAt: iso(11, 14) },
      { id: 'notif-5', title: 'Raportul săptămânal este pregătit', description: 'Activitatea comunității și rezultatele recrutării sunt disponibile în Rapoarte.', type: 'system', read: true, createdAt: iso(10, 9) },
      { id: 'notif-6', title: 'TechWave a activat planul Premium', description: 'Abonamentul lunar de 499 lei a fost confirmat.', type: 'employer', read: true, createdAt: iso(9, 12) },
    ],
    transactions: [
      { id: 'txn-1', company: 'TechWave Solutions', type: 'Abonament', amount: 499, status: 'Finalizată', createdAt: iso(12, 8) },
      { id: 'txn-2', company: 'Creative Studio', type: 'Abonament', amount: 499, status: 'Finalizată', createdAt: iso(11, 14) },
      { id: 'txn-3', company: 'Nordic Retail', type: 'Credite', amount: 250, status: 'Finalizată', createdAt: iso(11, 10) },
      { id: 'txn-4', company: 'GreenLogistics', type: 'Abonament', amount: 249, status: 'Finalizată', createdAt: iso(10, 15) },
      { id: 'txn-5', company: 'FinExpert Consult', type: 'Abonament', amount: 249, status: 'Finalizată', createdAt: iso(9, 12) },
      { id: 'txn-6', company: 'Hotel Aurora', type: 'Credite', amount: 100, status: 'În așteptare', createdAt: iso(9, 11) },
      { id: 'txn-7', company: 'MedLife Oradea', type: 'Abonament', amount: 499, status: 'Finalizată', createdAt: iso(8, 9) },
      { id: 'txn-8', company: 'NextStep Academy', type: 'Rambursare', amount: -249, status: 'Finalizată', createdAt: iso(7, 16) },
      { id: 'txn-9', company: 'Nordic Retail', type: 'Abonament', amount: 249, status: 'Finalizată', createdAt: '2026-08-28T09:00:00.000Z' },
      { id: 'txn-10', company: 'Urban Coffee', type: 'Credite', amount: 100, status: 'În așteptare', createdAt: '2026-08-24T11:00:00.000Z' },
    ],
    tickets: [
      { id: 'ticket-1', subject: 'Nu pot încărca CV-ul', author: 'Mihai Ionescu', email: 'mihai.ionescu@example.ro', priority: 'Ridicată', status: 'Deschis', message: 'Bună ziua! Încerc să încarc CV-ul în format PDF, dar primesc un mesaj de eroare. Fișierul are 3 MB. Mă puteți ajuta?', reply: '', createdAt: iso(12, 8) },
      { id: 'ticket-2', subject: 'Factura pentru abonamentul Business', author: 'Nordic Retail', email: 'cariere@nordicretail.ro', priority: 'Medie', status: 'În lucru', message: 'Vă rugăm să ne transmiteți factura fiscală pentru abonamentul activat luna aceasta.', reply: 'Bună ziua! Am trimis solicitarea către colegii din departamentul financiar. Revenim în cursul zilei.', createdAt: iso(11, 12) },
      { id: 'ticket-3', subject: 'Actualizare adresă companie', author: 'BuildPro Construct', email: 'office@buildpro.ro', priority: 'Scăzută', status: 'Deschis', message: 'Sediul companiei s-a schimbat. Cum putem modifica adresa în profil înainte de verificare?', reply: '', createdAt: iso(11, 10) },
      { id: 'ticket-4', subject: 'Invitația la interviu nu a ajuns', author: 'Elena Radu', email: 'elena.radu@example.ro', priority: 'Ridicată', status: 'În lucru', message: 'Angajatorul mi-a spus că a trimis o invitație, dar nu apare în cont. Interviul este programat mâine.', reply: 'Bună, Elena! Verificăm invitația împreună cu angajatorul și îți trimitem detaliile în cel mai scurt timp.', createdAt: iso(10, 15) },
      { id: 'ticket-5', subject: 'Resetare parolă', author: 'Ana Marinescu', email: 'ana.marinescu@example.ro', priority: 'Medie', status: 'Rezolvat', message: 'Nu mai am acces la vechea parolă. Linkul de resetare a expirat.', reply: 'Ți-am retrimis linkul de resetare. Ne bucurăm că ai reușit să te conectezi!', createdAt: iso(9, 9) },
    ],
    admins: [
      { id: 'admin-1', name: 'Alexandra Pop', email: 'alexandra@jobbin.ro', role: 'Administrator', status: 'Activ' },
      { id: 'admin-2', name: 'Radu Marin', email: 'radu@jobbin.ro', role: 'Moderator', status: 'Activ' },
      { id: 'admin-3', name: 'Ioana Pavel', email: 'ioana@jobbin.ro', role: 'Suport', status: 'Activ' },
      { id: 'admin-4', name: 'Diana Rusu', email: 'diana@jobbin.ro', role: 'Moderator', status: 'Invitat' },
    ],
    settings: { name: 'Alexandra Pop', email: 'alexandra@jobbin.ro', phone: '0771 596 762', company: 'GETJOBBIN S.R.L.', jobApproval: true, employerVerification: true, emailNotifications: true, weeklyReport: true, twoFactor: false },
    activity: [
      { id: 'activity-1', description: 'Urban Coffee a trimis profilul companiei pentru verificare.', type: 'employer', createdAt: iso(12, 9) },
      { id: 'activity-2', description: 'Andreea Popescu a aplicat la Dezvoltator frontend React.', type: 'candidate', createdAt: iso(12, 8) },
      { id: 'activity-3', description: 'Jobul „Barista” așteaptă aprobarea publicării.', type: 'job', createdAt: iso(11, 17) },
      { id: 'activity-4', description: 'Alexandra Pop a verificat profilul MedLife Oradea.', type: 'employer', createdAt: iso(11, 14) },
      { id: 'activity-5', description: 'TechWave Solutions a activat abonamentul Premium.', type: 'system', createdAt: iso(10, 12) },
      { id: 'activity-6', description: 'Ioana Pavel a rezolvat solicitarea de resetare a parolei.', type: 'system', createdAt: iso(9, 11) },
    ],
  };
}
