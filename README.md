# DiviGrow Notes


DiviGrow Notes is a minimal full-stack web app that stores notes in PostgreSQL.

It includes:
- A React + Vite frontend for adding and deleting notes.
- A Node.js + Express backend with PostgreSQL persistence.
- Docker and Docker Compose setup for local and EC2 deployment.

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
- Example database name: divi_db

4. Apply the schema:

```bash
psql -U postgres -d divi_db -f database/init.sql
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
- DB_NAME=divi_db

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

## Docker Deployment

For the EC2 deployment stack, use `docker-compose.yml` from the repository root.

- Frontend: http://51.20.137.175:3000
- Backend: http://51.20.137.175:5001
- Database volume: `postgres_data`

For the Jenkins build pipeline, use `docker-compose.jenkins.yml` and `Jenkinsfile`.

- Frontend build/dev port: 3001
- Backend build/dev port: 5002
- Database volume: `postgres_data_jenkins`

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
- GET /api/notes
- POST /api/notes
- PUT /api/notes/:id
- DELETE /api/notes/:id

Note payload shape:

```json
{
	"title": "Release checklist",
	"content": "Optional text"
}
```
