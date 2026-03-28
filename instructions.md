hackathon ps: EcoTech: 
FoodBridge: Real-Time Surplus Food Redistribution Platform 
A significant amount of food waste occurs at the consumer level due to the absence of efficient 
redistribution systems. Surplus food often goes unused because there is no real-time mechanism to 
connect individuals or providers with those who need it. Additionally, limited awareness and poor 
coordination further hinder timely redistribution. 
This gap leads to increased food wastage, contributing to environmental damage and lost 
opportunities to combat hunger. Without a reliable and trusted system to manage logistics, safety, 
and accessibility, surplus food cannot be effectively utilized to support communities in need.

now neeed to create a food supplier/donar dashboard



You are an expert full-stack developer. Build the complete Food Donor / Supplier Dashboard for FoodBridge — a real-time surplus food redistribution platform. This is one of three portals in the system. Build it as a production-grade, fully functional web application using:

TECH STACK:
- Frontend: React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui
- Backend: Node.js + Express + Socket.io
- Database: Supabase (PostgreSQL + Realtime subscriptions)
- Auth: Supabase Auth (email/password + OTP phone verification)
- Storage: Supabase Storage (for food images and KYC documents)
- Maps: Google Maps API / Mapbox for pickup location pinning
- Notifications: Supabase Realtime + Firebase Cloud Messaging (push) + Nodemailer (email)
- AI: OpenAI API (GPT-4o) for food description assistance and expiry prediction
- Payments: Razorpay (optional: for premium donor subscription)
- State: Zustand
- Forms: React Hook Form + Zod validation
- Animations: Framer Motion

=== AUTHENTICATION & VERIFICATION (FRAUD PREVENTION) ===
Build a multi-step onboarding flow for donors:

Step 1 — Basic sign up:
- Full legal name, email, password (min 10 chars, zxcvbn strength meter)
- Phone number with OTP verification (Twilio or Supabase phone auth)
- Email verification link sent after registration

Step 2 — Identity verification:
- Upload government-issued ID (Aadhaar / PAN / Passport) — stored in Supabase Storage with RLS policies so only admins can read
- Upload a selfie for manual face-match by admin
- Business/individual toggle: if business, require FSSAI license number + GST number
- Terms of service acceptance with checkbox

Step 3 — Address & location:
- Full address with pincode autocomplete
- Mark pickup address on an interactive map (drag-and-drop pin)
- Operating hours selector (days + time ranges)

Step 4 — Pending admin approval:
- Donor account is created with status = 'pending_verification'
- Dashboard shows a locked state with "Your account is under review" banner
- Email/SMS sent to donor when approved or rejected (with reason)
- Admin can approve, reject, or request additional documents

All sessions use Supabase JWT. Implement refresh token rotation. Add rate limiting (express-rate-limit) on all auth endpoints: max 5 login attempts per 15 minutes, block for 1 hour after exceeded. Log all auth events (login, logout, failed attempts) to an audit_logs table.

=== SUPABASE SCHEMA (create migrations for these tables) ===
donors: id, user_id (FK auth.users), full_name, email, phone, status (enum: pending|verified|suspended|rejected), donor_type (individual|business), fssai_number, gst_number, kyc_document_url, selfie_url, address, lat, lng, operating_hours (JSONB), rating, total_donations, created_at, updated_at

food_listings: id, donor_id (FK), title, description, category (enum: cooked_food|raw_produce|packaged|beverages|other), quantity, quantity_unit, expiry_datetime, pickup_from, pickup_to, pickup_address, lat, lng, images (text[]), status (enum: available|claimed|partially_claimed|completed|expired|cancelled), is_urgent (bool), tags (text[]), ai_generated_description (text), created_at, updated_at

claims: id, listing_id (FK), receiver_id (FK), quantity_claimed, status (enum: pending|confirmed|picked_up|cancelled), pickup_code (6-digit OTP), confirmed_at, picked_up_at, created_at

reviews: id, claim_id (FK), reviewer_id, reviewee_id, rating (1-5), comment, created_at

notifications: id, user_id, type, message, read (bool), metadata (JSONB), created_at

audit_logs: id, user_id, action, ip_address, user_agent, metadata (JSONB), created_at

Enable Row Level Security on all tables. Donors can only read/write their own rows.

=== DONOR DASHBOARD — PAGE BY PAGE ===

SIDEBAR NAVIGATION:
- FoodBridge logo at top
- Nav items: Dashboard, My Listings, Create Listing, Analytics, Notifications (badge), Profile & Settings
- Bottom: Help Center, Logout
- Collapse to icon-only on mobile
- Show verification status badge (Pending / Verified / Suspended) next to avatar

HOME / OVERVIEW PAGE:
Build a rich stats dashboard:
- Impact cards: "X kg food saved", "Y meals provided", "Z NGOs helped", "A pickups completed" — animated count-up on load
- Weekly donation bar chart (Recharts)
- Listing status donut chart (available / claimed / expired)
- "Expiring soon" alert strip — listings expiring in < 4 hours shown with countdown timers
- Recent activity feed (real-time via Supabase Realtime subscriptions — new claims appear instantly without refresh)
- Carbon footprint offset calculator (estimate CO₂ saved based on kg of food)

CREATE LISTING PAGE:
Multi-step listing form with validation at each step:

Step 1 — Food details:
- Title (with AI assist button: click sends food name + category to GPT-4o, returns a rich description, safety notes, serving suggestions — shown in a modal for donor to accept/edit/reject)
- Category dropdown (with icons)
- Quantity + unit (kg, liters, portions, boxes, packets)
- Expiry date & time picker (must be > 1 hour from now)
- Tags multi-select (vegetarian, vegan, contains-allergens, refrigerated-required, hot-food, etc.)
- Is urgent toggle (shows listing with red badge to receivers)
- Safety note textarea

Step 2 — Photos:
- Drag-and-drop image upload (max 5 images, max 5MB each)
- Image crop/resize with react-image-crop before upload to Supabase Storage
- Preview grid

Step 3 — Pickup details:
- Pickup window: date + start time + end time
- Pickup address (autocomplete from donor's saved address or enter new)
- Mark exact location on map (Mapbox/Google Maps, drag pin)
- Special instructions textarea

Step 4 — Review & publish:
- Full preview of listing as receivers will see it
- "Save as draft" or "Publish now" buttons
- On publish: listing inserted to DB, real-time notification pushed to eligible receivers (filtered by proximity and category preferences), AI tags generated in background

MANAGE LISTINGS PAGE:
- Tabbed view: All | Available | Claimed | Completed | Expired
- Sortable, filterable table with search
- Each row: thumbnail, title, quantity, status badge, expiry countdown, claims count, actions
- Actions: Edit (if status=available), Cancel, View claims, Mark as fully picked up
- Bulk actions: cancel selected, duplicate selected
- Export to CSV button

LISTING DETAIL PAGE:
- Full listing view
- Claims sub-table: receiver name, NGO, quantity claimed, status, pickup code, action (confirm pickup by entering 6-digit code that receiver shows)
- Real-time updates: when receiver claims, entry appears instantly
- Pickup code verification: donor enters code → backend validates → marks claim as picked_up → triggers impact points
- Chat panel: real-time messaging with specific receiver about a claim (Socket.io room per claim)

ANALYTICS PAGE:
- Date range picker
- Line chart: donations over time
- Bar chart: top food categories donated
- Map heatmap: where pickups happened
- Receiver breakdown: which NGOs received most
- Impact report downloadable as PDF (use jsPDF)

NOTIFICATIONS PAGE:
- Bell icon with unread count badge
- List of notifications: new claim, claim cancelled, pickup confirmed, review received, listing expiring soon
- Mark all as read
- Click notification → navigate to relevant page

PROFILE & SETTINGS PAGE:
- Edit profile info (re-verify phone if changed)
- Upload/update KYC documents
- Notification preferences (push/email/SMS toggles per notification type)
- Operating hours editor
- Danger zone: deactivate account, delete account

=== REAL-TIME FEATURES ===
- Use Supabase Realtime on food_listings and claims tables
- When a receiver claims a listing, donor sees an animated notification slide in without page reload
- When claim count approaches total quantity, urgency indicator updates live
- Listing status badge updates in real-time across all open browser windows

=== AI/ML FEATURES ===
1. AI description generator: POST /api/ai/generate-description — sends title + category + tags to GPT-4o, returns description + safety notes + suggested serving size. Show streaming response in a typewriter modal.

2. Expiry risk scorer: background cron (node-cron) runs every 30 min — queries listings expiring in < 2 hours with status=available, sends push notifications to nearby receivers automatically, marks listing as urgent.

3. Fraud detection heuristics (rule-based + AI): flag donor accounts that:
   - Post listings with expiry in the past
   - Have > 3 claims cancelled in 24h
   - Post unrealistic quantities (> 500 kg single listing for individual donor)
   - New account with > 10 listings in first hour
   Flag to admin review queue automatically.

=== DESIGN REQUIREMENTS ===
- Color palette: Primary green (#16A34A), accent amber (#D97706), neutrals
- Font: Inter
- Dark mode support (next-themes)
- Fully responsive: mobile-first design
- Micro-animations: Framer Motion for page transitions, card hover lifts, modal springs
- Loading skeletons (not spinners) for all data fetches
- Empty states with illustrations for each page (use undraw.co SVGs)
- Toast notifications (react-hot-toast) for all user actions
- Error boundaries around every major section
- Accessible: ARIA labels, keyboard navigation, focus rings

=== API ENDPOINTS TO BUILD (Node.js/Express) ===
POST   /api/auth/register
POST   /api/auth/verify-otp
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/donors/me
PUT    /api/donors/me
POST   /api/donors/kyc-upload
GET    /api/listings (with filters: status, category, search, page, limit)
POST   /api/listings
GET    /api/listings/:id
PUT    /api/listings/:id
DELETE /api/listings/:id
GET    /api/listings/:id/claims
POST   /api/listings/:id/verify-pickup (body: { pickup_code })
GET    /api/analytics/overview
GET    /api/analytics/export-pdf
POST   /api/ai/generate-description
GET    /api/notifications
PUT    /api/notifications/read-all

All endpoints: JWT middleware, input sanitization (express-validator), error handling middleware returning consistent { success, data, error } shape.

=== FOLDER STRUCTURE ===
/client (React Vite app)
  /src
    /components (Button, Input, Modal, DataTable, MapPicker, ImageUpload, ListingCard, ClaimRow, NotificationPanel, ...)
    /pages (Dashboard, CreateListing, ManageListings, ListingDetail, Analytics, Notifications, Profile, Auth/*)
    /hooks (useAuth, useListings, useClaims, useRealtime, useAI)
    /store (Zustand: authStore, listingStore, notificationStore)
    /lib (supabase client, api client with axios interceptors, socket client)
    /types (all TypeScript interfaces matching DB schema)
/server (Node.js Express)
  /routes
  /controllers
  /middleware (auth, rateLimit, validate, errorHandler)
  /services (ai.service, notification.service, fraud.service)
  /jobs (expiryChecker.job.ts)
  /utils

=== ENVIRONMENT VARIABLES NEEDED ===
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
GOOGLE_MAPS_API_KEY or MAPBOX_TOKEN
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE
SMTP_HOST, SMTP_USER, SMTP_PASS
FCM_SERVER_KEY
REDIS_URL
JWT_SECRET, JWT_REFRESH_SECRET
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (optional)

Build this completely. Every button should work. Every form should validate. Every real-time event should update the UI without a page refresh. This should be deployable on Vercel (frontend) + Railway (backend) + Supabase (database).