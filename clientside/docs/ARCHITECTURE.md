# EventPass Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + React)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Main App (page.jsx)                         │  │
│  │  - State Management (Events, Tickets, User, Ledger)     │  │
│  │  - View Routing (marketplace, wallet, scanner, etc)     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│        ┌────────────────┼────────────────┐                     │
│        │                │                │                     │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │  Navbar     │  │  Components  │  │  Database    │         │
│   ├─────────────┤  ├──────────────┤  │  Functions   │         │
│   │ - Routes    │  │ - Events     │  │              │         │
│   │ - User Menu │  │ - Tickets    │  │ - Events     │         │
│   │ - Auth      │  │ - Dashboard  │  │ - Users      │         │
│   └─────────────┘  │ - Scanner    │  │ - Tickets    │         │
│                    │ - Admin      │  │ - Ledger     │         │
│                    │ - Verify     │  │ - Auth       │         │
│                    └──────────────┘  └──────────────┘         │
│                                              │                 │
└──────────────────────────────────────────────┼─────────────────┘
                                              │
                    ┌─────────────────────────┴──────────────────┐
                    │                                            │
                    ▼                                            ▼
        ┌──────────────────────────┐          ┌────────────────────────┐
        │   Supabase Auth          │          │    Supabase Database   │
        ├──────────────────────────┤          ├────────────────────────┤
        │ - User Authentication    │          │ Tables:                │
        │ - Session Management     │          │ ├─ user_profiles       │
        │ - Sign Up/Sign In        │          │ ├─ events              │
        │ - JWT Tokens             │          │ ├─ tickets             │
        │                          │          │ ├─ ledger              │
        │ REST API Endpoints       │          │                        │
        │ /auth/v1/signup          │          │ Row Level Security     │
        │ /auth/v1/signin          │          │ (RLS) Policies         │
        │ /auth/v1/user            │          │                        │
        └──────────────────────────┘          └────────────────────────┘
```

## Component Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│                      Application Flow                          │
└────────────────────────────────────────────────────────────────┘

    USER REGISTRATION
    ═════════════════
    1. User Sign Up (Login page)
         │
         ▼
    2. Supabase Auth creates auth.users entry
         │
         ▼
    3. On first login, user_profiles record created
         │
         ▼
    4. User goes to "My Profile"
         │
         ▼
    5. Fill details (name, address, ID)
         │
         ▼
    6. Click "Save" → updateUserProfile() → Saved to DB
         │
         ▼
    ✅ Profile Complete


    EVENT BROWSING
    ══════════════
    1. User opens Marketplace
         │
         ▼
    2. EventsMarketplace.jsx mounts
         │
         ▼
    3. useEffect calls getAllEvents()
         │
         ▼
    4. Supabase fetches events WHERE is_active = true
         │
         ▼
    5. Events rendered in cards
         │
         ▼
    6. User can search/filter events
         │
         ▼
    ✅ Events Displayed


    EVENT CREATION (ADMIN ONLY)
    ═══════════════════════════
    1. Admin clicks "Manage Events"
         │
         ▼
    2. AdminDashboard checks is_admin flag (RLS)
         │
         ▼
    3. Existing events loaded via getAllEvents()
         │
         ▼
    4. Admin clicks "+ Add New Event"
         │
         ▼
    5. Form opens with fields:
         - Title, Location, Date, Price
         - Category, Image URL, Available tickets
         │
         ▼
    6. Admin fills form + clicks "Save"
         │
         ▼
    7. createEvent() → Supabase inserts to events table
         │
         ▼
    8. List refreshes, new event appears
         │
         ▼
    9. Event visible in Marketplace immediately
         │
         ▼
    ✅ Event Live


    TICKET PURCHASE
    ═══════════════
    1. User selects event from Marketplace
         │
         ▼
    2. Modal shows event details
         │
         ▼
    3. If user not verified → IdentityVerification modal
         │
         ▼
    4. User scans biometrics → bioHash generated
         │
         ▼
    5. User clicks "Confirm Purchase"
         │
         ▼
    6. buyTicket() function triggered
         │
         ▼
    7. addToLedger('MINT', ...) → New ledger entry
         │
         ▼
    8. createTicket() → New ticket in DB
         │
         ▼
    9. User redirected to "My Tickets"
         │
         ▼
    ✅ Ticket Purchased


    VENUE ENTRY
    ═══════════
    1. User at venue, goes to "Venue Scanner"
         │
         ▼
    2. Scans QR code + face
         │
         ▼
    3. simulateScan() checks:
         - Is ticket ACTIVE?
         - Does bioHash match user's?
         │
         ├─ Match → "ACCESS GRANTED" ✅
         ├─ Mismatch → "ID MISMATCH" ⚠️ (Scalper)
         └─ Invalid → "INVALID TICKET" ❌
         │
         ▼
    4. Result stored in ledger
         │
         ▼
    ✅ Verification Complete
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────┐
│                 Entity Relationship Diagram          │
└─────────────────────────────────────────────────────┘

auth.users (Supabase Built-in)
├── id (UUID)
├── email
├── created_at
└── updated_at
    │
    ├─ 1:1 ─────────────► user_profiles
    │                   ├── id (FK)
    │                   ├── full_name
    │                   ├── phone
    │                   ├── government_id
    │                   ├── is_admin
    │                   ├── bio_hash
    │                   └── timestamps
    │
    ├─ 1:N ─────────────► tickets
                        ├── id (UUID)
                        ├── owner_id (FK)
                        ├── event_id (FK)
                        ├── ticket_id
                        ├── bio_hash
                        ├── status
                        └── timestamps
                            │
                            ├─ N:1 ──► events
                                      ├── id (UUID)
                                      ├── title
                                      ├── location
                                      ├── date
                                      ├── price
                                      ├── category
                                      ├── available
                                      ├── is_active
                                      ├── created_by (FK)
                                      └── timestamps

ledger (Independent)
├── id (UUID)
├── type (MINT/BURN/GENESIS)
├── details (JSONB)
└── created_at
    │
    └─ References both users & events in details field
```

## API/Function Call Flow

```
┌────────────────────────────────────────────────┐
│      Database Function Call Sequence           │
└────────────────────────────────────────────────┘

Frontend Component
       │
       ├─► getUserProfile(userId)
       │       │
       │       └─► Supabase
       │           SELECT * FROM user_profiles
       │           WHERE id = userId
       │
       ├─► updateUserProfile(userId, data)
       │       │
       │       └─► Supabase
       │           UPSERT user_profiles
       │           WHERE id = userId
       │
       ├─► getAllEvents()
       │       │
       │       └─► Supabase
       │           SELECT * FROM events
       │           WHERE is_active = true
       │           ORDER BY date
       │
       ├─► createEvent(eventData)
       │       │
       │       └─► Supabase
       │           INSERT INTO events
       │           (title, location, date, price, ...)
       │
       ├─► createTicket(ticketData)
       │       │
       │       └─► Supabase
       │           INSERT INTO tickets
       │           (ticket_id, owner_id, event_id, ...)
       │
       ├─► addLedgerEntry(type, details)
       │       │
       │       └─► Supabase
       │           INSERT INTO ledger
       │           (type, details, created_at)
       │
       └─► isUserAdmin(userId)
               │
               └─► Supabase
                   SELECT is_admin FROM user_profiles
                   WHERE id = userId
```

## Security & RLS Policies

```
┌──────────────────────────────────────────────┐
│       Row Level Security (RLS) Enforcement   │
└──────────────────────────────────────────────┘

user_profiles
├─ SELECT: auth.uid() = id (own profile only)
├─ UPDATE: auth.uid() = id (own profile only)
└─ OR: is_admin = true (admins see all)

events
├─ SELECT: is_active = true (all users)
├─ INSERT: is_admin = true (admins only)
├─ UPDATE: is_admin = true (admins only)
└─ DELETE: is_admin = true (admins only)

tickets
├─ SELECT: auth.uid() = owner_id (own tickets)
├─ INSERT: (system operations)
├─ UPDATE: auth.uid() = owner_id (own status only)
└─ DELETE: NOT ALLOWED

ledger
├─ SELECT: auth.role() = 'authenticated' (all users)
├─ INSERT: (system operations)
└─ DELETE: NOT ALLOWED
```

## Environment & Config

```
Frontend Configuration
─────────────────────
.env.local
├── NEXT_PUBLIC_SUPABASE_URL
├── NEXT_PUBLIC_SUPABASE_ANON_KEY
└── (Public keys only - safe for frontend)

Supabase Project
────────────────
Settings → API
├── Project URL
├── Anon Key (public)
└── Service Role Key (keep private!)

Client Initialization
─────────────────────
lib/supabase/clients.ts
└─► createClient()
    ├─ Uses anon key (public)
    ├─ Creates authenticated session
    └─ Uses RLS policies for security
```

## Deployment Checklist

- [ ] Create all tables in Supabase
- [ ] Set up RLS policies
- [ ] Make admin user (is_admin = true)
- [ ] Add environment variables (.env.local)
- [ ] Test user registration flow
- [ ] Test admin event creation
- [ ] Test event browsing
- [ ] Test ticket purchase
- [ ] Test venue scanner
- [ ] Test profile editing
- [ ] Verify RLS security (try accessing other user's data)
- [ ] Deploy to production
