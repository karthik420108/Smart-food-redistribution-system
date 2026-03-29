# FoodBridge — Real-Time Surplus Food Redistribution Platform

<div align="center">

**Bridging the gap between surplus food and communities in need — in real time.**

[![Built With](https://img.shields.io/badge/Built%20With-React%2018%20%7C%20Node.js%20%7C%20Supabase-teal?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)]()
[![Status](https://img.shields.io/badge/Status-Hackathon%20Build-blueviolet?style=flat-square)]()

</div>

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [System Architecture](#4-system-architecture)
5. [Tech Stack](#5-tech-stack)
6. [Core Algorithms](#6-core-algorithms)
7. [Database Schema](#7-database-schema)
8. [Dashboard Specifications](#8-dashboard-specifications)
   - 8.1 [Admin Dashboard](#81-admin-dashboard)
   - 8.2 [Donor Dashboard](#82-donor-dashboard)
   - 8.3 [NGO Main Dashboard](#83-ngo-main-dashboard)
   - 8.4 [Volunteer App](#84-volunteer--employee-app)
9. [Real-Time System Design](#9-real-time-system-design)
10. [AI/ML Module](#10-aiml-module)
11. [Security & Fraud Prevention](#11-security--fraud-prevention)
12. [API Reference](#12-api-reference)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Environment Variables](#14-environment-variables)
15. [Installation & Setup](#15-installation--setup)
16. [Impact Metrics & SDG Alignment](#16-impact-metrics--sdg-alignment)
17. [Roadmap](#17-roadmap)
18. [Our Innovations](#18-our-innovations)
    - 18.1 [Expiry-Urgency Adaptive Discovery Feed](#181-expiry-urgency-adaptive-discovery-feed)
    - 18.2 [Global Impact Points System](#182-global-impact-points-system)
    - 18.3 [Real-Time Volunteer Availability Tracking](#183-real-time-volunteer-availability-tracking)
    - 18.4 [Smart Priority-Based Food Dispatch Scheduling](#184-smart-priority-based-food-dispatch-scheduling)
    - 18.5 [Competitive Leaderboard & Profile Generation](#185-competitive-leaderboard--profile-generation)

---

## 1. Executive Summary

FoodBridge is a production-grade, AI-powered surplus food redistribution platform that connects food donors — restaurants, hotels, caterers, households, and retailers — with verified NGOs and community kitchens who serve people in need. The platform operates through four interconnected portals: an **Admin Portal** for platform governance, a **Donor Dashboard** for listing surplus food, an **NGO Command Center** for claiming and coordinating redistribution, and a **Volunteer App** for field-level pickup and delivery execution.

The system is inspired by the operational mechanics of food delivery platforms like Swiggy and Blinkit — donors are analogous to restaurants, NGOs are analogous to dark stores or distribution hubs, and volunteers are the delivery partners who execute the last-mile logistics. This proven operational model is applied entirely to the humanitarian problem of food waste and hunger.

FoodBridge targets a critical and underserved gap: while approximately **40% of food produced globally is wasted** and **820 million people go hungry**, the barrier is not food availability but the absence of a trusted, real-time coordination infrastructure.

---

## 2. Problem Statement

### The Core Gap

A significant amount of food waste occurs at the consumer and provider level due to the absence of efficient redistribution systems. Surplus food often goes unused because there is no real-time mechanism to connect individuals or providers with those who need it.

### Breakdown of Sub-Problems

| Sub-Problem | Impact | Current State |
|---|---|---|
| No real-time visibility of surplus food | Food expires before anyone knows it exists | WhatsApp groups, phone calls |
| No trusted identity verification | Fraudulent claims, misuse of food aid | Manual paper processes |
| No structured last-mile logistics | Surplus food cannot reach distribution centers | Informal volunteer networks |
| No coordination layer between NGO and field workers | Pickup delays, failed collections | Phone/WhatsApp coordination |
| No impact tracking | Donors have no visibility into food's final use | No feedback loop |
| No predictive demand signals | NGOs cannot plan ahead | Reactive, not proactive |

### Quantified Opportunity

- India wastes **67 million tonnes** of food annually (UNEP, 2021)
- **194 million Indians** are undernourished (FAO, 2022)
- Only **~3%** of surplus food is currently redistributed in an organized manner
- The gap is not supply — it is **coordination infrastructure**

---

## 3. Solution Overview

### How FoodBridge Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        FOODBRIDGE PLATFORM                       │
│                                                                   │
│  DONOR           NGO ADMIN          VOLUNTEER         ADMIN      │
│  ─────           ─────────          ─────────         ─────      │
│  Posts food  →   Sees listing   →   Gets assigned  →  Governs    │
│  listing         Claims food        Picks up food     platform   │
│                  Assigns task       Delivers to NGO              │
│                  Tracks live        Logs impact                  │
│                  Views impact                                     │
└─────────────────────────────────────────────────────────────────┘
```

### The Full Journey (Step by Step)

**Step 1 — Donor lists food:** A restaurant has 30 kg of surplus biryani after an event. They open the Donor Dashboard, create a food listing with photos, quantity, expiry time (2 hours), and pickup window. An AI assistant generates a rich description and safety notes automatically.

**Step 2 — Smart matching:** The platform's proximity-based matching algorithm identifies all verified NGOs within the listing's configurable radius (default 10 km). Eligible NGOs receive real-time push notifications and see the listing appear live on their map.

**Step 3 — NGO claims:** The NGO coordinator sees the listing on their Discover Food map, reviews it, and claims 30 kg. The claim records a 6-digit pickup OTP that will be used later to verify the handover.

**Step 4 — Task assignment:** The NGO opens the Task Assignment Board. The system shows available volunteers ranked by proximity to the pickup location, vehicle type match, and current workload. The coordinator drags the claim card onto a volunteer, or uses the AI-suggested assignment. The volunteer is notified instantly via push notification and SMS.

**Step 5 — Volunteer executes pickup:** The volunteer app shows full donor details (name, phone, address, map navigation). The volunteer navigates to the pickup, marks "Arrived", enters the 6-digit OTP provided by the donor to verify identity, photographs the food, and marks "Picked Up".

**Step 6 — Transit tracking:** While the volunteer travels to the NGO's distribution center, their GPS location updates every 10 seconds. The NGO coordinator watches the moving dot on their Live Tracking map with a live ETA.

**Step 7 — Delivery and impact log:** The volunteer arrives at the NGO center, logs the actual quantity received and food condition, and marks the task complete. The donor receives a confirmation notification. Impact is automatically calculated and added to the NGO's cumulative totals.

**Step 8 — Feedback loop:** Both parties can rate each other. The donor sees on their dashboard: "Your 30 kg of biryani provided an estimated 75 meals to 60 people in Koramangala." This closes the feedback loop and drives repeat donor behaviour.

---

## 4. System Architecture

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                 │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Admin Portal │  │Donor Dashboard│  │ NGO Dashboard│  │ Volunteer  │ │
│  │ React 18     │  │ React 18      │  │ React 18     │  │ PWA App    │ │
│  │ /admin       │  │ /donor        │  │ /ngo         │  │ /volunteer │ │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘  └─────┬──────┘ │
└─────────┼─────────────────┼──────────────────┼────────────────┼────────┘
          │                 │                  │                │
          └─────────────────┴──────────────────┴────────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │    API GATEWAY LAYER      │
                         │  Node.js + Express        │
                         │  Rate limiting, Auth,     │
                         │  Input validation,        │
                         │  Audit logging            │
                         └────────────┬────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
┌─────────▼─────────┐    ┌────────────▼───────────┐  ┌──────────▼────────┐
│  SUPABASE LAYER    │    │   REAL-TIME LAYER       │  │   AI/ML LAYER     │
│                    │    │                         │  │                   │
│ PostgreSQL DB      │    │ Socket.io (Chat,        │  │ OpenAI GPT-4o     │
│ Supabase Auth      │    │   Live tracking,        │  │ (Descriptions,    │
│ Supabase Realtime  │    │   Task events)          │  │  Matching,        │
│ Supabase Storage   │    │                         │  │  Forecasting,     │
│ Row Level Security │    │ Supabase Realtime       │  │  Fraud scoring)   │
│                    │    │ (DB change streams)     │  │                   │
└───────────────────┘    └─────────────────────────┘  └───────────────────┘
          │
┌─────────▼───────────────────────────┐
│         BACKGROUND SERVICES          │
│                                      │
│  BullMQ + Redis (job queues)         │
│  node-cron (scheduled jobs)          │
│  Twilio (SMS notifications)          │
│  Firebase FCM (push notifications)   │
│  Nodemailer (email via SMTP)         │
│  Puppeteer (PDF report generation)   │
└──────────────────────────────────────┘
```

### Request Flow Architecture

```
Client Request
     │
     ▼
Cloudflare CDN (static assets, DDoS protection)
     │
     ▼
Vercel Edge (React SPA, served globally)
     │  API calls
     ▼
Railway.app (Node.js Express server)
     │
     ├── JWT Middleware (verify token, decode role)
     ├── Rate Limit Middleware (express-rate-limit + Redis)
     ├── Input Validation (express-validator + Zod)
     ├── Audit Log Middleware (log every mutating request)
     │
     ▼
Route Handler
     │
     ├── Supabase Service Role Client (DB operations)
     ├── Socket.io (emit real-time events)
     ├── BullMQ (enqueue background jobs)
     └── External APIs (OpenAI, Twilio, FCM, Maps)
```

### Data Flow — Food Listing to Impact Log

```
Donor creates listing
        │
        ▼
food_listings table (status: available)
        │
        ├── Supabase Realtime → NGO Discover page (live map pin appears)
        ├── FCM push → all NGOs within radius
        │
        ▼
NGO claims listing
        │
        ▼
ngo_food_claims table (status: pending_assignment)
        │
        ├── Socket.io → ngo_{ngo_id} room → Task Assignment Board
        │
        ▼
NGO assigns volunteer
        │
        ▼
volunteer_tasks table (status: assigned)
        │
        ├── FCM push → volunteer device (instant notification)
        ├── SMS via Twilio → volunteer phone
        ├── Socket.io → volunteer_{volunteer_id} room
        │
        ▼
Volunteer executes task (series of status updates)
        │
        ├── volunteer_location_logs (GPS every 10s)
        │     └── Socket.io → ngo_{ngo_id} → Live Tracking map
        │
        ├── OTP verification → ngo_food_claims.pickup_otp_verified = true
        │
        ├── Photo proof → Supabase Storage (task-proofs bucket)
        │
        ▼
Task completed
        │
        ▼
impact_logs table (kg, meals, people)
        │
        ├── donors table: total_donations += 1, total_kg_donated += X
        ├── ngo_organizations: total_kg_received += X
        ├── ngo_volunteers: total_kg_collected += X, total_tasks_completed += 1
        │
        ▼
Donor receives completion notification
FCM push + email: "Your food reached X people"
```

---

## 5. Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework with concurrent features |
| Vite | 5.x | Build tool, HMR, code splitting |
| TypeScript | 5.x | Type safety across entire codebase |
| TailwindCSS | 3.x | Utility-first styling |
| shadcn/ui | latest | Accessible component library |
| Framer Motion | 11.x | Page transitions, micro-animations |
| Zustand | 4.x | Lightweight global state management |
| React Hook Form | 7.x | Performant form handling |
| Zod | 3.x | Schema validation (shared with backend) |
| Recharts | 2.x | Data visualization and analytics charts |
| Mapbox GL JS | 3.x | Interactive maps, live tracking, clustering |
| TanStack Table | 8.x | Advanced data tables with virtualization |
| react-window | 1.x | Virtualized lists for 500+ item feeds |
| react-big-calendar | 1.x | Shift scheduling calendar |
| next-themes | 0.x | Dark mode with system preference sync |
| react-hot-toast | 2.x | Toast notifications |
| axios | 1.x | HTTP client with interceptors |
| socket.io-client | 4.x | WebSocket client |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | JavaScript runtime |
| Express | 4.x | HTTP server framework |
| TypeScript | 5.x | Type safety |
| Socket.io | 4.x | WebSocket server for real-time events |
| BullMQ | 4.x | Background job queue |
| ioredis | 5.x | Redis client (queue + rate limiting cache) |
| node-cron | 3.x | Scheduled background jobs |
| express-rate-limit | 7.x | API rate limiting |
| express-validator | 7.x | Request input validation |
| jsonwebtoken | 9.x | JWT signing and verification |
| bcrypt | 5.x | Password hashing |
| multer | 1.x | File upload handling |
| nodemailer | 6.x | Transactional email (SMTP) |
| puppeteer | 22.x | Server-side PDF generation |
| otplib | 12.x | TOTP for admin 2FA |
| zxcvbn | 4.x | Password strength estimation |

### Database & Infrastructure

| Technology | Purpose |
|---|---|
| Supabase (PostgreSQL 15) | Primary relational database |
| Supabase Auth | User authentication and session management |
| Supabase Realtime | Database change streaming to clients |
| Supabase Storage | File storage (images, documents, PDFs) |
| Row Level Security (RLS) | Database-level access control per user |
| Redis (Railway) | BullMQ queue, rate limiting, session cache |

### External Services

| Service | Purpose |
|---|---|
| OpenAI GPT-4o | AI descriptions, matching, fraud scoring, insights |
| Twilio | SMS notifications to volunteers and NGOs |
| Firebase Cloud Messaging | Push notifications (Android + iOS + web) |
| Google Maps / Mapbox | Geocoding, distance matrix, directions |
| Razorpay | Optional premium donor subscriptions |
| Sentry | Error monitoring and performance tracing |

---

## 6. Core Algorithms

### 6.1 Proximity-Based NGO Matching Algorithm

When a donor publishes a food listing, the platform must instantly identify which NGOs should be notified. This uses the **Haversine formula** for spherical distance calculation, combined with preference filtering.

```typescript
// Haversine distance formula — accurate for distances < 2000km
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findEligibleNGOs(listing: FoodListing): Promise<NGO[]> {
  // Step 1: Spatial filter — pull NGOs with bounding box (fast, index-friendly)
  // Bounding box: ±(radius/111) degrees lat, ±(radius/(111*cos(lat))) degrees lng
  const latDelta = listing.notifyRadiusKm / 111;
  const lngDelta = listing.notifyRadiusKm / (111 * Math.cos(toRad(listing.lat)));

  const candidateNGOs = await supabase
    .from('ngo_organizations')
    .select('*')
    .eq('status', 'verified')
    .gte('primary_lat', listing.lat - latDelta)
    .lte('primary_lat', listing.lat + latDelta)
    .gte('primary_lng', listing.lng - lngDelta)
    .lte('primary_lng', listing.lng + lngDelta);

  // Step 2: Precise Haversine filter (eliminates bounding box corners)
  const withinRadius = candidateNGOs.data.filter(ngo =>
    haversineDistance(listing.lat, listing.lng, ngo.primary_lat, ngo.primary_lng)
    <= ngo.service_radius_km
  );

  // Step 3: Preference filter — dietary restrictions and food type match
  const matched = withinRadius.filter(ngo => {
    const dietaryOk = ngo.dietary_restrictions.length === 0 ||
      ngo.dietary_restrictions.every(r => listing.tags.includes(r));
    const typeOk = ngo.food_type_preferences.length === 0 ||
      ngo.food_type_preferences.includes(listing.category);
    return dietaryOk && typeOk;
  });

  // Step 4: Sort by composite score (proximity + trust score + activity)
  return matched.sort((a, b) => {
    const distA = haversineDistance(listing.lat, listing.lng, a.primary_lat, a.primary_lng);
    const distB = haversineDistance(listing.lat, listing.lng, b.primary_lat, b.primary_lng);
    const scoreA = (1 - distA / a.service_radius_km) * 0.6 + (a.trust_score / 100) * 0.4;
    const scoreB = (1 - distB / b.service_radius_km) * 0.6 + (b.trust_score / 100) * 0.4;
    return scoreB - scoreA;
  });
}
```

**Complexity:** O(N) where N is NGOs in bounding box. The bounding box SQL query runs in O(log N) with a composite spatial index on (primary_lat, primary_lng).

**Optimisation:** Supabase PostgreSQL uses a B-tree index on lat/lng columns. For production scale, this should be upgraded to a **PostGIS GiST index** with `ST_DWithin` for native geospatial queries.

---

### 6.2 Volunteer Assignment Scoring Algorithm

When an NGO needs to assign a volunteer to a pickup task, the system ranks available volunteers using a multi-factor weighted score. This is the equivalent of how Swiggy's dispatch engine selects a delivery partner.

```typescript
interface VolunteerScore {
  volunteer: Volunteer;
  score: number;
  breakdown: ScoreBreakdown;
}

interface ScoreBreakdown {
  proximityScore: number;    // 0-1: how close to pickup
  vehicleScore: number;      // 0 or 1: vehicle type matches requirement
  workloadScore: number;     // 0-1: how many tasks today (lower = better)
  ratingScore: number;       // 0-1: historical performance
  experienceScore: number;   // 0-1: familiarity with this food category
}

function scoreVolunteer(
  volunteer: Volunteer,
  task: PendingTask,
  maxDistanceKm: number = 15
): VolunteerScore {
  // Factor 1: Proximity (40% weight)
  // Volunteer's current GPS position vs pickup location
  const distKm = haversineDistance(
    volunteer.current_lat, volunteer.current_lng,
    task.pickup_lat, task.pickup_lng
  );
  const proximityScore = Math.max(0, 1 - distKm / maxDistanceKm);

  // Factor 2: Vehicle type suitability (25% weight)
  // Vehicle requirements by quantity:
  //   < 10 kg → bicycle/bike/auto acceptable
  //   10-50 kg → bike/auto/car required
  //   50-200 kg → car/van required
  //   > 200 kg → van/truck required
  const vehicleScore = vehicleMatchScore(volunteer.vehicle_type, task.quantity_kg);

  // Factor 3: Current workload (20% weight)
  // Penalise volunteers who already have tasks today
  // Max reference: 5 tasks in a day = fully loaded
  const workloadScore = Math.max(0, 1 - volunteer.tasksToday / 5);

  // Factor 4: Rating score (10% weight)
  // Normalised from 1-5 star rating
  const ratingScore = (volunteer.rating - 1) / 4;

  // Factor 5: Category experience (5% weight)
  // Count past tasks with this food category
  const experienceScore = Math.min(1, volunteer.categoryTaskCount[task.category] / 10);

  const score =
    proximityScore    * 0.40 +
    vehicleScore      * 0.25 +
    workloadScore     * 0.20 +
    ratingScore       * 0.10 +
    experienceScore   * 0.05;

  return {
    volunteer,
    score,
    breakdown: { proximityScore, vehicleScore, workloadScore, ratingScore, experienceScore }
  };
}

function rankVolunteers(volunteers: Volunteer[], task: PendingTask): VolunteerScore[] {
  return volunteers
    .filter(v => v.availability_status === 'available')
    .map(v => scoreVolunteer(v, task))
    .sort((a, b) => b.score - a.score);
}

function vehicleMatchScore(vehicleType: string, quantityKg: number): number {
  const tiers: Record<string, number> = {
    'bicycle': 1, 'bike': 2, 'auto': 3, 'car': 4, 'van': 5, 'truck': 6
  };
  const required = quantityKg < 10 ? 1 : quantityKg < 50 ? 2 : quantityKg < 200 ? 4 : 5;
  const actual = tiers[vehicleType] ?? 1;
  // Exact match or over-qualified = full score; under-qualified = 0
  return actual >= required ? 1 : 0;
}
```

**Why these weights?** Proximity (40%) matters most because it directly determines pickup speed — especially critical for food nearing expiry. Vehicle match (25%) is binary: either the food can be transported safely or it cannot. Workload (20%) prevents overloading individual volunteers and ensures fairness. Rating (10%) ensures quality over time without being punitive. Category experience (5%) is a soft preference, not a hard requirement.

---

### 6.3 Food Expiry Urgency Scoring Algorithm

Listings are scored continuously so that the most time-critical food always surfaces first in discovery feeds, regardless of when it was posted.

```typescript
function expiryUrgencyScore(listing: FoodListing): number {
  const now = Date.now();
  const expiryMs = new Date(listing.expiry_datetime).getTime();
  const createdMs = new Date(listing.created_at).getTime();

  const totalWindow = expiryMs - createdMs;     // Total time from creation to expiry
  const remaining = expiryMs - now;              // Time remaining until expiry
  const fractionRemaining = remaining / totalWindow;

  // Urgency scale:
  //   fractionRemaining > 0.75  → urgency = 0.1  (plenty of time)
  //   fractionRemaining 0.5-0.75 → urgency = 0.3
  //   fractionRemaining 0.25-0.5 → urgency = 0.6
  //   fractionRemaining < 0.25  → urgency = 0.9  (critical)
  //   expired → urgency = 1.0 (auto-expire trigger)

  if (remaining <= 0) return 1.0;
  if (fractionRemaining < 0.25) return 0.9;
  if (fractionRemaining < 0.50) return 0.6;
  if (fractionRemaining < 0.75) return 0.3;
  return 0.1;
}

// Composite listing discovery score for NGO feed sorting
function listingDiscoveryScore(
  listing: FoodListing,
  ngo: NGO
): number {
  const distKm = haversineDistance(listing.lat, listing.lng, ngo.primary_lat, ngo.primary_lng);
  const maxRadius = ngo.service_radius_km;

  const proximityScore     = Math.max(0, 1 - distKm / maxRadius);
  const urgencyScore       = expiryUrgencyScore(listing);
  const quantityScore      = Math.min(1, listing.quantity / 100); // Cap at 100kg reference
  const preferenceScore    = categoryMatchScore(listing.category, ngo.food_type_preferences);
  const dietaryScore       = dietaryMatchScore(listing.tags, ngo.dietary_restrictions);

  return (
    proximityScore  * 0.35 +
    urgencyScore    * 0.30 +
    quantityScore   * 0.15 +
    preferenceScore * 0.12 +
    dietaryScore    * 0.08
  );
}
```

**Effect:** A listing with 30 minutes remaining will always rank above a listing with 6 hours remaining, even if the 6-hour listing is closer. This ensures the platform prioritises food that is most at risk of being wasted.

---

### 6.4 Route Optimization Algorithm (Multi-Stop Pickup)

When an NGO has multiple pickups scheduled in a single day, the platform suggests an optimised route. This is a practical implementation of the **Travelling Salesman Problem (TSP)** using the **Nearest Neighbour heuristic** combined with the Google Directions API for real road distances.

```typescript
async function optimizePickupRoute(
  startLocation: LatLng,           // NGO's distribution center
  pickupLocations: PickupStop[]    // All pickups to do today
): Promise<OptimizedRoute> {


  if (pickupLocations.length <= 2) {
    // Trivial — no optimization needed
    return { stops: pickupLocations, estimatedSavingMin: 0 };
  }

  // Step 1: Build distance matrix via Google Maps Distance Matrix API
  // (or Haversine for approximation in offline mode)
  const matrix = await getDistanceMatrix([startLocation, ...pickupLocations.map(p => p.location)]);

  // Step 2: Nearest Neighbour Heuristic (O(n²) — acceptable for n < 20 stops)
  const visited = new Set<number>();
  const route: number[] = [];
  let current = 0; // Start at distribution center (index 0)

  while (visited.size < pickupLocations.length) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    for (let i = 1; i <= pickupLocations.length; i++) {
      if (!visited.has(i) && matrix[current][i] < nearestDist) {
        nearestDist = matrix[current][i];
        nearestIdx = i;
      }
    }

    visited.add(nearestIdx);
    route.push(nearestIdx - 1); // Convert back to 0-indexed pickup
    current = nearestIdx;
  }

  // Step 3: 2-opt improvement pass
  // Iteratively reverse sub-sequences to remove crossing paths
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 2; j < route.length; j++) {
        const currentCost = routeCost(route, matrix);
        const newRoute = twoOptSwap(route, i + 1, j);
        if (routeCost(newRoute, matrix) < currentCost) {
          route.splice(0, route.length, ...newRoute);
          improved = true;
        }
      }
    }
  }

  // Step 4: Compare optimized vs naive (sequential) route
  const naiveTime = pickupLocations.reduce((sum, _, i) =>
    sum + (i === 0 ? matrix[0][1] : matrix[i][i + 1]), 0);
  const optimizedTime = routeCost(route, matrix);

  return {
    stops: route.map(i => pickupLocations[i]),
    estimatedSavingMin: Math.max(0, naiveTime - optimizedTime),
    totalEstimatedMin: optimizedTime,
    googleMapsUrl: buildGoogleMapsUrl(startLocation, route.map(i => pickupLocations[i]))
  };
}
```

**Complexity:** Nearest Neighbour is O(n²); 2-opt is O(n²) per pass with a small constant number of passes. For n < 20 stops (realistic for an NGO in one day), this runs in milliseconds. For larger n, this degrades gracefully — the heuristic still produces routes within 15–20% of optimal.

---

### 6.5 Fraud Detection Rule Engine

All user actions are evaluated against a set of rules that automatically flag suspicious behaviour. This runs both synchronously (on request) and asynchronously (background job every hour).

```typescript
interface FraudRule {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  check: (context: FraudContext) => Promise<boolean>;
}

const FRAUD_RULES: FraudRule[] = [
  {
    id: 'LISTING_EXPIRY_IN_PAST',
    description: 'Listing submitted with expiry time already in the past',
    severity: 'medium',
    check: async (ctx) => new Date(ctx.listing?.expiry_datetime) < new Date()
  },
  {
    id: 'HIGH_CANCELLATION_RATE',
    description: 'More than 3 claim cancellations in 24 hours',
    severity: 'high',
    check: async (ctx) => {
      const count = await db.countRecentCancellations(ctx.userId, 24);
      return count >= 3;
    }
  },
  {
    id: 'UNREALISTIC_QUANTITY_INDIVIDUAL',
    description: 'Individual donor listing > 200 kg in a single listing',
    severity: 'medium',
    check: async (ctx) => {
      const donor = await db.getDonor(ctx.userId);
      return donor.donor_type === 'individual' && ctx.listing?.quantity > 200;
    }
  },
  {
    id: 'NEW_ACCOUNT_BURST_ACTIVITY',
    description: 'Account < 24 hours old with > 5 listings',
    severity: 'critical',
    check: async (ctx) => {
      const donor = await db.getDonor(ctx.userId);
      const ageHours = (Date.now() - new Date(donor.created_at).getTime()) / 3600000;
      const listingCount = await db.countListings(ctx.userId, 1);
      return ageHours < 24 && listingCount > 5;
    }
  },
  {
    id: 'DUPLICATE_DEVICE_FINGERPRINT',
    description: 'Multiple accounts sharing the same device fingerprint',
    severity: 'critical',
    check: async (ctx) => {
      const count = await db.countAccountsWithFingerprint(ctx.deviceFingerprint);
      return count > 1;
    }
  },
  {
    id: 'OTP_REPEATED_FAILURE',
    description: 'Volunteer failed OTP verification 3+ times on one task',
    severity: 'high',
    check: async (ctx) => (ctx.otpFailureCount ?? 0) >= 3
  }
];

async function evaluateFraudRules(context: FraudContext): Promise<FraudFlag[]> {
  const flags: FraudFlag[] = [];

  for (const rule of FRAUD_RULES) {
    const triggered = await rule.check(context);
    if (triggered) {
      flags.push({
        entity_id: context.userId,
        entity_type: context.entityType,
        flag_type: rule.id,
        severity: rule.severity,
        description: rule.description,
        auto_flagged: true,
        resolved: false
      });
    }
  }

  // Insert flags to database and notify admin
  if (flags.length > 0) {
    await db.insertFraudFlags(flags);
    await notifyAdmin(`${flags.length} fraud flag(s) raised for user ${context.userId}`);
  }

  return flags;
}
```

---

### 6.6 Trust Score Calculation Algorithm

Every NGO and donor receives a dynamic trust score (0–100) that is recalculated nightly. This score is used by the fraud detection system, the admin review system, and the volunteer assignment algorithm.

```typescript
async function calculateNGOTrustScore(ngoId: string): Promise<number> {
  const ngo = await db.getNGO(ngoId);
  const stats = await db.getNGOStats(ngoId);
  let score = 0;

  // Document completeness (max 30 points)
  if (ngo.documents.registration_cert)     score += 15;
  if (ngo.documents.tax_certificate)       score += 8;
  if (ngo.documents.annual_report)         score += 4;
  if (ngo.documents.authorization_letter)  score += 3;

  // External verification (max 20 points)
  const ngoDarpanVerified = await verifyNGODarpan(ngo.registration_number);
  if (ngoDarpanVerified)                   score += 20;

  // Contact verification (max 15 points)
  if (ngo.email_verified)                  score += 8;
  if (ngo.phone_verified)                  score += 7;

  // Activity and track record (max 25 points)
  const completionRate = stats.tasksCompleted / Math.max(1, stats.totalClaims);
  score += Math.round(completionRate * 15);   // Up to 15 points
  if (stats.totalKgReceived > 100)            score += 5;
  if (stats.uniqueDonors > 5)                 score += 5;

  // Community rating (max 10 points)
  score += Math.round(((ngo.rating - 1) / 4) * 10);

  return Math.min(100, Math.max(0, score));
}
```

---

### 6.7 Impact Estimation Algorithm

When food is collected and delivered, the platform estimates the humanitarian impact using standardised conversion factors.

```typescript
interface ImpactEstimate {
  mealsProvided: number;
  peopleServed: number;
  co2SavedKg: number;
  waterSavedLitres: number;
  monetaryValueINR: number;
}

function estimateImpact(kgReceived: number, foodCategory: string): ImpactEstimate {
  // Conversion factors (based on FAO and WRI research)
  // Average meal = 400g of food
  const KG_PER_MEAL = 0.4;

  // CO₂ equivalent saved from food not going to landfill
  // Average food waste CO₂ equivalent: 2.5 kg CO₂ per kg food waste
  const CO2_PER_KG = 2.5;

  // Water embedded in food production (varies by category)
  const waterPerKg: Record<string, number> = {
    'cooked_food':      500,    // litres per kg
    'raw_produce':      800,
    'packaged':         300,
    'dairy':           1000,
    'bakery':           200,
    'beverages':        150,
    'other':            400
  };

  // Average monetary value of food in India
  const valuePerKg: Record<string, number> = {
    'cooked_food':      80,     // INR per kg
    'raw_produce':      40,
    'packaged':         120,
    'dairy':            60,
    'bakery':           100,
    'beverages':        50,
    'other':            60
  };

  const mealsProvided     = Math.round(kgReceived / KG_PER_MEAL);
  const peopleServed      = Math.round(mealsProvided / 2.5); // avg 2.5 meals/person/day
  const co2SavedKg        = Math.round(kgReceived * CO2_PER_KG * 10) / 10;
  const waterSavedLitres  = Math.round(kgReceived * (waterPerKg[foodCategory] ?? 400));
  const monetaryValueINR  = Math.round(kgReceived * (valuePerKg[foodCategory] ?? 60));

  return { mealsProvided, peopleServed, co2SavedKg, waterSavedLitres, monetaryValueINR };
}
```

---

## 7. Database Schema

### Entity Relationship Overview

```
auth.users (Supabase)
    │
    ├── donors (1:1)
    │     └── food_listings (1:N)
    │           └── ngo_food_claims (1:N)
    │                 └── volunteer_tasks (1:1)
    │                       ├── volunteer_location_logs (1:N)
    │                       ├── task_messages (1:N)
    │                       └── impact_logs (1:1)
    │
    ├── ngo_organizations (1:1)
    │     ├── ngo_locations (1:N)
    │     ├── ngo_volunteers (1:N)
    │     │     └── volunteer_availability_logs (1:N)
    │     └── impact_logs (1:N)
    │
    ├── admin_users (1:1)
    │     └── kyc_reviews (1:N)
    │
    └── notifications (1:N)

audit_logs (INSERT-only, no FK — captures all admin actions)
fraud_flags (polymorphic entity_id + entity_type)
support_tickets (with JSONB message thread)
platform_stats (daily snapshot by cron)
```

### Key Tables

```sql
-- Core food listing (created by donors)
food_listings (
  id UUID PK,
  donor_id UUID FK → donors,
  title TEXT,
  description TEXT,
  category TEXT, -- cooked_food|raw_produce|packaged|beverages|dairy|bakery|other
  quantity DOUBLE PRECISION,
  quantity_unit TEXT,
  expiry_datetime TIMESTAMPTZ,
  pickup_from TIMESTAMPTZ,
  pickup_to TIMESTAMPTZ,
  pickup_address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  images TEXT[],
  status TEXT, -- available|claimed|partially_claimed|completed|expired|cancelled
  is_urgent BOOLEAN,
  tags TEXT[],
  created_at TIMESTAMPTZ
)

-- NGO claim on a listing
ngo_food_claims (
  id UUID PK,
  ngo_id UUID FK → ngo_organizations,
  listing_id UUID FK → food_listings,
  quantity_claimed DOUBLE PRECISION,
  destination_location_id UUID FK → ngo_locations,
  status TEXT, -- pending_assignment|assigned|volunteer_en_route|...delivered|completed|cancelled
  pickup_otp TEXT, -- 6-digit code for handover verification
  pickup_otp_verified BOOLEAN,
  actual_quantity_received DOUBLE PRECISION,
  created_at TIMESTAMPTZ
)

-- Volunteer task assignment (one per claim)
volunteer_tasks (
  id UUID PK,
  claim_id UUID FK → ngo_food_claims,
  volunteer_id UUID FK → ngo_volunteers,
  listing_snapshot JSONB, -- full copy of listing at assignment time
  donor_snapshot JSONB,   -- donor contact + address (revealed only post-assignment)
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  status TEXT, -- assigned|accepted|en_route_pickup|arrived_at_pickup|otp_verified|picked_up|en_route_delivery|delivered|completed|cancelled
  assigned_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  actual_kg_collected DOUBLE PRECISION,
  photo_proof_url TEXT,
  rating_by_ngo INTEGER -- 1-5
)
```

### Row Level Security Policies

```sql
-- Donors can only see their own listings
CREATE POLICY "donors_own_listings" ON food_listings
  FOR ALL USING (donor_id = (SELECT id FROM donors WHERE user_id = auth.uid()));

-- NGOs can only see their own claims
CREATE POLICY "ngo_own_claims" ON ngo_food_claims
  FOR ALL USING (ngo_id = (SELECT id FROM ngo_organizations WHERE user_id = auth.uid()));

-- Volunteers can only read tasks assigned to them + update status fields only
CREATE POLICY "volunteer_read_own_tasks" ON volunteer_tasks
  FOR SELECT USING (volunteer_id = (
    SELECT id FROM ngo_volunteers WHERE user_id = auth.uid()
  ));

-- Audit log: INSERT only — even admins cannot UPDATE or DELETE
CREATE POLICY "audit_insert_only" ON audit_logs
  FOR INSERT WITH CHECK (true);
-- No SELECT/UPDATE/DELETE policy → blocked for all non-service-role clients
```

---

## 8. Dashboard Specifications

### 8.1 Admin Dashboard

**Route:** `/admin` | **Roles:** super_admin, moderator, support

The Admin Dashboard is the governance layer of the entire platform. Every user, listing, claim, and task flows through the admin's oversight. It is designed as a dense, power-user interface — similar to a financial operations dashboard.

#### Key Pages and Their Functions

| Page | Primary Function | Key Features |
|---|---|---|
| **Main Dashboard** | Live platform overview | Real-time KPI cards, live activity feed, geographic heatmap, fraud alert queue |
| **KYC Review Queue** | Approve/reject new donors and NGOs | Document viewer, trust score breakdown, NGO Darpan API verification, multi-action panel |
| **Donor Management** | Full donor lifecycle control | TanStack Table with 10,000+ row virtualisation, bulk actions, fraud history |
| **NGO Management** | Full NGO lifecycle control | Org profile, volunteer roster count, claim history, trust score editor |
| **Food Listings** | Platform-wide listing oversight | Feature listings, force-expire, content moderation, category analytics |
| **Fraud Management** | Fraud flag review and resolution | Severity queue, rule engine config, ban/warn/dismiss actions |
| **Analytics** | Platform-wide metrics | Cohort analysis, geographic choropleth, food flow funnel, retention charts |
| **Impact Report** | Automated report generation | Puppeteer PDF, monthly auto-generation, shareable public URL |
| **Support Tickets** | User dispute resolution | Email-client UI, SLA tracker, team assignment |
| **System Config** | Platform-wide settings | Rule engine thresholds, feature flags, notification templates |
| **Audit Logs** | Immutable action history | INSERT-only table, compliance export, before/after JSON diff |
| **System Health** | Infrastructure monitoring | DB pool, API latency, queue depths, Sentry integration |

#### Admin Security Model

- Login requires email + password + **TOTP 2FA** (Google Authenticator)
- Optional **WebAuthn / FIDO2** passkey support
- **IP allowlist**: login from outside configured ranges triggers email OTP challenge
- **Session**: 15-minute JWT + 24-hour refresh token (httpOnly cookie)
- **Concurrent session detection**: new device login notifies registered email
- **Inactivity timeout**: 20 minutes with countdown warning modal
- **Three roles with granular permissions**:
  - `super_admin`: full access including admin user management and data export
  - `moderator`: approve/suspend users, review fraud, handle tickets
  - `support`: read-only user data, add ticket notes

#### KYC Review Workflow

```
New signup submitted
        │
        ▼
kyc_reviews table (status: pending)
        │
        ├── NGO Darpan API lookup (auto, synchronous)
        ├── Trust score auto-calculated
        ├── Documents flagged for review
        │
        ▼
Admin opens review modal
        │
        ├── Left panel: all submitted form data
        ├── Right panel: in-browser PDF/image document viewer
        ├── Trust score breakdown (factor-by-factor)
        │
        ├── Actions:
        │     ✓ Approve → status: verified, welcome email + SMS sent
        │     ✗ Reject → reason required, email to applicant with reason
        │     ⚡ Request info → specify which docs to re-upload
        │     ⏸ Escalate → flagged for super_admin
        │
        └── Auto-approve rule (configurable):
              trust_score > 85 AND NGO Darpan verified AND all docs present
              → auto-approve + admin notification
```

---

### 8.2 Donor Dashboard

**Route:** `/donor` | **Role:** donor (status: verified)

The Donor Dashboard is where food providers manage their surplus food listings and track the impact of their donations. The experience is designed to be rewarding — donors should feel that their contribution matters and see it quantified.

#### Key Pages and Their Functions

| Page | Primary Function | Key Features |
|---|---|---|
| **Home / Overview** | Personal impact summary | Animated KPI cards, expiry alerts, live claims activity feed, carbon offset calculator |
| **Create Listing** | List surplus food | Multi-step form, AI description generator, image upload with crop, map pin picker |
| **Manage Listings** | Full listing lifecycle | Tabbed table (available/claimed/completed/expired), bulk actions, CSV export |
| **Listing Detail** | Per-listing claim management | Claims table, pickup OTP verification, real-time claim updates, donor-receiver chat |
| **Analytics** | Personal donation analytics | Donation trends, category breakdown, receiver breakdown, PDF report |
| **Notifications** | Notification centre | Claim alerts, pickup confirmations, expiry warnings |
| **Profile & Settings** | Account management | KYC document update, notification preferences, operating hours |

#### AI-Powered Listing Creation

When a donor clicks "AI Assist" while creating a listing, the backend calls GPT-4o with:

```
System: You are a food safety assistant for a food donation platform.
User: Generate a description, safety notes, and serving suggestions for:
  Food name: "Mutton Biryani"
  Category: cooked_food
  Quantity: 30 kg
  Tags: contains-allergens, hot-food
  Preparation time: 2 hours ago
```

The response streams back to the UI in real time with a typewriter animation. The donor can accept, edit, or reject the generated content.

#### Donor Verification Flow (Fraud Prevention)

```
Step 1: Basic signup (email + phone OTP)
Step 2: Identity docs upload (Aadhaar/PAN/Passport + selfie)
Step 3: Business details (FSSAI + GST if applicable)
Step 4: Address + map pin
Step 5: Pending admin review (account locked with status banner)
Step 6: Admin approves → full dashboard unlocks
```

All document URLs use Supabase Storage with RLS policies: only admin + the donor's own user_id can access their documents. URLs are signed with 1-hour expiry for preview.

---

### 8.3 NGO Main Dashboard

**Route:** `/ngo` | **Role:** ngo_admin (status: verified)

The NGO Dashboard is the operations command center — the equivalent of a restaurant manager's dashboard in a food delivery platform. The NGO never goes to the field; they manage claims, dispatch volunteers, monitor live operations, and track impact.

#### Key Pages and Their Functions

| Page | Primary Function | Key Features |
|---|---|---|
| **Home** | Live operations overview | Live volunteer map, AI daily briefing, urgency strip, real-time activity feed |
| **Discover Food** | Browse and claim listings | Dual map/list view, Mapbox live pins, quick-claim modal, real-time listing updates |
| **My Claims** | Claim lifecycle management | Status pipeline table, slide-over detail, chat with donor, OTP display |
| **Task Assignment Board** | Volunteer dispatch (CORE) | Drag-and-drop assignment, volunteer roster with availability, AI assignment suggestions |
| **Live Tracking** | Real-time field monitoring | Full-screen Mapbox, volunteer GPS dots updating every 10s, ETA per task |
| **Volunteers & Staff** | Team management | Add/edit/remove volunteers, optional app login invite, bulk SMS |
| **Volunteer Profile** | Individual performance | Task history, rating breakdown, performance chart, internal notes |
| **Shift Scheduler** | Weekly availability planning | Calendar view, shift publishing, copy-last-week, PDF export |
| **Impact Dashboard** | Humanitarian metrics | SDG badges, CO₂ saved, AI-generated impact narrative, shareable PDF |
| **NGO Profile** | Organisation settings | Logo, bio, distribution centers, dietary preferences, document management |

#### Task Assignment Board — Detailed Interaction

This is the most important page in the NGO dashboard. Its design is inspired by a real-time dispatch board.

```
┌─────────────────────────────────────────┬─────────────────────────────┐
│         CLAIMS QUEUE (Left 60%)          │   VOLUNTEER ROSTER (Right 40%)│
│                                          │                               │
│  ┌── NEEDS ASSIGNMENT ─────────────────┐ │  [Search] [Filter: Available] │
│  │ 🔴 Mutton Biryani                   │ │                               │
│  │ 30 kg · Cooked Food                 │ │  ┌─ Raju Kumar ─────────────┐ │
│  │ Pickup: Koramangala (2.1km)         │ │  │ 🟢 Available · Bike       │ │
│  │ Window: 3:00PM – 5:00PM             │ │  │ Tasks today: 2            │ │
│  │ ⏰ Expires: 47 min                  │ │  │ Rating: ★4.8              │ │
│  │ [Assign Volunteer →]                │ │  │ 1.2km to pickup           │ │
│  └─────────────────────────────────────┘ │  └──────────────────────────┘ │
│                                          │                               │
│  ┌── IN PROGRESS ──────────────────────┐ │  ┌─ Priya Singh ────────────┐ │
│  │ 🟡 Raju Kumar                       │ │  │ 🔴 On Task · Car          │ │
│  │ Veg Rice → En Route to Pickup       │ │  │ Delivering: Sandwich box  │ │
│  │ ETA: 12 min [View on Map]           │ │  └──────────────────────────┘ │
│  └─────────────────────────────────────┘ │                               │
│                                          │  [AI Suggest Assignments]     │
└─────────────────────────────────────────┴─────────────────────────────┘
```

**Drag and Drop Flow:**
1. Coordinator drags the red claim card from the left panel
2. Drops it on Raju Kumar's volunteer card on the right
3. Confirmation modal appears: "Assign Mutton Biryani pickup to Raju Kumar?"
4. Shows: estimated route on mini-map, distance, estimated time
5. "Confirm" → POST /api/ngo/tasks → volunteer gets push + SMS in < 2 seconds

**Real-time Updates on This Page:**
- New claim appears in left panel via Supabase Realtime (no refresh)
- Volunteer toggles availability on their app → dot changes colour instantly via Socket.io
- Active task status changes update the "In Progress" card text in real time

---

### 8.4 Volunteer / Employee App

**Route:** `/volunteer` | **Role:** ngo_volunteer | **Design:** Mobile-first PWA

The Volunteer App is a Progressive Web App designed exclusively for field workers. Its design philosophy matches a delivery partner app — Swiggy Genie, Blinkit's delivery partner interface — with large touch targets, clear single-action screens, and offline capability.

#### Screen Flow

```
App opens
    │
    ▼
Home Screen
    │
    ├── Availability toggle: OFF → volunteer is invisible to dispatch
    │
    └── Availability toggle: ON
          │
          │   (wait for NGO to assign task)
          │
          ▼
    Push notification arrives: "New task: Pick up Biryani from Koramangala"
          │
          ▼
    Task Detail Screen
          │
          ├── Step 1: "Start Navigation" → opens Google Maps to donor address
          │
          ├── Step 2: "I've Arrived" → status: arrived_at_pickup
          │                             GPS location recorded
          │
          ├── Step 3: OTP Verification screen
          │           "Ask donor for their 6-digit code"
          │           [5][8][2][4][1][3] → auto-submits → OTP verified ✓
          │
          ├── Step 4: Photo proof required
          │           Camera opens → takes food photo → uploads → proceeds
          │
          ├── Step 5: "Head to Drop-off" → navigation to NGO center
          │
          ├── Step 6: At NGO center
          │           Enter actual quantity: "28 kg"
          │           Condition: "Good"
          │           "Confirm Delivery" → task complete
          │
          └── Completion screen
                "Task Complete! You collected 28 kg — approx. 70 meals!"
                Rating request → submitted to NGO
                Back to Home (availability toggle)
```

#### Offline Capability

The volunteer app uses **IndexedDB** to queue status updates when the volunteer loses connectivity (which is realistic during pickup in basements, parking lots, or rural areas):

```typescript
// Status update queued offline
async function updateTaskStatus(taskId: string, status: string, data: object) {
  try {
    await api.put(`/volunteer/tasks/${taskId}/status`, { status, ...data });
  } catch (e) {
    if (!navigator.onLine) {
      await offlineQueue.enqueue({
        url: `/volunteer/tasks/${taskId}/status`,
        method: 'PUT',
        body: { status, ...data },
        timestamp: Date.now()
      });
      showToast('Offline — update saved, will sync when connected');
    }
  }
}

// Sync queue on reconnection
window.addEventListener('online', async () => {
  const pending = await offlineQueue.getAll();
  for (const request of pending) {
    await api.request(request);
    await offlineQueue.remove(request.id);
  }
});
```

#### Live GPS Tracking

The volunteer app posts GPS coordinates every 10 seconds during an active task:

```typescript
function useLocationPing(taskId: string | null) {
  useEffect(() => {
    if (!taskId) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        await api.post('/volunteer/location', {
          task_id: taskId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed_kmph: (position.coords.speed ?? 0) * 3.6,
          heading: position.coords.heading,
          accuracy_meters: position.coords.accuracy
        });
      },
      (error) => console.warn('GPS error:', error),
      {
        enableHighAccuracy: true,
        maximumAge: 10000,    // Cache position for 10 seconds
        timeout: 15000        // Give up if no fix in 15s
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [taskId]);
}
```

The server receives this, updates `ngo_volunteers.current_lat/lng`, and broadcasts via Socket.io to `ngo_{ngo_id}` room. The NGO's Live Tracking map listener moves the volunteer's marker smoothly.

---

## 9. Real-Time System Design

FoodBridge uses two complementary real-time systems for different use cases.

### Supabase Realtime (Database Change Streams)

Used for: data changes that multiple clients need to see without action from another client.

```typescript
// NGO Discover page — new listing appears on map
const channel = supabase
  .channel('food-listings-nearby')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'food_listings',
    filter: `status=eq.available`
  }, (payload) => {
    const listing = payload.new as FoodListing;
    // Check if within NGO's service radius
    if (isWithinRadius(listing, ngo.primary_lat, ngo.primary_lng, ngo.service_radius_km)) {
      addListingToMap(listing);         // Add pin to Mapbox map
      addListingToFeed(listing);        // Add card to list view
      playNewListingSound();            // Optional audio cue
    }
  })
  .subscribe();
```

| Channel | Table | Event | Who listens | Effect |
|---|---|---|---|---|
| `food-listings-nearby` | food_listings | INSERT | NGO discover page | New pin on map |
| `ngo-claims-{ngo_id}` | ngo_food_claims | UPDATE | NGO my claims page | Status badge changes |
| `task-board-{ngo_id}` | volunteer_tasks | INSERT/UPDATE | Task assignment board | New task card / status update |
| `volunteer-roster-{ngo_id}` | ngo_volunteers | UPDATE | Volunteer roster | Availability dot changes colour |
| `listing-quantity-{listing_id}` | food_listings | UPDATE | Donor listing detail | Quantity bar animates |

### Socket.io (Bidirectional Events)

Used for: low-latency bidirectional communication, chat, and voluntary GPS pings.

```
ROOMS:
  task_{task_id}        → NGO + volunteer chat; task status events
  ngo_{ngo_id}          → broadcast volunteer GPS positions to NGO map
  volunteer_{vol_id}    → deliver task assignment push to volunteer
  admin_overview        → broadcast platform stats to admin dashboard

EVENTS:
  Client → Server:
    volunteer:location     { task_id, lat, lng, speed, heading }
    chat:message           { task_id, message, type }
    volunteer:status       { task_id, new_status }

  Server → Client:
    task:assigned          { task } → volunteer room
    volunteer:moved        { volunteer_id, lat, lng, task_id } → ngo room
    chat:message           { message } → task room
    task:status_changed    { task_id, status } → task room + ngo room
    listing:claimed        { listing_id, remaining_qty } → global
```

### Real-Time Architecture Diagram

```
Volunteer App           Node.js Server          NGO Dashboard
     │                        │                       │
     │──volunteer:location──►│                       │
     │                        │──volunteer:moved────►│
     │                        │  (GPS broadcast)      │  → Mapbox marker moves
     │                        │                       │
     │                        │◄──chat:message────────│
     │◄──chat:message─────────│                       │
     │                        │                       │
     │──volunteer:status────►│                       │
     │  (status update)       │                       │
     │                        │──DB update────────────►│  (Supabase Realtime)
     │                        │                        │  → Status badge changes
```

---

## 10. AI/ML Module

FoodBridge integrates OpenAI GPT-4o at multiple points to provide intelligent assistance across all three portals.

### AI Feature Map

| Feature | Portal | Trigger | Model Call |
|---|---|---|---|
| Listing description generator | Donor | "AI Assist" button | GPT-4o text completion with streaming |
| NGO recommendation feed | NGO Home | Dashboard load | Scoring algorithm + GPT-4o for explanation strings |
| Smart task assignment suggestions | NGO Task Board | "AI Suggest" button | GPT-4o with structured JSON output |
| Daily operations briefing | NGO Home | Dashboard load (15min cache) | GPT-4o with org context |
| Impact narrative | NGO Reports | Generate PDF button | GPT-4o long-form writing |
| Fraud risk scoring | Background | Hourly cron | GPT-4o with user activity JSON |
| Platform anomaly detection | Admin | Hourly cron | GPT-4o with platform metrics |
| Admin daily summary email | Admin | Nightly cron | GPT-4o with daily stats |

### Smart Task Assignment — Prompt Engineering

```typescript
const systemPrompt = `
You are an operations dispatcher for FoodBridge, a food redistribution NGO platform.
Given a list of unassigned food pickup tasks and available volunteers,
suggest optimal assignments to minimise total travel time and
ensure vehicle capacity requirements are met.

Rules:
1. Never assign a task to a volunteer without the required vehicle type
2. Prefer volunteers with fewer tasks today (max 5)
3. Consider proximity: always prefer the closest available volunteer
4. Return ONLY valid JSON — no prose, no markdown

Output format:
{
  "assignments": [
    {
      "claim_id": "uuid",
      "volunteer_id": "uuid",
      "reason": "Nearest available volunteer with van, 1.2km away",
      "estimated_pickup_min": 8
    }
  ]
}
`;

const userPrompt = `
Unassigned tasks:
${JSON.stringify(pendingTasks.map(t => ({
  claim_id: t.id,
  food: t.listingTitle,
  quantity_kg: t.quantity,
  vehicle_required: t.vehicleRequired,
  pickup_lat: t.pickup_lat,
  pickup_lng: t.pickup_lng,
  expiry_min: t.minutesToExpiry
})), null, 2)}

Available volunteers:
${JSON.stringify(availableVolunteers.map(v => ({
  volunteer_id: v.id,
  name: v.full_name,
  vehicle: v.vehicle_type,
  current_lat: v.current_lat,
  current_lng: v.current_lng,
  tasks_today: v.tasksToday,
  rating: v.rating
})), null, 2)}
`;
```

### Background AI Jobs (node-cron schedule)

```typescript
// Every 30 minutes: check for expiring unclaimed listings
cron.schedule('*/30 * * * *', async () => {
  const expiring = await db.getListingsExpiringIn(120); // 2 hours
  for (const listing of expiring) {
    const ngos = await findEligibleNGOs(listing);
    await notifyNGOs(ngos, `Urgent: ${listing.title} expires in 2 hours near you`);
    await db.markListingUrgent(listing.id);
  }
});

// Every hour: fraud scoring pass
cron.schedule('0 * * * *', async () => {
  const activeUsers = await db.getRecentlyActiveUsers(60);
  for (const user of activeUsers) {
    const context = await buildFraudContext(user);
    await evaluateFraudRules(context);
  }
});

// Every hour: volunteer anomaly detection
cron.schedule('0 * * * *', async () => {
  const activeVolunteers = await db.getVolunteersOnTask();
  for (const v of activeVolunteers) {
    const lastPing = await db.getLastLocationPing(v.id);
    const minsSinceLastPing = (Date.now() - new Date(lastPing.logged_at).getTime()) / 60000;
    if (minsSinceLastPing > 30) {
      await notifyNGO(v.ngo_id, `Warning: ${v.full_name} has had no location update for 30 minutes`);
    }
  }
});

// Midnight: trust score recalculation for all users
cron.schedule('0 0 * * *', async () => {
  const allNGOs = await db.getAllNGOs();
  for (const ngo of allNGOs) {
    const newScore = await calculateNGOTrustScore(ngo.id);
    await db.updateTrustScore(ngo.id, newScore);
  }
});

// 1st of each month: auto-generate impact reports
cron.schedule('0 8 1 * *', async () => {
  const allNGOs = await db.getVerifiedNGOs();
  for (const ngo of allNGOs) {
    const pdfUrl = await generateImpactReportPDF(ngo.id, 'last_month');
    await emailNGO(ngo.email, 'Your monthly impact report is ready', pdfUrl);
  }
});
```

---

## 11. Security & Fraud Prevention

### Authentication Security

| Layer | Implementation |
|---|---|
| Password hashing | bcrypt with cost factor 12 |
| Password strength | zxcvbn client-side + 10-char minimum server-side |
| Password rotation | Enforced every 90 days for admin accounts |
| Session tokens | Short-lived JWT (15 min access) + httpOnly refresh cookie (7 days) |
| Refresh rotation | Every refresh token is single-use; invalidated after use |
| Rate limiting | 5 login attempts per 15 min per IP; 1-hour lockout after exceeded |
| 2FA | TOTP (admin only) + WebAuthn/passkey support |
| IP allowlist | Admin portal login restricted to configured IP ranges |
| Audit logging | Every auth event (login, logout, failure, refresh) logged with IP + user agent |

### Data Security

| Layer | Implementation |
|---|---|
| Transport | HTTPS everywhere (TLS 1.3); HSTS header |
| Database access | Service Role key only on backend; anon key for client (Realtime subscriptions only) |
| Row Level Security | All tables with user-owned data have RLS enabled |
| File access | Supabase Storage buckets with RLS; documents use signed URLs (1h expiry) |
| Input validation | express-validator on all endpoints; Zod schema validation |
| XSS prevention | React escapes JSX by default; DOMPurify for any dangerouslySetInnerHTML |
| CSRF prevention | httpOnly cookie for refresh token; JWT in Authorization header for mutations |
| SQL injection | Supabase client uses parameterised queries throughout |

### Fraud Prevention Layers

```
Layer 1: Registration fraud (KYC)
  • Multi-document verification
  • Face match via selfie (manual admin review)
  • FSSAI/GST/NGO Darpan number validation
  • Admin manual approval before any access

Layer 2: Behavioral rules (automated)
  • 6 rule categories checked on each relevant action
  • Flags inserted automatically with severity
  • High/critical flags notify admin immediately

Layer 3: AI risk scoring (nightly)
  • GPT-4o evaluates activity patterns
  • Risk score 0-100 stored per user
  • Shown to admin in user profile

Layer 4: OTP handover verification
  • 6-digit pickup OTP generated at claim time
  • Stored hashed in database
  • Only valid for that specific claim
  • Volunteer must enter code at donor location
  • 3 failures → task flagged, NGO notified

Layer 5: Photo proof
  • Volunteer must photograph food before marking picked up
  • Photos stored immutably in Supabase Storage
  • Admin can review any disputed transaction

Layer 6: Device fingerprinting
  • fingerprintjs integrated at login
  • Multiple accounts from same device fingerprint → critical fraud flag
```

---

## 12. API Reference

### Base URL

```
Production:  https://api.foodbridge.in/api
Development: http://localhost:3001/api
```

### Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

Admin endpoints additionally require:
```
X-Admin-Role: super_admin|moderator|support
```

### Core Endpoint Groups

```
DONOR
  POST   /auth/register              Register new donor account
  POST   /auth/verify-otp            Verify phone OTP
  POST   /auth/login                 Login + receive JWT
  POST   /auth/refresh               Refresh access token
  GET    /donors/me                  Own profile
  PUT    /donors/me                  Update profile
  POST   /donors/kyc-upload          Upload KYC documents
  GET    /listings                   Own listings (paginated, filtered)
  POST   /listings                   Create new listing
  GET    /listings/:id               Listing detail
  PUT    /listings/:id               Update listing
  DELETE /listings/:id               Cancel listing
  GET    /listings/:id/claims        Claims on a listing
  POST   /listings/:id/verify-pickup Verify volunteer OTP at pickup
  GET    /analytics/overview         Personal impact stats
  GET    /analytics/export-pdf       Download impact PDF
  POST   /ai/generate-description    AI listing description

NGO
  POST   /ngo/auth/register          Register NGO
  POST   /ngo/auth/login             Login
  GET    /ngo/me                     NGO profile
  PUT    /ngo/me                     Update profile
  GET    /ngo/locations              Distribution centers
  POST   /ngo/locations              Add center
  GET    /ngo/listings/nearby        Discover food (lat, lng, radius, filters)
  POST   /ngo/claims                 Claim a listing
  GET    /ngo/claims                 All claims (filtered, paginated)
  PUT    /ngo/claims/:id/cancel      Cancel claim
  POST   /ngo/volunteers             Add volunteer
  GET    /ngo/volunteers             Volunteer roster
  PUT    /ngo/volunteers/:id         Edit volunteer
  DELETE /ngo/volunteers/:id         Remove volunteer
  POST   /ngo/tasks                  Assign task to volunteer
  GET    /ngo/tasks                  All tasks (filtered)
  PUT    /ngo/tasks/:id/reassign     Reassign to different volunteer
  PUT    /ngo/tasks/:id/cancel       Cancel task
  GET    /ngo/volunteers/live        Live GPS positions
  POST   /ngo/ai-suggest-assignments AI task assignment suggestions
  GET    /ngo/ai-daily-briefing      AI home page briefing
  GET    /ngo/analytics/overview     Impact analytics
  GET    /ngo/analytics/export-pdf   Generate impact PDF

VOLUNTEER
  POST   /volunteer/auth/setup-pin   First-time PIN setup
  POST   /volunteer/auth/login       Phone + password login
  GET    /volunteer/me               Own profile
  PUT    /volunteer/availability     Toggle available/break/offline
  GET    /volunteer/tasks/active     Current active task
  PUT    /volunteer/tasks/:id/status Advance task status
  POST   /volunteer/tasks/:id/verify-otp  Submit donor OTP
  POST   /volunteer/tasks/:id/photo  Upload food photo proof
  POST   /volunteer/tasks/:id/complete    Final delivery confirmation
  POST   /volunteer/location         GPS ping (every 10s during task)
  GET    /volunteer/chat/:task_id    Chat history
  POST   /volunteer/chat/:task_id    Send message

ADMIN (all require admin JWT + role check)
  GET    /admin/dashboard/stats      Live platform KPIs
  GET    /admin/kyc/queue            Pending KYC reviews
  POST   /admin/kyc/:id/approve      Approve applicant
  POST   /admin/kyc/:id/reject       Reject with reason
  GET    /admin/users/donors         All donors (paginated)
  GET    /admin/users/receivers      All NGOs (paginated)
  PUT    /admin/users/:id/status     Change user status
  GET    /admin/fraud/flags          Active fraud flags
  PUT    /admin/fraud/flags/:id/resolve   Resolve flag
  POST   /admin/notifications/broadcast  Platform-wide notification
  GET    /admin/audit-logs           Immutable audit trail
  GET    /admin/system/health        Infrastructure health
```

### Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 143,
    "totalPages": 8
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Expiry time must be at least 1 hour in the future",
    "field": "expiry_datetime"
  }
}
```

---

## 13. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION STACK                        │
│                                                              │
│  Cloudflare              Vercel                Railway       │
│  ──────────              ──────                ───────       │
│  CDN + DDoS   ──────►   React SPA    ──────►  Node.js      │
│  WAF                     (4 portals)  API       Express      │
│  SSL termination         Edge cached  calls      + Redis     │
│  IP rate limit           globally               (BullMQ)    │
│                                                              │
│                                  ▼                           │
│                           Supabase                           │
│                           ────────                           │
│                           PostgreSQL (primary)               │
│                           Auth service                       │
│                           Realtime server                    │
│                           Storage (S3-compatible)            │
│                                                              │
│  External Services                                           │
│  ─────────────────                                           │
│  OpenAI API    ← AI features                                 │
│  Twilio        ← SMS notifications                          │
│  Firebase FCM  ← Push notifications                         │
│  Mapbox        ← Maps + geocoding                           │
│  Sentry        ← Error monitoring                           │
│  SMTP (Gmail)  ← Transactional email                        │
└─────────────────────────────────────────────────────────────┘
```

### Environment Separation

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| Development | localhost:5173 | localhost:3001 | Supabase dev project |
| Staging | staging.foodbridge.in | api-staging.railway.app | Supabase staging project |
| Production | foodbridge.in | api.foodbridge.in | Supabase prod project |

### Admin Portal Isolation

The admin portal (`admin.foodbridge.in`) is additionally protected by:
- Cloudflare Access rule: IP allowlist at the CDN level
- Separate environment variables with stricter JWT secrets
- All traffic logged to an external SIEM webhook

---

## 14. Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=sk-...

# Maps
MAPBOX_TOKEN=pk.eyJ1...
GOOGLE_MAPS_API_KEY=AIza...
GOOGLE_DISTANCE_MATRIX_API_KEY=AIza...

# SMS
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+1555...

# Push notifications
FCM_SERVER_KEY=...
FCM_PROJECT_ID=...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=no-reply@foodbridge.in
SMTP_PASS=...

# Admin security
ADMIN_IP_ALLOWLIST=203.0.113.0/24,198.51.100.5
TOTP_SECRET_SALT=your-totp-salt
ADMIN_SESSION_TIMEOUT_MIN=20

# Volunteer app
VOLUNTEER_INVITE_PIN_SALT=your-pin-salt

# Fraud detection
FINGERPRINT_API_KEY=...
VIRUSTOTAL_API_KEY=...

# Error monitoring
SENTRY_DSN=https://...@sentry.io/...

# PDF generation
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser  # For Railway

# Feature flags
FEATURE_AUTO_APPROVAL=true
FEATURE_AI_SUGGESTIONS=true
FEATURE_AI_FRAUD_SCORING=true
FEATURE_ROUTE_OPTIMIZER=true
```

---

## 15. Installation & Setup

### Prerequisites

- Node.js 20 LTS
- Redis 7+
- A Supabase project (free tier works for development)
- Accounts for: OpenAI, Twilio, Firebase, Mapbox

### Clone and Install

```bash
git clone https://github.com/your-org/foodbridge.git
cd foodbridge

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run all migrations in order
supabase db push

# Seed development data (optional)
npm run db:seed
```

### Environment Setup

```bash
# Copy example env files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Fill in all required values (see Section 14)
```

### Run Development Servers

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start backend
cd server && npm run dev

# Terminal 3: Start frontend
cd client && npm run dev

# Terminal 4: Run background job workers
cd server && npm run workers
```

### Running Database Migrations

```bash
# Create a new migration
supabase migration new add_ngo_volunteers

# Apply all pending migrations
supabase db push

# Reset dev database (caution: drops all data)
supabase db reset
```

### Build for Production

```bash
# Build frontend
cd client && npm run build

# Build backend
cd server && npm run build

# Start production server
cd server && npm start
```

---

## 16. Impact Metrics & SDG Alignment

### How FoodBridge Measures Impact

Every completed task generates a standardised impact log using the estimation algorithm (Section 6.7). Impact is aggregated at three levels: per volunteer, per NGO, and platform-wide.

### Impact Dashboard Metrics

| Metric | Calculation | Display |
|---|---|---|
| Meals provided | kg × 2.5 | Per task, per NGO, platform total |
| People served | meals ÷ 2.5 | Estimated unique people per period |
| CO₂ saved | kg × 2.5 kg CO₂/kg food | Tonnes saved from landfill |
| Water saved | kg × category factor | Litres of embedded water saved |
| Monetary value | kg × category avg price | INR equivalent of food saved |
| Food diversity | Category breakdown | Nutritional balance indicator |

### UN Sustainable Development Goal Alignment

| SDG | Goal | FoodBridge Contribution |
|---|---|---|
| **SDG 2** | Zero Hunger | Direct: meals provided to undernourished communities |
| **SDG 12** | Responsible Consumption | Direct: food waste diverted from landfill |
| **SDG 13** | Climate Action | Indirect: CO₂ equivalent saved from food decomposition |
| **SDG 17** | Partnerships | Direct: donor-NGO-volunteer network building |
| **SDG 11** | Sustainable Cities | Indirect: reducing urban food waste infrastructure |

---

## 17. Roadmap

### Phase 1 — MVP (Hackathon Scope)
- [x] Admin portal with KYC, fraud management, and analytics
- [x] Donor dashboard with AI listing creation and impact tracking
- [x] NGO dashboard with claims, task assignment, and live tracking
- [x] Volunteer PWA with GPS tracking and OTP verification
- [x] Real-time updates via Supabase Realtime + Socket.io
- [x] AI-powered description generation, assignment suggestions, impact narratives

### Phase 2 — Growth Features
- [ ] Multi-language support (Hindi, Tamil, Telugu, Kannada)
- [ ] Donor recurring schedule: "Every Saturday post my surplus automatically"
- [ ] NGO demand forecasting: predict weekly food needs based on history
- [ ] Corporate donor portal: bulk listing management for chains and caterers
- [ ] Volunteer incentive system: points → redeemable rewards
- [ ] WhatsApp bot integration: claim food via WhatsApp message

### Phase 3 — Scale & Intelligence
- [ ] PostGIS spatial indexes for sub-10ms geographic queries at 100,000+ listings
- [ ] ML demand-supply matching: predictive routing of surplus food to areas of highest need
- [ ] IoT integration: smart fridges at NGOs auto-log received food weight
- [ ] Blockchain impact certificates: tamper-proof donation receipts for corporate CSR
- [ ] Government API integration: link with national food security programs
- [ ] Multi-city expansion with city-specific admin roles and regional analytics

---

## 18. Our Innovations

> These five capabilities are original to FoodBridge. No existing food redistribution platform — in India or globally — combines all five into a single unified system. Each one independently solves a problem the sector has lived with for decades. Together they form the platform's competitive and humanitarian moat.

---

### 18.1 Expiry-Urgency Adaptive Discovery Feed

#### The Problem It Solves

Every food redistribution platform today sorts listings either by "newest first" or "nearest first." Both orderings systematically fail at the one job that matters most: ensuring food that is about to expire is seen and claimed before it becomes waste. A listing posted 4 hours ago with 20 minutes left will appear below a fresh listing posted 30 seconds ago — even though the older listing represents the greater waste emergency.

#### How It Works

FoodBridge continuously re-scores every available listing using a five-factor composite urgency function that recalculates in real time as listings age:

```
Discovery Score = (Proximity     × 0.35)
               + (Expiry Urgency × 0.30)
               + (Quantity       × 0.15)
               + (Category Match × 0.12)
               + (Dietary Match  × 0.08)
```

The expiry urgency component uses a non-linear curve — urgency accelerates sharply as the window closes:

| Time Remaining | Fraction of Window Left | Urgency Score |
|---|---|---|
| > 75% of window | e.g. 6h of 8h window | 0.10 — low |
| 50–75% of window | e.g. 4h of 8h window | 0.30 — moderate |
| 25–50% of window | e.g. 2h of 8h window | 0.60 — elevated |
| < 25% of window | e.g. < 2h of 8h window | 0.90 — critical |
| Expired | 0% remaining | 1.00 — auto-expire triggered |

This means a listing expiring in 45 minutes will **always** rank at the top of every eligible NGO's feed — regardless of distance, category, or when it was posted — because its urgency score of 0.90 dominates all other factors.

#### What NGOs See

- Listings with < 2 hours remaining display a **pulsing red border** and an `URGENT` badge
- The discovery feed re-ranks silently every 60 seconds — listings visibly slide up as they age
- A dedicated "Expiring Soon" tab shows only listings with < 2 hours remaining, sorted by minutes left
- The map view uses pin colour to encode urgency: green → amber → red as listings age, giving coordinators an instant spatial sense of which areas need attention right now

#### The Cascade Notification Pipeline

The urgency feed works in concert with an automated notification cascade:

```
T − 4 hours  →  In-app notification to all matched NGOs
T − 2 hours  →  Push notification + listing marked URGENT + feed boost
T − 1 hour   →  SMS to NGO coordinator's registered phone
T − 30 min   →  WhatsApp message to coordinator's personal number
T − 15 min   →  Admin dashboard alert: "High-value listing unclaimed"
T − 0        →  Auto-expired, impact opportunity lost, logged to waste analytics
```

Every threshold and channel in the cascade is configurable by admin in System Config without a code deployment.

#### Why No Platform Has Done This

Chronological and proximity sorts are implemented by default in every off-the-shelf listing platform. Building an urgency-adaptive re-ranking system requires continuous background scoring, real-time feed updates, and the discipline to deprioritise proximity in favour of expiry imminence — a counterintuitive design decision that no existing food redistribution platform has made.

---

### 18.2 Global Impact Points System

#### The Problem It Solves

Donation behaviour on humanitarian platforms drops sharply after the initial registration excitement fades. Donors and NGOs have no tangible sense of their cumulative contribution, no social signal of their standing in the community, and no mechanism that makes giving feel like an ongoing achievement rather than a one-time transaction.

#### How It Works

Every action on the platform awards points to the actor. Points are accumulated into a permanent profile score that never resets, grows with every contribution, and unlocks status tiers with real operational benefits.

#### Points Earning Table — Donors

| Action | Points Awarded | Notes |
|---|---|---|
| Account verified by admin | +100 pts | One-time, on approval |
| First food listing published | +50 pts | One-time milestone |
| Food listing published | +10 pts | Per listing |
| Listing claimed by NGO | +25 pts | Per claim |
| Pickup OTP verified at handover | +30 pts | Confirms genuine handover |
| Task completed (food delivered) | +50 pts | Per completed delivery |
| Rated 5 stars by NGO | +20 pts | Per 5-star review |
| Rated 4 stars by NGO | +10 pts | Per 4-star review |
| 10 kg milestone (cumulative) | +100 pts | Every 10 kg donated |
| 100 kg milestone | +500 pts | Milestone badge unlocked |
| 500 kg milestone | +2,000 pts | Gold tier unlocked |
| 7-day donation streak | +150 pts | Consecutive active days |
| 30-day donation streak | +1,000 pts | Monthly consistency bonus |
| Referred a verified donor | +200 pts | On referee's first listing |
| Received a written review | +15 pts | Per review with comment |

#### Points Earning Table — NGOs

| Action | Points Awarded | Notes |
|---|---|---|
| NGO account verified | +200 pts | One-time, on admin approval |
| First successful claim | +75 pts | One-time milestone |
| Claim made on a listing | +15 pts | Per claim |
| Volunteer assigned within 30 min | +20 pts | Speed bonus |
| Volunteer assigned within 10 min | +40 pts | Fast dispatch bonus |
| Task completed (food delivered) | +60 pts | Per delivery |
| 0 cancellations in 7 days | +100 pts | Reliability bonus |
| Impact log submitted after delivery | +25 pts | Per log with kg data |
| 100 kg received milestone | +300 pts | Milestone badge |
| 1,000 kg received milestone | +2,000 pts | Champion tier unlocked |
| Volunteer rated 5 stars by donor | +15 pts | Team performance bonus |
| Monthly impact report generated | +50 pts | Engagement bonus |
| 10+ unique donor partners | +500 pts | Network diversity badge |
| Referred a verified NGO | +300 pts | On referee's first claim |
| Zero-cancellation month | +500 pts | Perfect operations badge |

#### Donor Status Tiers

| Tier | Points Required | Badge | Benefits |
|---|---|---|---|
| **Seedling** 🌱 | 0 – 499 | Green seedling | Basic platform access |
| **Nourisher** 🌿 | 500 – 1,999 | Growing plant | Priority listing visibility, profile highlight |
| **Guardian** 🌳 | 2,000 – 4,999 | Full tree | Featured on city leaderboard, impact certificate |
| **Champion** 🏆 | 5,000 – 14,999 | Gold trophy | "Champion Donor" badge on all listings, NGO priority matching |
| **Legend** 🌟 | 15,000+ | Gold star | Platform ambassador badge, featured in monthly newsletter, admin recognition |

#### NGO Status Tiers

| Tier | Points Required | Badge | Benefits |
|---|---|---|---|
| **Registered** 📋 | 0 – 999 | Clipboard | Basic access, standard matching |
| **Active** ⚡ | 1,000 – 3,999 | Lightning bolt | Higher discovery priority, trust score boost |
| **Trusted** 🛡️ | 4,000 – 9,999 | Shield | Auto-approval bypass for repeat claims, analytics export |
| **Elite** 💎 | 10,000 – 24,999 | Diamond | Priority support, featured on donor dashboard, API access |
| **Platinum** 👑 | 25,000+ | Crown | Platform partner status, co-branding opportunities, direct admin line |

#### Environmental Points (Bonus Layer)

Beyond the operational points, every kilogram of food recovered generates **environmental bonus points** calculated from the impact estimation algorithm:

```
Environmental Points = (kg × 2.5 CO₂ factor × 10)
                     + (kg × water_factor / 100)

Example: 20 kg of cooked food recovered
  CO₂ bonus   = 20 × 2.5 × 10  = 500 env points
  Water bonus  = 20 × 500 / 100 = 100 env points
  Total env    = 600 bonus points added to profile
```

These appear as a separate "Green Score" on the profile alongside the main impact score, giving environmentally conscious donors a dedicated metric to optimise.

#### How Points Are Displayed

- **Profile page:** Large animated score counter, tier badge, progress bar to next tier, breakdown by category (operational vs environmental)
- **Listing cards:** Donor's tier badge shown next to their name — NGOs can trust high-tier donors before claiming
- **NGO profile:** Tier badge shown to donors on the Discover page — donors feel more confident claiming is worthwhile
- **Notification:** "You just earned +50 points for completing a delivery — you are 340 points away from Guardian status" sent after every task completion

---

### 18.3 Real-Time Volunteer Availability Tracking

#### The Problem It Solves

NGO coordinators running food redistribution operations face a coordination problem identical to a taxi dispatch centre: they need to know, at any instant, exactly which of their field workers are free, where they physically are, and whether their vehicle is appropriate for the next job. Without this visibility, coordinators make blind assignment decisions — calling volunteers one by one, getting voicemails, over-assigning the same person, or letting urgent food listings wait unclaimed while free volunteers sit idle two kilometres away.

#### How It Works

FoodBridge implements a **four-state volunteer availability model** combined with live GPS broadcasting that gives NGO coordinators military-grade situational awareness of their entire field team.

**The Four Availability States:**

```
AVAILABLE  →  Volunteer is logged in, ready for assignments
              GPS active, broadcasting every 10 seconds
              Shown as green dot on NGO Live Tracking map

ON_TASK    →  Volunteer has an active assignment
              GPS active, route line drawn on map
              ETA calculated from current position + Google Directions API
              Shown as blue (en route to pickup) or teal (in transit to NGO)

BREAK      →  Volunteer is temporarily unavailable
              GPS paused to save battery
              Shown as amber dot on map
              Estimated return time optionally set by volunteer

OFFLINE    →  Volunteer app closed or logged out
              Last known position shown as gray dot with timestamp
              Excluded from assignment suggestions entirely
```

**State Transitions:**

Every state change is initiated by the volunteer on their app (a large, thumb-friendly toggle on the home screen) and propagates to the NGO dashboard in under 500 milliseconds via Socket.io:

```
Volunteer taps "I'm Available"
    → PUT /api/volunteer/availability { status: 'available' }
    → DB: ngo_volunteers.availability_status = 'available'
    → Socket.io emit to room ngo_{ngo_id}: { volunteer_id, status: 'available' }
    → NGO dashboard: volunteer dot turns green, card moves to "Available" tab
    → NGO dashboard: assignment suggestion panel re-ranks automatically
    (All of the above in < 500ms end-to-end)
```

**The Live Tracking Map:**

The NGO's Live Tracking page is a full-screen Mapbox map that functions like a real-time dispatch board:

```
Every 10 seconds (while volunteer is on task):
    Volunteer app → POST /api/volunteer/location {
        task_id, lat, lng,
        speed_kmph, heading, accuracy_meters
    }
    Server → INSERT volunteer_location_logs
    Server → UPDATE ngo_volunteers.current_lat, current_lng
    Server → Socket.io emit to ngo_{ngo_id}: { volunteer_id, lat, lng, task_id }
    NGO map → volunteer marker animates smoothly to new position
    NGO map → route line recalculates from new position → pickup/delivery
    NGO map → ETA badge on task card updates
```

**Roster Health Panel:**

The NGO Home page shows a real-time roster health widget:

```
┌─────────────────────────────────────────────┐
│  TEAM STATUS RIGHT NOW                       │
│                                              │
│  🟢 Available     4 volunteers               │
│  🔵 On Task       3 volunteers               │
│  🟡 On Break      1 volunteer                │
│  ⚫ Offline        2 volunteers               │
│                                              │
│  Minimum required: 2 ← (configurable)        │
│  Status: ✅ Adequately staffed               │
│                                              │
│  Next scheduled check-in: Priya at 3:00 PM  │
│  Volunteer going offline soonest: Raju (2h)  │
└─────────────────────────────────────────────┘
```

**Anomaly Alerts:**

The system monitors for three specific anomalies and alerts the NGO coordinator immediately:

- **Volunteer silent alarm:** Volunteer on task with no GPS ping for > 30 minutes → alert sent, option to call or reassign
- **Task overrun:** Task has exceeded its estimated duration by > 50% → coordinator alerted with current volunteer location
- **Coverage gap:** Available volunteer count drops below the NGO's configured minimum → alert with suggestion to contact offline volunteers

#### What This Replaces

Without FoodBridge, this is how NGO coordinators currently operate: they maintain a mental model of where each volunteer is, send WhatsApp messages to check availability, wait for replies, and make assignment decisions based on stale information. The entire coordination overhead — which can consume 30–45 minutes per coordinator per day — is replaced by a live dashboard that a coordinator can read at a glance in under 10 seconds.

---

### 18.4 Smart Priority-Based Food Dispatch Scheduling

#### The Problem It Solves

When an NGO has multiple active claims simultaneously — which is the normal state for any active NGO during peak meal hours — the question of which food to dispatch first, to which volunteer, via which route, is a complex multi-variable optimisation problem. Currently, coordinators solve this with gut instinct, first-come-first-served assignment, or simple geographic proximity — all of which produce suboptimal outcomes that result in food expiring while volunteers travel inefficient routes.

#### How It Works

FoodBridge implements a **multi-dimensional dispatch scheduling engine** that evaluates every pending claim against every available volunteer and generates an optimal dispatch sequence — not just optimal individual assignments, but an optimal *ordering* of who goes where in what sequence.

**The Dispatch Priority Matrix:**

Every pending claim is scored on four dimensions and placed into a priority tier:

```
DIMENSION 1 — Expiry Criticality (weight: 35%)
  Critical   (< 1 hour)   → score 1.00  → Tier 1: DISPATCH NOW
  Urgent     (1-2 hours)  → score 0.75  → Tier 2: DISPATCH SOON
  Elevated   (2-4 hours)  → score 0.50  → Tier 3: SCHEDULE TODAY
  Standard   (> 4 hours)  → score 0.25  → Tier 4: FLEXIBLE

DIMENSION 2 — Quantity Value (weight: 25%)
  > 100 kg  → score 1.00  (high humanitarian value)
  50-100 kg → score 0.75
  20-50 kg  → score 0.50
  < 20 kg   → score 0.25

DIMENSION 3 — Donor Trust Score (weight: 20%)
  86-100    → score 1.00  (Legend/Champion donor — reliable listing)
  71-85     → score 0.75
  41-70     → score 0.50
  0-40      → score 0.25  (new or low-trust donor — higher pickup failure risk)

DIMENSION 4 — Dietary Match Exclusivity (weight: 20%)
  Unique dietary category NGO rarely receives → score 1.00
  Common category NGO receives frequently    → score 0.50
```

**The Dispatch Sequence Algorithm:**

```typescript
function generateDispatchSequence(
  pendingClaims: Claim[],
  availableVolunteers: Volunteer[]
): DispatchPlan[] {

  // Step 1: Score and tier every claim
  const scoredClaims = pendingClaims
    .map(claim => ({ claim, score: calculateClaimPriority(claim), tier: getTier(claim) }))
    .sort((a, b) => b.score - a.score);

  // Step 2: Score every volunteer against every claim
  const assignments: DispatchPlan[] = [];
  const assignedVolunteers = new Set<string>();
  const assignedClaims = new Set<string>();

  // Step 3: Greedy assignment — highest priority claim gets best volunteer
  for (const { claim, tier } of scoredClaims) {
    if (assignedClaims.has(claim.id)) continue;

    const eligibleVolunteers = availableVolunteers
      .filter(v => !assignedVolunteers.has(v.id))
      .filter(v => vehicleCapacityOk(v.vehicle_type, claim.quantity_kg))
      .map(v => ({ volunteer: v, score: scoreVolunteer(v, claim) }))
      .sort((a, b) => b.score - a.score);

    if (eligibleVolunteers.length === 0) {
      // No volunteer available — flag for coordinator attention
      assignments.push({ claim, volunteer: null, tier, reason: 'NO_VOLUNTEER_AVAILABLE' });
      continue;
    }

    const best = eligibleVolunteers[0];
    assignments.push({
      claim,
      volunteer: best.volunteer,
      score: best.score,
      tier,
      estimatedPickupMin: calculateETA(best.volunteer, claim),
      reason: buildReasonString(best.volunteer, claim, best.score)
    });

    assignedVolunteers.add(best.volunteer.id);
    assignedClaims.add(claim.id);
  }

  // Step 4: Route optimisation for volunteers with multiple sequential pickups
  return applyRouteOptimisation(assignments);
}
```

**The Dispatch Schedule View:**

The Task Assignment Board renders the output of this algorithm as a visual schedule:

```
┌─────────────────────────────────────────────────────────────────┐
│  DISPATCH SCHEDULE — Generated 2:47 PM         [AI Suggest ✨]   │
├──────┬──────────────────────────┬──────────┬──────┬────────────┤
│ Tier │ Food Item                │ Expires  │ Vol. │ ETA        │
├──────┼──────────────────────────┼──────────┼──────┼────────────┤
│  🔴1 │ Mutton Biryani · 30kg   │ 47 min   │ Raju │ 12 min     │
│  🔴1 │ Veg Pulao · 15kg        │ 1h 2min  │ Priya│ 8 min      │
│  🟡2 │ Bread Loaves · 40kg     │ 1h 45min │ Amit │ 22 min     │
│  🟡2 │ Fruit Box · 25kg        │ 2h 10min │ –    │ No vol.    │
│  🟢3 │ Packaged Rice · 80kg    │ 5h       │ –    │ Scheduled  │
│  🟢4 │ Dairy Items · 12kg      │ 8h       │ –    │ Flexible   │
└──────┴──────────────────────────┴──────────┴──────┴────────────┘
  ⚠️  1 claim needs volunteer — 2 volunteers currently on break
  💡  Amit can do bread + fruit box sequentially (saves 18 min)
```

**Sequence Optimisation for Multi-Stop Days:**

When a volunteer has capacity for multiple pickups in a single trip (common for smaller quantities), the scheduler generates an optimised multi-stop route using the Nearest Neighbour heuristic with 2-opt improvement (documented in Section 6.4):

```
VOLUNTEER: Raju Kumar (Van · Available)
OPTIMISED ROUTE FOR TODAY:

  Start: NGO Center (Koramangala)
    ↓  8 min
  Stop 1: Mutton Biryani pickup (Church Street) — URGENT ⏰
    ↓  6 min
  Stop 2: Veg Sandwiches pickup (MG Road)
    ↓  12 min
  Return: NGO Center
  ─────────────────────────────────
  Total: 26 min vs 41 min unoptimised
  Saving: 15 minutes  ←── AI-calculated
  Google Maps: [Open Route →]
```

**Coordinator Override:**

The dispatch schedule is always a suggestion, never a hard assignment. The coordinator can:
- Accept the full suggested schedule with one click ("Execute All")
- Accept individual assignments selectively
- Drag-and-drop to override any specific assignment
- Re-run the algorithm after any manual change to see updated recommendations

#### Why This Matters

A 15-minute route saving may seem modest. Across 10 volunteers doing 3 trips each per day, across 50 NGOs using the platform, that is **375 hours of volunteer time saved per day** — time that translates directly into additional pickups, more food recovered, and fewer listings expiring unclaimed.

---

### 18.5 Competitive Leaderboard & Profile Generation

#### The Problem It Solves

Humanitarian participation — donating food, volunteering time, coordinating pickups — is deeply motivating when people feel that their contribution is seen, valued, and recognised relative to others. Without visibility into standing, even highly motivated donors and NGOs plateau in engagement. The sector has never applied the engagement mechanics that drive contribution on platforms like GitHub (contribution graphs), Stack Overflow (reputation), or Strava (segment leaderboards) to food redistribution.

#### How It Works

FoodBridge generates dynamic, shareable profiles and competitive leaderboards for both donors and NGOs — updated in real time as actions are completed on the platform.

**Donor Public Profile Card:**

Every donor gets a beautiful, shareable profile card that auto-generates from their accumulated data:

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│   [LOGO/AVATAR]   Anand's Kitchen                        │
│                   🏆 Champion Donor · 6,240 pts          │
│                   Bangalore · Member since Jan 2024      │
│                                                          │
│  ┌─────────────┬─────────────┬─────────────┬──────────┐ │
│  │  340 kg     │  850 meals  │  18 NGOs    │  ★ 4.9   │ │
│  │  donated    │  provided   │  partnered  │  rating  │ │
│  └─────────────┴─────────────┴─────────────┴──────────┘ │
│                                                          │
│  🌱 Saved 850 kg CO₂ · 💧 170,000 L water saved         │
│                                                          │
│  CONTRIBUTION STREAK                                     │
│  ████████████████████░░░░░░░  22 / 30 days this month   │
│                                                          │
│  TOP FOOD CATEGORIES                                     │
│  Cooked Food ████████ 68%                                │
│  Raw Produce ████ 22%                                    │
│  Packaged    ██ 10%                                      │
│                                                          │
│  BADGES                                                  │
│  🏆 Champion  🌟 500kg Club  🔥 30-Day Streak  🤝 10 NGOs│
│                                                          │
│  [Share Profile]  [Download Certificate]                 │
└─────────────────────────────────────────────────────────┘
```

**NGO Public Profile Card:**

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│   [NGO LOGO]  Akshaya Patra - Koramangala                │
│               💎 Elite NGO · 12,890 pts                  │
│               Community Kitchen · Since Mar 2023         │
│               🛡️ Trust Score: 94 / 100                   │
│                                                          │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │ 2,840 kg │  7,100   │   450    │  12 vol. │  98%   │ │
│  │ received │  meals   │  people  │  active  │ comp.  │ │
│  └──────────┴──────────┴──────────┴──────────┴────────┘ │
│                                                          │
│  🌿 7,100 kg CO₂ saved · 🏆 City Rank: #3               │
│                                                          │
│  OPERATIONS HEALTH                                       │
│  Avg assignment time    ████████████░░  8 min            │
│  Task completion rate   ███████████████ 98%              │
│  Volunteer utilisation  █████████░░░░░  72%              │
│                                                          │
│  TOP DONOR PARTNERS                                      │
│  Anand's Kitchen · Hotel Leela · MTR Foods               │
│                                                          │
│  BADGES                                                  │
│  💎 Elite NGO  👑 1000kg Club  ⚡ Speed Dispatch          │
│  🌟 Perfect Month  🤝 10+ Donors                         │
│                                                          │
│  [Share Profile]  [View Impact Report]                   │
└─────────────────────────────────────────────────────────┘
```

**The Leaderboards:**

FoodBridge maintains six parallel leaderboards, each refreshing every 15 minutes:

```
DONOR LEADERBOARDS
┌──────────────────────────────────────────────────────────┐
│  🏆 TOP DONORS — BANGALORE — THIS MONTH                   │
├────┬──────────────────────┬────────┬──────────┬──────────┤
│ #  │ Donor                │  Tier  │  kg      │  Points  │
├────┼──────────────────────┼────────┼──────────┼──────────┤
│ 🥇1│ Anand's Kitchen      │   🏆   │  68 kg   │  +840 ↑  │
│ 🥈2│ Hotel Leela BLR      │   🏆   │  54 kg   │  +720    │
│ 🥉3│ MTR Foods Outlet     │   🌳   │  41 kg   │  +610    │
│  4 │ Saritha Home Kitchen │   🌳   │  38 kg   │  +540    │
│  5 │ Koshy's Restaurant   │   🌿   │  29 kg   │  +420    │
│ .. │ ...                  │        │          │          │
│ 47 │ You (Ravi's Café)    │   🌱   │  8 kg    │  +140    │
│    │ ↑ 3 positions        │        │          │          │
└────┴──────────────────────┴────────┴──────────┴──────────┘

Tabs: This Week | This Month | All Time | My City | India
```

```
NGO LEADERBOARDS
┌──────────────────────────────────────────────────────────┐
│  🏆 TOP NGOs — INDIA — ALL TIME                           │
├────┬──────────────────────┬────────┬──────────┬──────────┤
│ #  │ NGO                  │  Tier  │  kg recd │  Points  │
├────┼──────────────────────┼────────┼──────────┼──────────┤
│ 🥇1│ Akshaya Patra BLR    │   👑   │ 12,400kg │  89,200  │
│ 🥈2│ Robin Hood Army MUM  │   👑   │ 11,800kg │  84,600  │
│ 🥉3│ No Food Waste CHN    │   💎   │  8,200kg │  61,400  │
│  4 │ Feeding India DEL    │   💎   │  7,600kg │  57,800  │
│  5 │ Roti Bank HYD        │   💎   │  6,900kg │  52,300  │
└────┴──────────────────────┴────────┴──────────┴──────────┘

Tabs: Food Recovered | Meals Provided | Tasks Completed | CO₂ Saved | Speed
```

**The Six Leaderboard Dimensions:**

| Leaderboard | Metric | Scope Options | Refresh |
|---|---|---|---|
| Food Heroes | Total kg donated (donors) | City / State / India | 15 min |
| Meal Makers | Total meals provided (NGOs) | City / State / India | 15 min |
| Speed Champions | Avg task assignment time (NGOs) | City / State / India | 15 min |
| Green Warriors | CO₂ equivalent saved | City / State / India | 15 min |
| Streak Masters | Longest active donation streak | City / State / India | Daily |
| Rising Stars | Highest points earned this week | City / State / India | 15 min |

**Shareable Impact Certificate:**

At any time, a donor or NGO can generate a shareable PDF or PNG impact certificate — auto-designed from their profile data:

```
╔══════════════════════════════════════════════════════╗
║                                                       ║
║              FOODBRIDGE IMPACT CERTIFICATE            ║
║                                                       ║
║   This certifies that                                 ║
║                                                       ║
║              ANAND'S KITCHEN                          ║
║                                                       ║
║   has contributed to ending food waste and hunger     ║
║                                                       ║
║   ▸ 340 kg of surplus food donated                   ║
║   ▸ 850 meals provided to communities in need        ║
║   ▸ 18 NGO partnerships across Bangalore             ║
║   ▸ 850 kg CO₂ equivalent diverted from landfill     ║
║                                                       ║
║   Tier: Champion Donor 🏆                            ║
║   Verified: FoodBridge Platform · March 2025         ║
║                                                       ║
║   [QR code linking to public profile]                 ║
╚══════════════════════════════════════════════════════╝
```

This certificate is:
- Generated as a high-resolution PNG (1080×1080, optimised for LinkedIn and Instagram)
- Generated as a PDF (A4, suitable for CSR reports, grant applications, annual reports)
- Hosted at a permanent public URL (`foodbridge.in/certificate/donor/{id}`) that verifies authenticity via QR scan
- Auto-regenerated monthly with updated figures

**Why Competitive Leaderboards Drive Real Behaviour Change:**

Research from gamification studies in adjacent domains (fitness, recycling, energy saving) consistently shows that visibility of ranking relative to peers is one of the strongest behavioural motivators available without financial incentives. A restaurant owner who sees themselves at rank 47 in their city — and sees that rank 40 requires only 5 more kg this month — has a specific, achievable goal that drives a concrete action. The platform does not need to pay for that motivation; it simply needs to make the gap visible.

The combination of: personal profile showing cumulative contribution, tier badge showing status relative to all users, leaderboard showing position relative to local peers, streak counter showing consistency, and a shareable certificate showing external recognition — creates a complete engagement loop that no food redistribution platform has ever deployed.

---

> **Summary:** These five innovations — adaptive urgency-based discovery, impact points with tier progression, real-time volunteer situational awareness, multi-dimensional dispatch optimisation, and competitive profile and leaderboard generation — are individually significant and collectively unique. No existing platform in the food redistribution sector combines all five. Each one attacks a specific failure mode that causes surplus food to go to waste despite available NGOs and willing volunteers. Together they form an end-to-end system that makes food redistribution as operationally reliable, motivating, and accountable as a commercial delivery platform — applied entirely to a humanitarian mission.

---

## Contributing

We welcome contributions from the community. Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes, run tests
npm test

# Submit pull request against main
```

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**FoodBridge** — Built for EcoTech Hackathon

*Every kilogram of food saved is a meal served.*

</div>
