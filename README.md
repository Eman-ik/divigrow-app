# DiviGrow

DiviGrow is a full-stack dividend portfolio tracker.

It includes:
- A React + Vite frontend for managing holdings and viewing portfolio metrics.
- A Node.js + Express backend with PostgreSQL persistence.
- Mock market price and dividend yield utilities for calculations.

## Features

- Login-protected access to holdings and dashboard.
- Add, edit, and delete holdings.
- Track total portfolio value.
- Track annual and monthly dividend income.
- Set a monthly dividend goal and view progress.
- View sector allocation breakdown.
- Run a "What If" calculator for hypothetical purchases.

## Demo Login

Use these credentials on the frontend login screen:

- Username: divi
- Password: divi123

## Tech Stack

- Frontend: React 19, Vite 8
- Backend: Express 5, Node.js
- Database: PostgreSQL

## Project Structure

- client: React frontend
- server: Express API + PostgreSQL integration

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL 14+

## Setup

1. Install frontend dependencies:

```bash
cd client
npm install
```

2. Install backend dependencies:

```bash
cd ../server
npm install
```

3. Create a PostgreSQL database:
- Example database name: divigrow_db

4. Apply the schema:

```bash
psql -U postgres -d divigrow_db -f database/init.sql
```

5. Configure backend environment variables.
- Create server/.env and set values (see Environment Variables section).

6. Optionally configure frontend API URL.
- Create client/.env and set VITE_API_URL if different from default.

## Environment Variables

Backend variables (server/.env):

- PORT=4000
- CORS_ORIGIN=http://localhost:5173
- DB_HOST=localhost
- DB_PORT=5432
- DB_USER=postgres
- DB_PASSWORD=postgres
- DB_NAME=divigrow_db
- DEMO_USERNAME=divi
- DEMO_PASSWORD=divi123
- AUTH_TOKEN=divigrow-demo-token

Frontend variables (client/.env):

- VITE_API_URL=http://localhost:4000/api

If VITE_API_URL is not set, the frontend defaults to http://localhost:4000/api.

## Run Locally

Start backend:

```bash
cd server
npm run dev
```

Start frontend (in another terminal):

```bash
cd client
npm run dev
```

App URL:
- Frontend: http://localhost:5173
- API: http://localhost:4000

## Available Scripts

Client:
- npm run dev
- npm run build
- npm run lint
- npm run preview

Server:
- npm run dev
- npm start
- npm test

## API Endpoints

- GET /api/health
- POST /api/auth/login
- GET /api/holdings
- POST /api/holdings
- PUT /api/holdings/:id
- DELETE /api/holdings/:id

Login payload shape:

```json
{
	"username": "divi",
	"password": "divi123"
}
```

Successful login response:

```json
{
	"token": "divigrow-demo-token",
	"username": "divi"
}
```

Authorization for holdings endpoints:

```http
Authorization: Bearer <token>
```

Holding payload shape:

```json
{
	"ticker": "AAPL",
	"shares": 10,
	"avg_price": 180.5,
	"sector": "Technology"
}
```

## Notes

- Live market data is not currently integrated.
- Price and yield values are generated from mock utilities in the frontend.
