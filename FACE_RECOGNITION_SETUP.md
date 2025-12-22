# Quick Start: Face Recognition Integration

## Backend Setup (5 minutes)

### 1. Open Terminal in Backend Folder
```bash
cd EventPass/backend
```

### 2. Create & Activate Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Start Flask Server
```bash
python app.py
```

Expected output:
```
 * Running on http://127.0.0.1:5000
```

**Keep this terminal open!**

## Frontend Configuration

### 1. Update Environment (if needed)
In `clientside/`, backend runs on `http://localhost:5000` by default.

The VenueScanner component automatically sends images to this address.

### 2. Run Frontend
In a new terminal:
```bash
cd EventPass/clientside
npm run dev
```

## Testing the Flow

### Option A: Using Demo Mode (No Backend Needed)
If camera is unavailable:
- Click "Scan Valid Ticket (Demo)" or "Simulate Mismatch"
- Tests UI without backend

### Option B: With Backend (Full Integration)

#### Step 1: Register a Test Face
```bash
cd backend
# Copy a selfie to backend folder as test_face.jpg
python manage_dataset.py add_test_face "demo-user" "test_face.jpg"
```

Response:
```
✅ Face registered for user demo-user
   Saved to: backend/dataset/demo-user/face.jpg
```

#### Step 2: Test Scanner
1. Go to Marketplace → Buy any ticket
2. Go to Venue Scanner
3. Click "Capture Face"
4. Point camera at your face
5. Result should show:
   - ✅ **FACE VERIFIED** if matches stored image
   - ❌ **ID MISMATCH** if doesn't match

## Dataset Management

### List All Users
```bash
python manage_dataset.py list_users
```

Output:
```
📁 Users in dataset (2):
   - demo-user: 1 image(s)
   - john_doe: 1 image(s)
```

### Delete User Data
```bash
python manage_dataset.py delete_user demo-user
```

### Manual File Placement
Alternatively, create folders:
```
backend/
└── dataset/
    └── user_id_123/
        └── face.jpg
```

## API Testing with cURL

### Check Server Health
```bash
curl http://localhost:5000/health
```

### Register Face (Base64 image)
```bash
curl -X POST http://localhost:5000/api/register-face \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJ...",
    "user_id": "test_user"
  }'
```

### Verify Face
```bash
curl -X POST http://localhost:5000/api/verify-face \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJ...",
    "user_id": "test_user"
  }'
```

## Troubleshooting

### "Unable to access camera"
- Camera permission denied → Allow in browser
- Camera already in use → Close other apps
- Not available on system → Use demo mode

### "No stored face found"
- User not registered yet
- Run: `python manage_dataset.py add_test_face <user_id> <image_path>`

### "Connection refused" (localhost:5000)
- Flask server not running
- Start server: `python app.py`

### "Distance is too high" / Always mismatch
- Poor lighting when scanning
- Different camera angle
- Face partially covered
- Re-register with better photo

## Next Steps

### Integrate with UserDashboard
When user completes profile, auto-register face:
```javascript
// In UserDashboard.jsx
const registerUserFace = async (imageBase64) => {
  const response = await fetch('http://localhost:5000/api/register-face', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageBase64,
      user_id: authUser.id,
    }),
  });
  return await response.json();
};
```

### Deploy to Production
- Use environment variables for backend URL
- Add HTTPS (required for camera access in production)
- Deploy Flask to cloud (Heroku, AWS, etc.)
- Consider face recognition API limits

## Architecture

```
┌─────────────────────┐
│  VenueScanner.jsx   │
│  (capture video)    │
└──────────┬──────────┘
           │ HTTP POST (base64 image)
           ▼
┌─────────────────────┐
│  Flask Backend      │
│  /api/verify-face   │
└──────────┬──────────┘
           │ DeepFace comparison
           ▼
┌─────────────────────┐
│  dataset/{user_id}/ │
│  face.jpg           │
└─────────────────────┘
```

Ready to go! 🚀
