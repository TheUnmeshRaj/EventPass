import json
import os
from io import BytesIO
from typing import List

import cv2
import numpy as np
from deepface import DeepFace
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store face encodings in memory (replace with database for production)
FACE_DATABASE = {}

def get_face_encoding(image_data):
    """Extract face embedding from image"""
    try:
        # Convert bytes to image
        image = Image.open(BytesIO(image_data))
        image_array = np.array(image)
        
        # Get embedding using DeepFace
        embedding = DeepFace.represent(image_array, model_name="Facenet512", enforce_detection=True)
        return embedding[0]["embedding"]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Face detection failed: {str(e)}")

@app.post("/api/register-face")
async def register_face(file: UploadFile = File(...)):
    """Register a user's face"""
    try:
        image_data = await file.read()
        encoding = get_face_encoding(image_data)
        
        user_id = file.filename.split('.')[0]  # Use filename as user ID
        FACE_DATABASE[user_id] = encoding
        
        return {
            "success": True,
            "message": f"Face registered for user {user_id}",
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/verify-face")
async def verify_face(file: UploadFile = File(...)):
    """Verify a scanned face against database"""
    try:
        image_data = await file.read()
        scanned_encoding = get_face_encoding(image_data)
        
        if not FACE_DATABASE:
            return {
                "verified": False,
                "message": "No faces registered in database",
                "matched_user": None
            }
        
        # Compare with all registered faces
        best_match = None
        best_distance = float('inf')
        threshold = 0.6  # DeepFace threshold for same person
        
        for user_id, stored_encoding in FACE_DATABASE.items():
            # Calculate Euclidean distance
            distance = np.linalg.norm(np.array(scanned_encoding) - np.array(stored_encoding))
            
            if distance < best_distance:
                best_distance = distance
                best_match = user_id
        
        is_verified = best_distance < threshold
        
        return {
            "verified": is_verified,
            "matched_user": best_match if is_verified else None,
            "confidence": float(1 - (best_distance / 2)),  # Convert to confidence score
            "distance": float(best_distance),
            "message": f"Match found for {best_match}" if is_verified else "No matching face found"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/compare-faces")
async def compare_faces(face1: UploadFile = File(...), face2: UploadFile = File(...)):
    """Compare two face images"""
    try:
        image1_data = await face1.read()
        image2_data = await face2.read()
        
        img1 = Image.open(BytesIO(image1_data))
        img2 = Image.open(BytesIO(image2_data))
        
        img1_array = np.array(img1)
        img2_array = np.array(img2)
        
        # Use DeepFace to compare
        result = DeepFace.verify(img1_array, img2_array, model_name="Facenet512")
        
        return {
            "verified": result["verified"],
            "distance": float(result["distance"]),
            "threshold": float(result["threshold"]),
            "message": "Faces match" if result["verified"] else "Faces do not match"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "deepface-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
