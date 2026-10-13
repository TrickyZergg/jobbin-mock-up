# Jobbin Admin

A responsive Romanian admin prototype for the team operating the entire Jobbin platform. It manages all candidate accounts, employers, listings, applications, events, platform revenue, and support requests. The design follows the provided Jobbin brand: royal blue, pink accents, dark navy typography, white rounded cards, subtle borders, and a familiar navigation rail.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Additional commands:

```sh
npm run build          # TypeScript check and production bundle
npm run build:portable # Equivalent static build for restricted Windows environments
npm run preview        # Serve the production bundle locally
npm test               # Unit and integration tests
npm run test:watch     # Interactive test runner
npm run test:coverage  # Coverage report
```

## Included workflows

- Dashboard with platform metrics, activity, and navigation to operational pages.
- Candidates and employers: searchable records, filters, profiles, record management, and moderation.
- Jobs, applications, and events: local management, status changes, and review flows.
- Notifications: category and unread filters, individual or bulk read actions, and notification creation.
- Încasări: accurate totals from completed transactions, filters, CSV exports, simulated credit purchases, and confirmed refunds. A transaction can only be refunded once.
- Support: search and priority filters, ticket creation, saved responses, resolution, and reopening.
- Reports: selectable periods, computed metrics, application status distribution, city breakdown, accessible SVG chart, and CSV export for the selected period.
- Settings: profile editing, platform preferences, local team invitations and roles, protection for the last active administrator, and confirmed restoration of the demo dataset.
- Mobile navigation, keyboard-accessible dialogs, empty states, loading feedback, and success/error toasts.

All interface copy and seeded records are in Romanian. Changes remain in the browser between page reloads. Reset the demonstration from **Setări → Resetează demonstrația** to restore the original dataset.

## Architecture

```text
src/
  components/
    atoms/          # Buttons, inputs, badges, avatars, loading indicators
    molecules/      # Search fields, dialogs, panels, page headers, pagination
    organisms/      # Navigation and application shell
  pages/            # Page compositions and domain-specific interactions
  services/         # Seed data and the RTK Query API with a local transport
  store/            # Redux Toolkit store, UI state, typed Redux hooks
  types/            # Domain models and API mutation contracts
  utils/            # Formatting, status mapping, CSV export
  test/             # Shared test setup
```

React and TypeScript provide the interface; React Router handles navigation. Redux Toolkit and RTK Query own server-like state, caching, mutations, and invalidation. UI state is separate from domain data. SCSS uses BEM naming and starts with phone layouts, adding larger-screen layouts with `min-width` media queries. Pages compose the shared atomic components.

The mock transport returns the same query/mutation result shapes expected by RTK Query. Page components call generated hooks and use `.unwrap()` for mutations, so changing the transport does not require rewriting the interface. Local browser persistence makes the prototype suitable for a repeatable employer presentation.

## Connecting a backend

1. Replace the local transport in `src/services/adminApi.ts` with `fetchBaseQuery` or a custom authenticated transport.
2. Map existing query and mutation endpoints to your backend routes. Keep the domain types in `src/types/index.ts` aligned with validated API responses.
3. Retain RTK Query cache tags and mutation invalidation so lists, counters, and reports update after edits.
4. Add real authentication, session refresh, and server-enforced authorization. The demo's role selection is presentation state and does not secure access.
5. Connect payment/refund providers, email delivery, invitations, and two-factor enrollment. Enforce financial limits, duplicate protection, and audit logging on the server.
6. Move aggregation and pagination to backend endpoints when working with production-sized datasets. Add timezone, currency precision, and API error handling requirements to the API contract.

The UI supports these workflows locally; no external messages or financial transactions are sent. Security and notification switches save preferences but do not activate external services. Dates in the initial demonstration use 12 October 2026 as the reporting reference; newly created records are included in reports. This is a presentation prototype, not a production admin service.

## Testing

Tests cover meaningful formatting, data mutations, and interface workflows using Vitest, React Testing Library, and jsdom. Run `npm test` and `npm run build` before handing over changes. The SVG report reads actual filtered records; exported reports and transaction CSV files use the same values shown on screen.

For deployment under a subdirectory, configure Vite's `base` and your router basename. If using a history-based router, configure the host to serve `index.html` for application routes.
