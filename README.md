# RescueBite — Real-time Food Redistribution Platform

---

Demo Vedio Link - https://drive.google.com/drive/folders/1e_89ZNu32EtfCPG9wHIJsC_QxHVl3lS9

---

#Innovation Points
- Expiry-Urgency Adaptive Discovery Feed
- Global impact map of a donor,ngo
- Realtime tracking of volunteer availability for food collection
- Customised smart priority based food dispatch scheduling sequences
- Competetive leaderboard profile generation for NGO and DONORS
---

Short Description :- 

Our web application works as a bridge between food donors and NGOs.
Donors upload surplus food details, which are sent to nearby NGOs.
NGOs assign volunteers for pickup, and the food is collected and distributed to people in need, with real-time tracking ensuring transparency.

Smart real-time system to convert surplus food into meals through coordinated donors, NGOs, and volunteers.

---
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + Socket.IO
- Database/Auth: Supabase (PostgreSQL, Realtime, Storage)
- Real-time: Socket.IO + Supabase Realtime
- Goals: reduce food waste, minimize hunger, ensure trusted last-mile redistribution

---

## What the project does

- Allows **donors** (restaurants/individuals/events) to post surplus food listings with:
  - item details, quantity, freshness, pickup timing, photos
- Allows **NGOs** to:
  - discover nearby listings
  - claim food items
  - assign volunteers
  - monitor live delivery status
  - track impact (kg saved, meals served, people helped)
- Supports **volunteers** with:
  - task assignment notifications
  - pickup workflows (arrival checkpoint, OTP verification, photo proof)
  - live GPS tracking back to NGO locations
  - task completion and confirmation
- Enables **admin/analytics**:
  - real-time status dashboards and historical reports
  - waste avoidance metrics + NGO performance
  - notification audits and safety alerts

---

## Core workflows

1. **Donor creates listing**
   - Surplus item metadata, expiry/time window, service areas.
   - Instantly visible to valid NGOs in radius.
2. **NGO claims listing**
   - Select and reserve listing → claim record created.
   - Auto OTP generated for verified pickup handoff.
3. **Volunteer dispatch**
   - NGO assigns volunteer to claim (manual/auto rank).
   - Volunteer receives push/SMS & map route.
4. **Pickup execution**
   - Volunteer marks “Arrived”
   - OTP check with donor
   - Photo evidence upload
   - Mark “Picked up”
5. **Delivery and closure**
   - Live location feed to NGO dashboard
   - Delivery validation at NGO point
   - Impacts auto-logged (kg, meals, people)
6. **Feedback & trust**
   - Ratings between stakeholder pairs
   - Claim/volunteer feedback loop for trust scoring

---

## Feature highlights

- Multi-role system (Donor / NGO / Volunteer / Admin)
- Real-time listing discovery and claim visibility
- Full task lifecycle tracking (available → claimed → assigned → pickup → complete)
- OTP + proof-based secure handoff
- Continuous location tracking (SOS / deviation alerts)
- Impact attribution and leaderboard points
---

## Tech stack

### Frontend
- React 18 + Vite
- TypeScript
- TailwindCSS
- React Hook Form 
- Leaflet + Open Street View
- Socket.IO client
- Axios for API
- Recharts for analytics

### Backend
- Node.js (20+)
- Express 5
- Socket.IO
- Supabase client
- Rate limiting + helmet
- Express-validator
- JWT auth
- OpenAI for optional description automation

### Database
- Supabase / PostgreSQL

---

## Quick Start

### 1. Clone
\`\`\`bash
git clone https://github.com/karthik420108/Smart-food-redistribution-system.git
cd Smart-food-redistribution-system
\`\`\`

### 2. Backend
\`\`\`bash
cd server
npm install
cp .env.example .env
# Fill .env with your Supabase
npm run build
npm run dev
\`\`\`

API: `http://localhost:5000/api`
Health: `http://localhost:5000/api/health`

### 3. Frontend
\`\`\`bash
cd ../client
npm install
npm run dev
\`\`\`
Default dev: `http://localhost:5173`

### 4. Key scripts
- `npm run dev` (dev server)
- `npm run build` (TypeScript + bundle)
- `npm run lint` (client ESLint)

---

## Environment variables (sample)

- `PORT`, `SUPABASE_URL`, `SUPABASE_KEY`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`
- `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`

---

## Project structure

- `client/`
  - `src/pages`: role-based portals (ngos, volunteers, donors, auth)
  - `src/components`: shared UI
  - `src/store`: Zustand
  - `src/lib`: API + helpers

- `server/`
  - `src/routes`: express routes
  - `src/controllers`: business logic
  - `src/middleware`: auth/validation/error handling
  - `src/lib`: supabase/socket utilities

- `supabase/migrations`: DB schema (listings, claims, users, tasks)

---

## Deployment notes

- Build frontend, host on CDN-friendly platform
- Run backend on Node service
- Setup Supabase security rules and API CORS
- Use Redis/Bull when scaling background jobs

---



Note: The command triggered a backend startup error (supabaseUrl is required) because server run context lacks .env values; this is unrelated to README edits.

Raptor mini (Preview) • 1x
