# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Run both client and server concurrently (recommended)
npm start

# Development mode with hot reload (nodemon + React dev server)
npm run dev

# Run independently
npm run start:server    # Express on port 3001
npm run start:client    # React on port 3000
npm run dev:server      # Server with nodemon auto-restart
```

### Client (from /client)
```bash
npm start          # Dev server
npm run build      # Production build
npm test           # React test runner
```

### Server (from /server)
```bash
npm start          # Start server
npm run dev        # Start with nodemon
```

### Python Scripts (from /scripts)
```bash
pip install -r requirements.txt
python find_duplicate_texts.py
python update_municipality.py
```

### Install All Dependencies
```bash
npm run install:all
```

## Environment Variables

**Client** (`client/.env`):
- `REACT_APP_API_URL` — Express server URL (default: `http://localhost:3001`)

**Server** (`server/.env`):
- `MONGODB_URI` — MongoDB Atlas connection string (database: `visualTextDB`)
- `JWT_SECRET` — JWT signing key
- `PORT` — Server port (default: 3001)
- `CLIENT_URL` — CORS origin for the React client
- `AWS_REGION`, `S3_BUCKET_NAME` — AWS S3 for photo storage

## Architecture

This is a **full-stack typography research application** for crowdsourced annotation of sign/typeface photos across municipalities.

### Stack
- **Frontend**: React 19, Chakra UI, React Router, Recharts, Mapbox GL
- **Backend**: Node.js/Express (single file: `server/server.js`)
- **Database**: MongoDB Atlas via Mongoose (`visualTextDB` db, `photos` + `users` collections)
- **Storage**: AWS S3 (`typeface-s3-photo-bucket`, path prefix `Font+Census+Data/`)
- **Auth**: JWT (24h expiry, stored in localStorage), bcryptjs password hashing
- **Scripts**: Python utilities for data migration/deduplication (use pymongo + python-dotenv)

### Data Model

The core entity is a **Photo** with nested **Substrates** and **Typefaces**:

```
Photo
├── status: unclaimed → claimed → in_progress → finished
├── municipality, custom_id, initials (assigned labeler)
└── substrates[]
    ├── placement, additionalNotes, confidence, thisIsntReallyASign
    └── typefaces[]
        ├── typefaceStyle[], copy, letteringOntology[]
        ├── messageFunction[], covidRelated, additionalNotes
```

Enumerated values for `typefaceStyle`, `letteringOntology`, `placement`, and `messageFunction` are defined in `client/src/constants.js`.

### Request Flow

```
React SPA (port 3000)
  → Axios (with JWT Bearer token header)
  → Express server.js (port 3001)
  → Mongoose aggregation pipelines / CRUD
  → MongoDB Atlas (visualTextDB)
```

All photo images are stored in S3; the server constructs URLs on the fly from `custom_id`.

### Key Pages
- **LabelingPage** — Photo annotation workflow: claim, annotate substrates/typefaces, finish
- **Dashboard** — Recharts bar/pie charts from `/api/stats/*` endpoints, optionally rendered as a Mapbox map
- **TableView** — Paginated, filterable, searchable table of all photos
- **MapView** — Mapbox GL map colored by selected feature (typeface style, placement, etc.)

### Server Structure

`server/server.js` is a single ~1250-line Express file containing all routes:
- **Public stats routes** (`/api/stats/*`) — MongoDB aggregation pipelines, no auth required; each supports optional `/:muni` param for municipality filtering
- **Auth routes** (`/api/auth/*`) — register, login, logout, verify
- **Photo management routes** (`/api/photos/*`) — JWT-protected; enforces status workflow
- **Batch import** (`POST /api/batch-import`) — streams JSONL via Multer (memory storage), deduplicates by `custom_id`
- **Map data** (`GET /api/map-data`) — aggregates per-municipality counts for a given `feature`/`subFeature`
