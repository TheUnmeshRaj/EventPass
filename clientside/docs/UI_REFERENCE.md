# 🎨 EventPass UI Reference Guide

## Navigation Flow

```
HOME (Events Marketplace)
├─ Events Tab
│  ├─ Browse all events
│  ├─ Search by title/location
│  └─ Book event
│
├─ My Tickets Tab
│  ├─ View purchased tickets
│  ├─ Resell tickets
│  └─ View history
│
├─ Ledger Tab
│  ├─ View blockchain history
│  ├─ Transaction records
│  └─ Audit trail
│
├─ Venue Tab
│  ├─ Scan QR codes
│  ├─ Face verification
│  └─ Entry status
│
└─ Profile Menu (Top Right)
   ├─ My Profile ★ (NEW)
   │  └─ Edit personal details
   │
   ├─ Manage Events ★ (NEW - Admin only)
   │  ├─ Create event
   │  ├─ Edit event
   │  └─ Delete event
   │
   ├─ Ledger
   │  └─ View transactions
   │
   └─ Sign Out
```

---

## 📱 Screen Layouts

### 1. My Profile Screen (NEW)

```
┌─────────────────────────────────────────┐
│                                         │
│  [Avatar] My Profile      [Edit Button] │
│  user@example.com                      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Personal Information                  │
│  ┌──────────────────────────────────┐  │
│  │ Full Name: ________________       │  │
│  │ Email:     user@example.com (fixed)
│  │ Phone:     ________________       │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Government ID                         │
│  ┌──────────────────────────────────┐  │
│  │ ID Type:   [Aadhaar ▼]           │  │
│  │ ID Number: ________________       │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Address                               │
│  ┌──────────────────────────────────┐  │
│  │ Street:    ________________       │  │
│  │ City:      ________________       │  │
│  │ State:     ________________       │  │
│  │ Pincode:   ________________       │  │
│  └──────────────────────────────────┘  │
│                                         │
│          [Save] [Cancel]                │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Manage Events Screen (NEW)

```
┌──────────────────────────────────────────────┐
│                                              │
│  Event Management        [+ Add New Event]   │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  Events Table:                               │
│  ┌──────────────────────────────────────┐   │
│  │ Event      │ Category │ Date │ Price│   │
│  ├──────────────────────────────────────┤   │
│  │ [img]      │ Sports   │5/28  │ ₹3500│   │
│  │ IPL Final  │          │ 2025 │[Edit]│   │
│  │            │          │      │[Del] │   │
│  ├──────────────────────────────────────┤   │
│  │ [img]      │ Music    │6/15  │ ₹2500│   │
│  │ Arijit     │          │ 2025 │[Edit]│   │
│  │ Singh      │          │      │[Del] │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  CREATE EVENT MODAL (Popup):                 │
│  ┌──────────────────────────────────────┐   │
│  │ Create New Event            [X Close]│   │
│  ├──────────────────────────────────────┤   │
│  │ Event Title: ____________________     │   │
│  │ Category:    [Sports ▼]              │   │
│  │ Location:    ____________________     │   │
│  │ Date:        [Date Picker ____]      │   │
│  │ Price (₹):   [____]                  │   │
│  │ Tickets:     [____]                  │   │
│  │ Image URL:   _____________________   │   │
│  │              [Image Preview]         │   │
│  │ Description: ____________________    │   │
│  │              ____________________    │   │
│  │                                      │   │
│  │        [Save Event] [Cancel]         │   │
│  └──────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
```

### 3. Updated Events Marketplace

```
┌──────────────────────────────────────────┐
│                                          │
│  Upcoming Events    [🔍 Search____]      │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────┐ ┌────────────┐          │
│  │   [IMG]    │ │   [IMG]    │          │
│  │   IPL      │ │   Arijit   │          │
│  │   Sports   │ │   Music    │          │
│  │ Wankhede   │ │ JLN Stadium│          │
│  │ 5/28/2025  │ │ 6/15/2025  │          │
│  │ ₹3500      │ │ ₹2500      │          │
│  │ [Book Now] │ │ [Book Now] │          │
│  └────────────┘ └────────────┘          │
│                                          │
│  ┌────────────┐                          │
│  │   [IMG]    │                          │
│  │  Sunburn   │                          │
│  │ Festival   │                          │
│  │ Vagator    │                          │
│  │12/29/2025  │                          │
│  │ ₹4000      │                          │
│  │ [Book Now] │                          │
│  └────────────┘                          │
│                                          │
│  Search Results: "3 events found"        │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🎯 User Flow Diagrams

### Event Booking Flow

```
Start
  │
  ▼
Browse Events
  │
  ├─► Search/Filter Events
  │        │
  │        ▼
  │    Display Results
  │        │
  └─────── ▼
       Select Event
           │
           ▼
       [Verification Modal]
       ─────────────────
       │
       ├─ User verified? YES ──► Confirm Purchase Modal
       │                              │
       │                              ▼
       │                          Click "Confirm & Pay"
       │                              │
       │                              ▼
       │                        Processing...
       │                              │
       │                              ▼
       │                        ✅ Ticket Created
       │                              │
       │                              ▼
       │                        Redirect to My Tickets
       │
       └─ User verified? NO ──► Scan Biometric
                                    │
                                    ▼
                              Biometric Hash Created
                                    │
                                    ▼
                              Verify Identity Modal
                                    │
                                    └─────► [Try Scan Again]
                                            [Cancel]
```

### Admin Event Management Flow

```
Start
  │
  ▼
Click "Manage Events"
  │
  ├─ RLS Check: is_admin? YES ──► Show Events Table
  │                                     │
  │                                     ├─► Edit Event
  │                                     │        │
  │                                     │        ▼
  │                                     │    Modal Opens
  │                                     │        │
  │                                     │        ▼
  │                                     │    Change Fields
  │                                     │        │
  │                                     │        ▼
  │                                     │    Save → Database
  │                                     │        │
  │                                     │        ▼
  │                                     │    ✅ Event Updated
  │                                     │        │
  │                                     │        ▼
  │                                     │    List Refreshes
  │                                     │
  │                                     ├─► Delete Event
  │                                     │        │
  │                                     │        ▼
  │                                     │    Confirm Delete?
  │                                     │        │
  │                                     │        ▼
  │                                     │    ✅ Event Marked Inactive
  │                                     │        │
  │                                     │        ▼
  │                                     │    Removed from List
  │                                     │
  │                                     └─► Create New Event
  │                                              │
  │                                              ▼
  │                                          [+ Add New Event] Button
  │                                              │
  │                                              ▼
  │                                          Modal Opens
  │                                              │
  │                                              ▼
  │                                          Fill Form
  │                                              │
  │                                              ▼
  │                                          Preview Image
  │                                              │
  │                                              ▼
  │                                          Save Event
  │                                              │
  │                                              ▼
  │                                          ✅ Event Created
  │                                              │
  │                                              ▼
  │                                          Appears in List
  │
  └─ is_admin? NO ──► Access Denied
```

---

## 📊 Component Relationship

```
SatyaTicketingApp (Main State)
│
├─► Navbar (Navigation & User Menu)
│   ├─ view state
│   ├─ user state
│   └─ setView function
│
├─► EventsMarketplace (Dynamic from Supabase)
│   ├─ setSelectedEvent
│   └─ Events fetched from DB
│
├─► UserDashboard (NEW - User Profile)
│   ├─ authUser prop
│   ├─ Read from user_profiles table
│   └─ Update to database
│
├─► AdminDashboard (NEW - Event Management)
│   ├─ Fetch all events
│   ├─ Create/Update/Delete
│   └─ RLS controls access
│
├─► MyTickets (User Tickets)
│   ├─ myTickets state
│   └─ resellTicket function
│
├─► Ledger (Transaction History)
│   ├─ ledger state
│   └─ Display blockchain entries
│
├─► VenueScanner (Entry Verification)
│   ├─ Scan & verify
│   └─ Biometric check
│
└─► IdentityVerification (KYC Modal)
    ├─ Biometric scan
    └─ Generate hash
```

---

## 🔄 State Management

```
SatyaTicketingApp State:
├─ view: 'marketplace' | 'wallet' | 'dashboard' | 'scanner' | 
│        'user-profile' | 'admin-events'
│
├─ user: { name, verified, id, bioHash }
├─ ledger: [...transactions]
├─ myTickets: [...tickets]
├─ selectedEvent: event object
├─ processing: boolean
├─ scanResult: 'valid' | 'invalid' | 'mismatch' | null
│
├─ isScanningFace: boolean
├─ scanProgress: 0-100
│
├─ authUser: Supabase user object
└─ accountOpen: boolean
```

---

## 🎨 Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #10B981 | Emerald-600 (Buttons, Accents) |
| Dark | #0F172A | Slate-900 (Background) |
| Light | #F1F5F9 | Slate-50 (Background) |
| Success | #059669 | Emerald-700 (Confirmations) |
| Error | #DC2626 | Red-600 (Errors) |
| Warning | #F59E0B | Amber-600 (Warnings) |
| Info | #3B82F6 | Blue-600 (Info) |

---

## 📐 Responsive Design

```
Mobile (<640px)
├─ Stack vertically
├─ Full width forms
├─ Hide sidebar navigation
└─ Touch-friendly buttons

Tablet (640px - 1024px)
├─ 2-column grid for events
├─ Side navigation appears
└─ Balanced layout

Desktop (>1024px)
├─ 3-column grid for events
├─ Full navigation bar
└─ Optimized whitespace
```

---

## ⌨️ Keyboard Navigation

- `Tab` - Navigate between elements
- `Enter` - Submit forms, click buttons
- `Escape` - Close modals
- `Ctrl+F` - Search events (browser)

---

## 🔔 User Feedback States

### Success
```
✅ Profile updated successfully!
✅ Event created!
✅ Ticket purchased!
```

### Error
```
❌ Failed to save profile
❌ Event with this title exists
❌ Insufficient tickets available
```

### Loading
```
⏳ Loading profile...
⏳ Saving changes...
⏳ Processing payment...
```

### Empty States
```
📭 No tickets yet
📭 No events match your search
📭 No transactions in ledger
```

---

## 🖱️ Interactive Elements

### Buttons

```
Primary (Emerald)     [✓ Save Profile]
Secondary (Gray)      [Cancel]
Danger (Red)          [Delete Event]
Success (Green)       [✓ Confirm & Pay]
```

### Forms
```
Text Input    [_________________________]
Select        [Category ▼]
Date Picker   [📅 Pick Date]
Textarea      [________________________]
              [________________________]
Radio         ⦿ Aadhaar  ○ PAN  ○ Passport
Checkbox      ☑ I agree to terms
```

### Cards
```
┌─────────────────────┐
│  Event Card         │
│  [IMAGE]            │
│  Title              │
│  📍 Location        │
│  📅 Date            │
│  ₹ Price            │
│  [Book Now Button]  │
└─────────────────────┘
```

---

## 📱 Mobile Considerations

- Touch targets minimum 44px × 44px
- Forms stack vertically
- Search bar above events
- Hamburger menu for navigation
- Portrait orientation optimized

---

This reference guide helps understand the UI/UX flow of the updated EventPass application.
