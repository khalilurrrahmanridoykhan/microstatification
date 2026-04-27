# Malaria Reporting

This project now runs fully on a local stack:

- React + Vite frontend
- Express API
- SQLite database stored at `data/malaria-reporting.sqlite`

## Run locally

Install dependencies:

```sh
npm install
```

Start the full development stack:

```sh
npm run dev
```

- Frontend: `http://127.0.0.1:8080`
- API: `http://127.0.0.1:3000`

Start the production-style local server:

```sh
npm run start
```

- App + API: `http://127.0.0.1:3000`

## Demo credentials

- Admin: `admin@test.com` / `123456`
- SK: `sk1@test.com` / `123456`

Additional seeded SK users:

- `sk2@test.com` / `123456`
- `sk3@test.com` / `123456`

## Notes

- The database is created and seeded automatically on server start.
- The application uses only the local Express + SQLite stack.
