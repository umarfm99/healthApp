# Health Insight Tracker — Netlify + Neon (Postgres) Integration

This project is a static front-end with Netlify Functions to persist user entries to a Postgres database (Neon or any Postgres-compatible DB).

Setup

- Install dependencies:

```
npm install
```

- Set your database connection string in Netlify (or locally) as `DATABASE_URL`.
  - Neon provides a connection string you can use.
  - Example (Netlify UI): Site settings → Build & deploy → Environment → Add environment variable.

- To run locally (recommended to install Netlify CLI):

```
npm install -g netlify-cli
netlify dev
```

Notes

- The Netlify Functions live in `netlify/functions/`.
- `save-entry` inserts a row and returns up to 30 most recent entries.
- `get-entries` returns up to 30 stored entries.
- For local development with Postgres that requires SSL, leave `LOCAL_DEV` unset; when developing with a local Postgres without SSL you can set `LOCAL_DEV=true` in your environment to disable the SSL override.

Security

- Never commit your database credentials. Use Netlify environment variables for production.
Health Insight Tracker A simple browser-based health tracking app that helps users log daily health data and identify potential risks and trends over time.

⚠️ For educational purposes only. Not a medical application.

Features Log daily health data (sleep, water, stress, symptoms) Automatic daily health risk scoring 7-day trend detection (sleep, stress, symptoms) 

Visual charts for sleep and stress trend Clean, responsive U Offline-first (LocalStorage)

Built With HTML CSS Vanilla JavaScript Canvas API How to Use Clone or download the repository 

Open index.html in your browser

Enter daily health data and view insights instantly

No setup required. 
Future Improvements 

Health trend predictions 
Data export (CSV/PDF)
Dark mode 

Notifications

Disclaimer 
This application does not provide medical advice or diagnosis.
