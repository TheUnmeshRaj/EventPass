# EventPass Face Recognition - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER BROWSER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           NEXT.JS FRONTEND (Port 3000)                  │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │ /venue Page (Venue Check-In)                     │  │    │
│  │  │ - FaceScanner Component (Webcam Capture)        │  │    │
│  │  │ - VerificationResults Components               │  │    │
│  │  │ - Integration with DeepFace API                │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  Other Pages:                                          │    │
│  │  - / (Marketplace)                                    │    │
│  │  - /wallet (Tickets)                                 │    │
│  │  - /dashboard (Ledger)                               │    │
│  │  - /auth/login                                       │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              │ HTTP/HTTPS                        │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ API Service Layer (JavaScript/Axios)                │       │
│  │                                                      │       │
│  │ - deepfaceAPI.js (HTTP calls to Python backend)   │       │
│  │ - faceVerificationService.js (Supabase queries)   │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         │                                              │
         │ HTTP/HTTPS                                  │ WebSocket/REST
         ▼                                              ▼
┌──────────────────────────┐            ┌──────────────────────────┐
│  PYTHON BACKEND          │            │   SUPABASE               │
│  (Port 8000)             │            │   (Cloud Database)       │
├──────────────────────────┤            ├──────────────────────────┤
│                          │            │                          │
│ FastAPI + DeepFace       │            │ PostgreSQL + Auth        │
│                          │            │                          │
│ ┌──────────────────────┐ │            │ Tables:                  │
│ │ /api/verify-face    │ │            │ - auth.users            │
│ │ /api/register-face  │ │            │ - face_images           │
│ │ /api/compare-faces  │ │            │ - face_verification_    │
│ │ /api/health         │ │            │   logs                  │
│ └──────────────────────┘ │            │                          │
│                          │            │ Storage Buckets:        │
│ ┌──────────────────────┐ │            │ - face-images           │
│ │ Face Recognition    │ │            │ (Public)                │
│ │ - Facenet512 Model  │ │            │                          │
│ │ - Embeddings        │ │            │ RLS Policies:           │
│ │ - Face Detection    │ │            │ ✓ User isolation        │
│ │ - Distance Calc     │ │            │ ✓ Verified access only  │
│ └──────────────────────┘ │            │                          │
│                          │            │                          │
│ In-Memory Store:         │            │                          │
│ {user_id: embedding[]}   │            │                          │
│                          │            │                          │
└──────────────────────────┘            └──────────────────────────┘
         │                                       │
         │ (In-memory cache)                    │
         │ (Prod: use database)                 │ Persistence
         │                                       │
         └───────────────────────────────────────┘
```

## Data Flow Diagram

### Face Verification Flow (Venue Check-In)

```
USER @ VENUE
    │
    ▼
┌─────────────────────────────────────┐
│ 1. Navigate to /venue               │
│    - Load venue check-in page        │
│    - Initialize webcam              │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 2. FaceScanner Component             │
│    - Real-time webcam stream         │
│    - Face detection overlay (green)  │
│    - User positions face in frame    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 3. User clicks "Capture Face"       │
│    - Canvas captures video frame     │
│    - Converts to JPEG blob           │
│    - File size ~100-300 KB           │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 4. Send to Backend                  │
│    POST /api/verify-face            │
│    - Upload image blob              │
│    - CORS enabled                   │
│    - Timeout: 30 seconds            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 5. DeepFace Processing (Backend)    │
│    - Extract face embeddings        │
│    - Use Facenet512 model           │
│    - Generate 512-dim vector        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 6. Face Comparison                  │
│    - Loop through all registered    │
│      faces in database              │
│    - Calculate Euclidean distance   │
│    - Find best match                │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 7. Decision Making                  │
│    IF distance < 0.6:               │
│      ✓ VERIFIED (match found)       │
│    ELSE:                            │
│      ✗ NOT VERIFIED (no match)      │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 8. Return Result to Frontend        │
│    {                                │
│      verified: true/false,          │
│      matched_user: user_id,         │
│      confidence: 0.95,              │
│      distance: 0.35,                │
│      message: string                │
│    }                                │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 9. Log to Database                  │
│    INSERT face_verification_logs    │
│    - user_id                        │
│    - verification_status            │
│    - confidence_score               │
│    - verified_at timestamp          │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 10. Display Result Component        │
│                                     │
│ If verified:                        │
│ ┌─────────────────────────────────┐ │
│ │ ✓ Verification Successful!      │ │
│ │ Welcome back, [User Name]!      │ │
│ │ Confidence: 95%                 │ │
│ │ [Proceed to Verification Btn]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ If not verified:                    │
│ ┌─────────────────────────────────┐ │
│ │ ✗ Verification Failed           │ │
│ │ Face not recognized             │ │
│ │ [Try Again Btn]                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────┐
│                  VenuePage (/venue)                 │
│                  - Auth check                       │
│                  - State management                 │
│                  - Result coordination              │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    ┌─────────────┐      ┌──────────────────────┐
    │ Venue Info  │      │ Face Scanner Section │
    │ Card        │      │                      │
    │             │      │  ┌────────────────┐ │
    │ - Name      │      │  │ FaceScanner    │ │
    │ - Location  │      │  │ Component      │ │
    │ - Date      │      │  │ - Webcam       │ │
    │ - Capacity  │      │  │ - Capture Btn  │ │
    └─────────────┘      │  └────────────────┘ │
                         │                      │
                         │  ┌────────────────┐ │
                         │  │ Verification   │ │
                         │  │ Results        │ │
                         │  │                │ │
                         │  │ - Success      │ │
                         │  │ - Failure      │ │
                         │  │ - Pending      │ │
                         │  │ - Warning      │ │
                         │  └────────────────┘ │
                         │                      │
                         │  ┌────────────────┐ │
                         │  │ Instructions   │ │
                         │  │ Card           │ │
                         │  └────────────────┘ │
                         └──────────────────────┘
```

## Service Layer Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Frontend Service Layer                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ deepfaceAPI.js (HTTP Client - Axios)            │   │
│  │                                                  │   │
│  │ Methods:                                        │   │
│  │ - verifyFace(blob) ──┐                         │   │
│  │ - registerFace(blob, userId) ──┐               │   │
│  │ - compareFaces(blob1, blob2) ──┐               │   │
│  │ - healthCheck() ──┐                            │   │
│  │                   │                            │   │
│  └─────────┬─────────┼────────────────────────────┘   │
│            │         │                                 │
│            ▼         ▼ (HTTP POST to Port 8000)      │
│  ┌──────────────────────────────────────────────────┐   │
│  │ faceVerificationService.js (Supabase Client)    │   │
│  │                                                  │   │
│  │ Methods:                                        │   │
│  │ - uploadFaceImage(blob, userId)                │   │
│  │ - logVerification(userId, data)                │   │
│  │ - getUserFaceImages(userId)                    │   │
│  │ - registerUserFace(userId, blob)               │   │
│  │ - getVerificationHistory(userId)               │   │
│  │                                                  │   │
│  └─────────┬──────────────────────────────────────┘   │
│            │                                           │
│            ▼ (REST/WebSocket to Supabase)           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Supabase Client (Built-in)                      │   │
│  │ - Authentication                                │   │
│  │ - Database queries                              │   │
│  │ - Storage operations                            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## State Management Flow

```
VenuePage State:
├── user (authenticated session)
├── loading (global loading state)
├── scanningFace (current scanning status)
├── verificationStep ("scanner" | "processing" | "result")
├── verificationResult ({verified, confidence, matched_user})
├── error (error message if any)
├── selectedEvent (chosen event)
└── venueData (static venue info)

Actions:
├── handleFaceCapture(blob)
│   ├── SET verificationStep = "processing"
│   ├── CALL deepfaceAPI.verifyFace(blob)
│   ├── CALL faceVerificationService.logVerification()
│   ├── SET verificationResult = response
│   ├── SET verificationStep = "result"
│   └── CATCH → SET error
│
├── handleRetry()
│   ├── RESET verificationStep = "scanner"
│   ├── RESET verificationResult = null
│   └── CLEAR error
│
└── handleVerificationSuccess()
    ├── Log success
    └── Navigate to next step
```

## Error Handling Flow

```
Error Scenarios:
│
├─ Camera Access Denied
│  ├─ Catch: getUserMedia() fails
│  ├─ Display: "Unable to access camera"
│  └─ Action: Show permission instructions
│
├─ Network Error
│  ├─ Catch: API request fails
│  ├─ Display: Error message from API
│  └─ Action: Retry button
│
├─ Face Not Detected
│  ├─ Catch: Backend returns 400
│  ├─ Display: "Face detection failed"
│  └─ Action: Try with better lighting
│
├─ No Match Found
│  ├─ Result: verified: false
│  ├─ Display: "Face not recognized"
│  └─ Action: Try again or register
│
└─ Database Error
   ├─ Catch: Supabase query fails
   ├─ Display: "Verification log failed"
   └─ Action: Continue but warn user
```

## Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ 1. Authentication Layer                                  │
│    ┌───────────────────────────────────────────────┐    │
│    │ Supabase JWT Authentication                  │    │
│    │ - User logged in via /login                  │    │
│    │ - Session token validated on /venue          │    │
│    │ - User ID passed to API calls                │    │
│    └───────────────────────────────────────────────┘    │
│                                                           │
│ 2. API Security Layer                                    │
│    ┌───────────────────────────────────────────────┐    │
│    │ CORS Configuration                           │    │
│    │ - Only localhost:3000 in development         │    │
│    │ - Production domain whitelist                │    │
│    │ - Credentials: true                          │    │
│    └───────────────────────────────────────────────┘    │
│                                                           │
│ 3. Data Validation Layer                                 │
│    ┌───────────────────────────────────────────────┐    │
│    │ Image Upload Validation                      │    │
│    │ - File size limit: 5MB                       │    │
│    │ - MIME type: image/jpeg, image/png           │    │
│    │ - Dimensions: 100x100 to 8000x8000          │    │
│    └───────────────────────────────────────────────┘    │
│                                                           │
│ 4. Database Security Layer (RLS)                         │
│    ┌───────────────────────────────────────────────┐    │
│    │ Supabase Row Level Security                  │    │
│    │ - face_images: user_id = auth.uid()          │    │
│    │ - verification_logs: user_id = auth.uid()   │    │
│    │ - Storage bucket: /face-images/{uid}/*       │    │
│    └───────────────────────────────────────────────┘    │
│                                                           │
│ 5. Transport Security                                    │
│    ┌───────────────────────────────────────────────┐    │
│    │ HTTPS/TLS Encryption                         │    │
│    │ - All API calls encrypted                    │    │
│    │ - Database connections encrypted            │    │
│    │ - WebSocket secure (WSS)                     │    │
│    └───────────────────────────────────────────────┘    │
│                                                           │
│ 6. Rate Limiting                                         │
│    ┌───────────────────────────────────────────────┐    │
│    │ Request Rate Limiting (Production)            │    │
│    │ - /api/verify-face: 10 req/min per user      │    │
│    │ - /api/register-face: 5 req/min per user     │    │
│    │ - /api/health: unlimited                     │    │
│    └───────────────────────────────────────────────┘    │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
Production Deployment:

┌─────────────────────────────────────────┐
│         Frontend (Vercel/AWS)           │
│         - Next.js App                   │
│         - Static assets                 │
│         - CDN distribution              │
│         - Auto-scaling                  │
└────────────────────┬────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────┐
│      Backend (Railway/AWS EC2/Docker)   │
│      - FastAPI server                   │
│      - DeepFace ML models               │
│      - GPU acceleration (optional)      │
│      - Load balancer                    │
│      - Health monitoring                │
└────────────────────┬────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────┐
│    Supabase (Managed PostgreSQL)        │
│    - Database (face_images,             │
│      verification_logs)                 │
│    - Storage (face-images bucket)       │
│    - Authentication (JWT)               │
│    - Monitoring & Backups               │
└─────────────────────────────────────────┘
```

## Performance Optimization

```
Frontend Performance:
├─ Image Compression (client-side)
│  ├─ JPEG format (better than PNG)
│  ├─ Target: 100-300 KB
│  └─ Canvas quality: 0.95
│
├─ Lazy Loading
│  ├─ Components loaded on demand
│  └─ FaceScanner: only when needed
│
└─ Caching
   ├─ Browser cache for static assets
   └─ Service worker for offline support

Backend Performance:
├─ Model Caching
│  ├─ Facenet512: loaded once per process
│  ├─ GPU acceleration (if available)
│  └─ Batch processing support
│
├─ Embedding Caching
│  ├─ In-memory store for quick lookup
│  ├─ Production: use Redis
│  └─ TTL: configurable
│
└─ Database Optimization
   ├─ Indexes on frequently queried columns
   ├─ Connection pooling
   └─ Query optimization

Network Performance:
├─ HTTPS/HTTP2
├─ Gzip compression
├─ CDN for static assets
└─ API response caching
```

---

**Diagram Version:** 1.0
**Last Updated:** December 22, 2025
