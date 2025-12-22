# Face Recognition Backend Setup

## Overview
Lightweight Flask backend for face recognition using DeepFace library. Compares captured faces with stored dataset images.

## Installation

### 1. Create Python Virtual Environment
```bash
cd backend
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

This installs:
- **Flask**: Web framework
- **DeepFace**: Face recognition library
- **OpenCV**: Image processing
- **Pillow**: Image handling

### 4. Run the Server
```bash
python app.py
```

Server runs on `http://localhost:5000`

## API Endpoints

### 1. Verify Face
**POST** `/api/verify-face`

Compares captured face with stored face in dataset

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "user_id": "ticket_holder_id"
}
```

**Response (Match):**
```json
{
  "success": true,
  "verified": true,
  "distance": 0.35,
  "result": "valid"
}
```

**Response (No Match):**
```json
{
  "success": true,
  "verified": false,
  "distance": 0.72,
  "result": "mismatch"
}
```

### 2. Register Face
**POST** `/api/register-face`

Store user's face image for future verification

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "user_id": "ticket_holder_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Face registered successfully"
}
```

Saves image to: `backend/dataset/{user_id}/face.jpg`

### 3. Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "ok",
  "service": "Face Recognition API"
}
```

## Dataset Structure

```
backend/
├── dataset/
│   ├── user_123/
│   │   └── face.jpg
│   ├── user_456/
│   │   └── face.jpg
│   └── ...
├── app.py
└── requirements.txt
```

- Each user gets a folder named by their `user_id`
- Store their face image as `face.jpg`
- DeepFace automatically handles multi-face detection

## Workflow

### User Registration Flow
1. User completes UserDashboard profile
2. Frontend captures face image
3. Send to `/api/register-face` with `user_id`
4. Face stored in `backend/dataset/{user_id}/face.jpg`

### Venue Scanning Flow
1. VenueScanner component captures frame from video
2. Send to `/api/verify-face` with captured image + ticket owner's `user_id`
3. Backend compares with stored face
4. Returns `valid` (match) or `mismatch` (no match)
5. Frontend displays result

## Configuration

### Face Recognition Model
Currently using **Facenet512** model:
- Accurate and lightweight
- Good for 1:1 matching
- Fast processing

To change model, edit in `app.py`:
```python
result = DeepFace.verify(
    ...
    model_name='VGGFace2',  # or 'ArcFace', 'SFace', etc.
    ...
)
```

### Distance Threshold
Match determined by Euclidean distance:
- `distance < 0.6` = MATCH (verified)
- `distance >= 0.6` = NO MATCH (mismatch)

Adjust in code if needed (currently auto-detected by DeepFace)

## Notes
- First run downloads face recognition models (~100MB)
- CORS enabled for frontend communication
- Lightweight - uses CPU only (no GPU required)
- Single face per user stored in dataset
- Image quality important for accuracy
