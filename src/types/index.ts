export interface Candidate { id: string; name: string; email: string; phone: string; role: string; city: string; status: 'Activ' | 'Suspendat' | 'Nou'; rating: number; response: number; attendance: number; skills: string[]; createdAt: string; color: string; }
export interface Employer { id: string; name: string; email: string; city: string; industry: string; cui: string; status: 'Verificat' | 'În verificare' | 'Suspendat'; plan: 'Starter' | 'Business' | 'Premium'; color: string; createdAt: string; }
export interface Job { id: string; title: string; employerId: string; company: string; city: string; type: 'Full-time' | 'Part-time' | 'Contract'; salary: string; category: string; status: 'Activ' | 'În verificare' | 'Pauză' | 'Închis'; applications: number; description: string; createdAt: string; }
export interface Application { id: string; candidateId: string; candidate: string; jobId: string; job: string; company: string; status: 'Nouă' | 'În evaluare' | 'Interviu' | 'Angajat' | 'Respins'; createdAt: string; }
export interface Event { id: string; title: string; date: string; time: string; city: string; type: 'Interviu' | 'Târg de joburi' | 'Webinar'; attendees: number; status: 'Programat' | 'Finalizat' | 'Anulat'; description: string; }
export interface Notification { id: string; title: string; description: string; type: 'candidate' | 'employer' | 'job' | 'system'; read: boolean; createdAt: string; }
export interface Transaction { id: string; company: string; type: 'Abonament' | 'Credite' | 'Rambursare'; amount: number; status: 'Finalizată' | 'În așteptare'; createdAt: string; }
export interface Ticket { id: string; subject: string; author: string; email: string; priority: 'Scăzută' | 'Medie' | 'Ridicată'; status: 'Deschis' | 'În lucru' | 'Rezolvat'; message: string; reply: string; createdAt: string; }
export interface Admin { id: string; name: string; email: string; role: 'Administrator' | 'Moderator' | 'Suport'; status: 'Activ' | 'Invitat'; }
export interface Settings { name: string; email: string; phone: string; company: string; jobApproval: boolean; employerVerification: boolean; emailNotifications: boolean; weeklyReport: boolean; twoFactor: boolean; }
export interface Activity { id: string; description: string; type: 'candidate' | 'employer' | 'job' | 'system'; createdAt: string; }
export interface Database { candidates: Candidate[]; employers: Employer[]; jobs: Job[]; applications: Application[]; events: Event[]; notifications: Notification[]; transactions: Transaction[]; tickets: Ticket[]; admins: Admin[]; settings: Settings; activity: Activity[]; }
export type Collection = Exclude<keyof Database, 'settings' | 'activity'>;
export type Entity = Candidate | Employer | Job | Application | Event | Notification | Transaction | Ticket | Admin;
export interface EntityMutation { collection: Collection; id: string; changes: Record<string, unknown>; }
export interface EntityCreation { collection: Collection; record: Record<string, unknown>; }
