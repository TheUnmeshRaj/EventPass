# EventPass Face Recognition Integration Guide

## Overview
This guide walks you through integrating DeepFace facial recognition with your Next.js EventPass application for secure venue check-in verification.

## Project Structure
```
EventPass/
├── clientside/                    # Next.js Frontend
│   ├── app/
│   │   ├── components/
│   │   │   ├── FaceScanner.jsx   # Webcam capture component
│   │   │   ├── VerificationResults.jsx  # Result display
│   │   │   ├── Marketplace.jsx   # Event listing
│   │   │   ├── Wallet.jsx        # Ticket management
│   │   │   └── Dashboard.jsx     # Ledger view
│   │   ├── venue/
│   │   │   └── page.jsx          # Venue check-in page
│   │   └── page.jsx              # Main app (refactored)
│   ├── lib/
│   │   ├── deepface-api.js       # DeepFace API client
│   │   └── face-verification-service.js  # Supabase integration
│   └── .env.example
│
└── facerecog/                     # Python Backend
    ├── main.py                    # FastAPI server
    ├── requirements.txt           # Python dependencies
    ├── database_schema.sql        # Supabase migrations
    ├── .env.example
    └── README.md
```

## Setup Instructions

### 1. Backend Setup (Python/DeepFace)

#### Prerequisites
- Python 3.8+
- pip package manager

#### Installation

```bash
cd facerecog

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# Set API_PORT, CORS_ORIGINS, FACE_MODEL, etc.
```

#### Running the Server

```bash
# Start the FastAPI server
python main.py

# Server will be available at http://localhost:8000
# API docs: http://localhost:8000/docs (Swagger UI)
# ReDoc: http://localhost:8000/redoc
```

### 2. Frontend Setup (Next.js)

#### Installation

```bash
cd clientside

# Install Node dependencies
npm install

# If axios is not installed:
npm install axios
```

#### Environment Configuration

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your settings:
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DEEPFACE_API_URL=http://localhost:8000
```

#### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start
```

Your app will be available at `http://localhost:3000`

### 3. Supabase Configuration

#### Create Database Tables

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `facerecog/database_schema.sql`
4. Execute the query

#### Create Storage Bucket

1. In Supabase dashboard, go to Storage
2. Create a new bucket named `face-images`
3. Set access policy to public
4. Configure CORS if needed

```sql
-- Bucket Policy (RLS)
-- Allow authenticated users to upload their own face images
CREATE POLICY "Users can upload their own face images"
ON storage.objects
FOR INSERT
WITH CHECK (auth.uid()::text = (storage.fobucket_id || '/' || auth.uid())::text);

-- Allow authenticated users to read their own face images
CREATE POLICY "Users can read their own face images"
ON storage.objects
FOR SELECT
USING (auth.uid()::text = (storage.fobucket_id || '/' || auth.uid())::text);
```

## API Endpoints

### DeepFace API

#### Verify Face
```
POST /api/verify-face
Content-Type: multipart/form-data

Body: file (image blob)

Response:
{
  "verified": true,
  "matched_user": "user_id",
  "confidence": 0.95,
  "distance": 0.35,
  "message": "Match found for user_id"
}
```

#### Register Face
```
POST /api/register-face
Content-Type: multipart/form-data

Body: file (image blob - filename should be user_id)

Response:
{
  "success": true,
  "message": "Face registered for user user_id",
  "user_id": "user_id"
}
```

#### Compare Faces
```
POST /api/compare-faces
Content-Type: multipart/form-data

Body: face1 (image blob), face2 (image blob)

Response:
{
  "verified": true,
  "distance": 0.35,
  "threshold": 0.6,
  "message": "Faces match"
}
```

#### Health Check
```
GET /api/health

Response:
{
  "status": "healthy",
  "service": "deepface-api"
}
```

## Component Usage

### FaceScanner Component

```jsx
import FaceScanner from '@/app/components/FaceScanner';

<FaceScanner
  onCapture={(blob) => handleCapture(blob)}
  isLoading={false}
  title="Scan Your Face"
/>
```

### Verification Results Components

```jsx
import {
  VerificationSuccess,
  VerificationFailure,
  VerificationPending,
  VerificationWarning
} from '@/app/components/VerificationResults';

// Success state
<VerificationSuccess
  userName="John Doe"
  confidence={0.95}
  onRetry={() => handleRetry()}
/>

// Failure state
<VerificationFailure
  onRetry={() => handleRetry()}
  reason="Face not recognized"
/>

// Loading state
<VerificationPending step={1} />

// Warning state
<VerificationWarning
  message="Unable to detect face"
  onRetry={() => handleRetry()}
/>
```

## Usage Flow

### 1. User Registration (Face Enrollment)

```javascript
import { faceVerificationService } from '@/lib/face-verification-service';

// Capture face image
const imageBlob = /* from FaceScanner */;

// Register face
const result = await faceVerificationService.registerUserFace(
  userId,
  imageBlob,
  isPrimary = true
);
```

### 2. Venue Check-In (Face Verification)

Navigate to `/venue` page:
- User scans their face with webcam
- Image is sent to DeepFace API
- System compares against database
- Displays verification result

```javascript
import { deepfaceAPI } from '@/lib/deepface-api';

// Verify scanned face
const result = await deepfaceAPI.verifyFace(imageBlob);

if (result.verified) {
  // User verified - show success
} else {
  // User not found - show failure
}
```

## Database Schema

### face_images Table
- `id` (UUID): Primary key
- `user_id` (UUID): FK to auth.users
- `image_url` (TEXT): Public URL in Supabase Storage
- `image_path` (TEXT): Storage path
- `created_at` (TIMESTAMP): Upload time
- `is_primary` (BOOLEAN): Primary registration image
- `metadata` (JSONB): Additional data

### face_verification_logs Table
- `id` (UUID): Primary key
- `user_id` (UUID): FK to auth.users
- `event_id` (INTEGER): Associated event
- `verification_status` (TEXT): 'verified', 'failed', 'attempted'
- `confidence_score` (FLOAT): Match confidence
- `matched_user_id` (UUID): FK to matched user
- `verified_at` (TIMESTAMP): Verification time
- `ip_address` (TEXT): Request source
- `device_info` (JSONB): Device details

## Security Considerations

### 1. Face Data Privacy
- ✅ Never store actual face images in the app
- ✅ Only store embeddings/hashes in backend
- ✅ Use HTTPS for all API communication
- ✅ Implement rate limiting on API endpoints

### 2. Authentication
- ✅ Use Supabase authentication for user identity
- ✅ Verify user session before face comparison
- ✅ Log all verification attempts

### 3. API Security
- ✅ Implement CORS properly
- ✅ Add API key authentication to DeepFace endpoints (optional)
- ✅ Use environment variables for sensitive data
- ✅ Validate image uploads (size, format)

### 4. Database Security
- ✅ Enable Row-Level Security (RLS) in Supabase
- ✅ Restrict face image access to authenticated users
- ✅ Audit verification logs

## Troubleshooting

### DeepFace API Not Responding
```bash
# Check if server is running
curl http://localhost:8000/api/health

# Restart the server
# Kill the process and run: python main.py
```

### Face Detection Fails
- Ensure adequate lighting
- Face should be clearly visible
- Image quality is good (no blur)
- Face occupies ~20-70% of image

### CORS Errors
- Verify `CORS_ORIGINS` in backend `.env`
- Ensure frontend URL is in the allowed origins list
- Restart backend after changing settings

### Supabase Storage Issues
- Verify bucket exists and is public
- Check RLS policies are correctly configured
- Ensure JWT token is valid

### Model Download Issues
- First run will download Facenet512 model (~170MB)
- Ensure stable internet connection
- Check disk space availability
- Models are cached after first download

## Performance Optimization

### 1. Model Caching
DeepFace models are automatically cached after first use

### 2. Image Compression
- Compress images before sending to API
- Use JPEG format (better compression than PNG)
- Target file size: 100-300 KB

### 3. Batch Processing
For multiple face verifications:
```python
# Backend: Implement batch endpoint
@app.post("/api/verify-batch")
async def verify_batch(files: List[UploadFile]):
    # Process multiple faces efficiently
    pass
```

### 4. Caching Verification Results
Store recent verification results to avoid redundant checks

## Testing

### Manual Testing

1. **Register a face:**
   ```bash
   curl -X POST "http://localhost:8000/api/register-face" \
     -F "file=@test_image.jpg"
   ```

2. **Verify a face:**
   ```bash
   curl -X POST "http://localhost:8000/api/verify-face" \
     -F "file=@test_image.jpg"
   ```

3. **Compare faces:**
   ```bash
   curl -X POST "http://localhost:8000/api/compare-faces" \
     -F "face1=@image1.jpg" \
     -F "face2=@image2.jpg"
   ```

### Unit Testing (Frontend)
```javascript
import { deepfaceAPI } from '@/lib/deepface-api';

// Mock test
test('verifyFace returns verified result', async () => {
  const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
  const result = await deepfaceAPI.verifyFace(mockBlob);
  expect(result.verified).toBeDefined();
});
```

## Deployment

### Deploy Frontend (Vercel)
```bash
npm run build
# Deploy to Vercel (GitHub integration recommended)
```

### Deploy Backend (Options)

**Option 1: Railway**
```bash
# Connect GitHub repo and deploy
# Set environment variables in Railway dashboard
```

**Option 2: AWS EC2**
```bash
# SSH into instance
# Install Python and dependencies
# Run with gunicorn/supervisor
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

**Option 3: Docker**
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Next Steps

1. ✅ Set up backend and frontend locally
2. ✅ Test face registration and verification flows
3. ✅ Configure Supabase tables and storage
4. ✅ Implement user registration page with face enrollment
5. ✅ Integrate with event booking system
6. ✅ Add face verification to venue check-in
7. ✅ Deploy to production
8. ✅ Monitor verification metrics and logs

## Resources

- [DeepFace Documentation](https://github.com/serengp/deepface)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Face Recognition Best Practices](https://arxiv.org/abs/2103.14108)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review API documentation at `/api/docs`
3. Check console/server logs for error details
4. Test endpoints with provided curl commands

---

**Last Updated:** December 22, 2025
