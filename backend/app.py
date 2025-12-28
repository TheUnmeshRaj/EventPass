from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import numpy as np
import base64
import cv2
import os
from supabase import create_client

# -----------------------------
# CONFIG
# -----------------------------

SUPABASE_URL = "https://oirysflqkblhxoehavox.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcnlzZmxxa2JsaHhvZWhhdm94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxMDU0NywiZXhwIjoyMDgxNzg2NTQ3fQ.R2LroPmU1HpAzFsjvjNGiQQ7HAR-iIOll1KHqizRGnc"

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise Exception("Supabase credentials not set in environment variables")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = Flask(__name__)
CORS(app)

# -----------------------------
# UTILS
# -----------------------------

def base64_to_image(base64_str: str):
    """
    Converts base64 image string to OpenCV image (numpy array)
    """
    try:
        img_bytes = base64.b64decode(base64_str.split(",")[1])
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        raise ValueError("Invalid base64 image")

# -----------------------------
# ROUTES
# -----------------------------

@app.route("/enroll", methods=["POST"])
def enroll_face():
    """
    Receives:
    {
        userId: string,
        image: base64
    }

    Stores:
    - face_embedding → user_profiles.face_embedding
    """

    data = request.get_json()
    user_id = data.get("userId")
    image_base64 = data.get("image")

    if not user_id or not image_base64:
        return jsonify({
            "error": "userId and image are required"
        }), 400

    try:
        # Convert image (RAM only)
        img = base64_to_image(image_base64)

        # Extract face embedding
        result = DeepFace.represent(
            img_path=img,
            model_name="Facenet512",
            enforce_detection=True
        )

        embedding = result[0]["embedding"]

        # Store embedding in Supabase
        supabase.table("user_profiles").update({
            "face_embedding": embedding
        }).eq("id", user_id).execute()

        return jsonify({
            "success": True,
            "message": "Face enrolled successfully"
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# -----------------------------
# HEALTH CHECK
# -----------------------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok"
    })

# -----------------------------
# START SERVER
# -----------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
