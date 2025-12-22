# EventPass Face Recognition - Quick Reference

## Project Files Created

### Backend (Python/FastAPI)
- **facerecog/main.py** - DeepFace API server with 4 endpoints
- **facerecog/requirements.txt** - Python dependencies
- **facerecog/database_schema.sql** - Supabase table definitions
- **facerecog/.env.example** - Backend environment variables template
- **facerecog/README.md** - Backend setup guide

### Frontend (Next.js/React)
- **clientside/app/venue/page.jsx** - Main venue check-in page with face scanning
- **clientside/app/components/FaceScanner.jsx** - Webcam capture component
- **clientside/app/components/VerificationResults.jsx** - Status display components
- **clientside/app/components/Marketplace.jsx** - Event listing
- **clientside/app/components/Wallet.jsx** - Ticket management
- **clientside/app/components/Dashboard.jsx** - Ledger view
- **clientside/lib/deepface-api.js** - DeepFace API client (axios)
- **clientside/lib/face-verification-service.js** - Supabase integration
- **clientside/.env.example** - Frontend environment variables template

### Documentation
- **FACE_RECOGNITION_INTEGRATION.md** - Complete setup & integration guide
- **setup.bat** - Automated setup script (Windows)

## Key Features Implemented

### 1. Face Scanning (Frontend)
- Real-time webcam capture with face detection overlay
- Canvas-based image extraction
- Responsive UI with loading states

### 2. Face Verification (Backend)
- DeepFace embeddings using Facenet512 model
- Euclidean distance-based face comparison
- Configurable verification threshold (0.6 default)

### 3. Venue Check-In Flow
- User navigates to `/venue` page
- Captures face with webcam
- System compares against database
- Shows success/failure/warning states
- Logs verification attempt to database

### 4. Database Integration
- Face images stored in Supabase Storage
- Verification logs with confidence scores
- User audit trail

## Quick Start (5 minutes)

### Backend
```bash
cd facerecog
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd clientside
npm install
# Edit .env.local with Supabase credentials
npm run dev
```

## Testing the Integration

1. **Health Check**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Register a Face**
   ```bash
   curl -X POST "http://localhost:8000/api/register-face" -F "file=@image.jpg"
   ```

3. **Verify a Face**
   ```bash
   curl -X POST "http://localhost:8000/api/verify-face" -F "file=@image.jpg"
   ```

4. **UI Test**
   - Go to `http://localhost:3000/venue`
   - Click "Capture Face" button
   - Allow camera access
   - System will verify against database

## Component Tree

```
App Root (page.jsx)
├── Navbar
├── View Router
│   ├── Marketplace (events)
│   ├── Wallet (tickets)
│   ├── Dashboard (ledger)
│   └── VenueScanner
└── VenuePage (/venue)
    ├── Venue Info Card
    └── Face Scanner Section
        ├── FaceScanner (webcam)
        └── VerificationResults
            ├── VerificationSuccess
            ├── VerificationFailure
            ├── VerificationPending
            └── VerificationWarning

Utility Services
├── deepfaceAPI (axios HTTP client)
└── faceVerificationService (Supabase queries)
```

## API Endpoints Reference

### DeepFace Backend (Port 8000)

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| POST | `/api/verify-face` | Compare face with database | `{verified, matched_user, confidence, distance}` |
| POST | `/api/register-face` | Add new face to database | `{success, user_id, message}` |
| POST | `/api/compare-faces` | Compare two specific faces | `{verified, distance, threshold}` |
| GET | `/api/health` | Health check | `{status, service}` |

### Next.js Frontend (Port 3000)

| Route | Purpose |
|-------|---------|
| `/` | Home/Marketplace |
| `/login` | Authentication |
| `/venue` | Face verification check-in |

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXT_PUBLIC_DEEPFACE_API_URL=http://localhost:8000
```

### Backend (.env)
```
API_HOST=0.0.0.0
API_PORT=8000
FACE_MODEL=Facenet512
FACE_DETECTION_THRESHOLD=0.6
CORS_ORIGINS=http://localhost:3000
```

## Database Tables

### face_images
Stores user registration images and metadata

### face_verification_logs
Tracks all verification attempts with results

Both tables have RLS policies for security.

## Workflow Diagram

```
User Flow:
1. Visit /venue page
   ↓
2. Click "Capture Face"
   ↓
3. FaceScanner opens webcam
   ↓
4. User positions face in frame
   ↓
5. Clicks "Capture Face" button
   ↓
6. Image blob sent to deepfaceAPI.verifyFace()
   ↓
7. Backend compares with database embeddings
   ↓
8. Result returned: verified or not found
   ↓
9. Display VerificationSuccess or VerificationFailure
   ↓
10. Log attempt to face_verification_logs table
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Camera permission denied | Check browser permissions, use HTTPS |
| Face not detected | Improve lighting, ensure face is visible |
| CORS error | Verify backend CORS_ORIGINS setting |
| No match found | Face not registered, register first |
| Slow verification | Large model size, first run downloads ~170MB |
| Supabase connection fails | Check URL, API key, and internet connection |

## Performance Tips

- ✅ Images are cached after first request
- ✅ Compress images before sending (~200KB)
- ✅ Use JPEG format for better compression
- ✅ Implement verification result caching
- ✅ Use batch verification for multiple users

## Security Checklist

- ✅ Use HTTPS in production
- ✅ Implement rate limiting on API endpoints
- ✅ Enable Supabase RLS policies
- ✅ Validate image uploads (size, format)
- ✅ Log all verification attempts
- ✅ Use environment variables for secrets
- ✅ Implement CORS properly
- ✅ Authenticate users before verification

## File Sizes Reference

- Facenet512 model: ~170 MB (downloaded once)
- Typical face image: 100-300 KB
- Database embedding: ~1 KB per face

## Next Development Steps

1. **User Registration Page**
   - Add face enrollment UI
   - Store primary and backup face images

2. **Attendance Tracking**
   - Dashboard showing check-in history
   - Event-based attendance reports

3. **Anti-Spoofing**
   - Implement liveness detection
   - Add presentation attack detection

4. **Mobile App**
   - React Native version
   - Better camera controls

5. **Analytics**
   - Verification success rate metrics
   - Performance monitoring
   - Usage analytics

## Useful Commands

```bash
# Start backend with auto-reload
uvicorn main:app --reload

# Run tests
pytest tests/

# Format Python code
black main.py

# Lint JavaScript
npm run lint

# Build Next.js
npm run build

# Check backend health
curl http://localhost:8000/api/health

# View API documentation
# Visit http://localhost:8000/docs
```

## Support Resources

- DeepFace: https://github.com/serengp/deepface
- FastAPI: https://fastapi.tiangolo.com/
- Supabase: https://supabase.io/docs
- Next.js: https://nextjs.org/docs
- Face Recognition Theory: https://arxiv.org/abs/2003.13678

---

**Last Updated:** December 22, 2025
**Version:** 1.0
