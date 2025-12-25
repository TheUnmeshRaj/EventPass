# DeepFace API for EventPass
Face recognition backend service using DeepFace and FastAPI

## Setup

```bash
pip install -r requirements.txt
```

## Running the server

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## Endpoints

- `POST /api/register-face` - Register a user's face
- `POST /api/verify-face` - Verify a scanned face against database
- `POST /api/compare-faces` - Compare two face images
- `GET /api/health` - Health check
