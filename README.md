# Lovv Web

Lovv is a web app prototype for curated small-city travel recommendations across Korea and Japan.

The current frontend MVP is implemented with React, TypeScript, Vite, and Tailwind CSS.

## Current MVP Scope

- Google mock signup gate before onboarding
- Split-screen service intro on the first login screen
- Travel mood onboarding with Korea-first city themes
- Main Lovv landing screen with theme hashtags and a small-city map preview
- AI itinerary chat mock with trip-duration guide chips and festival-inclusion choices
- Generated itinerary detail below the chat

## Product Direction

Lovv provides a small-city travel recommendation curation service.

- It recommends Korea and Japan small-city candidates based on mood and travel pace.
- It uses chat to narrow trip duration, festival inclusion, walking intensity, and itinerary tone.
- It is designed to expand into liking, saving itineraries to My Page, and post-trip reviews.

## Scripts

```bash
cd frontend
npm run dev
npm test
npm run lint
npm run build
```

## Repository Structure

```text
.
├── docs/                 # MVP specs and reference notes
├── frontend/             # Current React frontend prototype
│   ├── src/
│   └── tests/
├── backend/              # Reserved for future backend app
├── database/             # Reserved for DB schema, migrations, seeds, ERD
├── models/               # Reserved for AI model and inference assets
├── wiki/                 # Team conventions and mdBook docs
└── .github/              # GitHub templates and workflows
```

## Development Notes

Feature additions should be committed in small, reviewable chunks and pushed to `JJonyeok2/Lovv_web`.

Before pushing, run the relevant checks:

- `cd frontend && npm test`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`

## License

See [LICENSE](./LICENSE).
