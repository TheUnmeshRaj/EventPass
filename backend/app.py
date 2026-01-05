import base64
import os

import cv2  # type:ignore
import numpy as np  # type:ignore
from deepface import DeepFace  # type:ignore
from dotenv import load_dotenv  # type:ignore
from flask import Flask, jsonify, request  # type:ignore
from flask_cors import CORS  # type:ignore
from supabase import create_client  # type:ignore

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_SERVICE_KEY")

print(f"DEBUG: SUPABASE_URL is {'set' if SUPABASE_URL else 'NOT set'}")
print(f"DEBUG: SUPABASE_SERVICE_KEY is {'set' if SUPABASE_SERVICE_KEY else 'NOT set'}")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_KEY missing!")
elif SUPABASE_SERVICE_KEY.startswith("sb_publish"):
    print("CRITICAL WARNING: SUPABASE_SERVICE_KEY appears to be a PUBLIC (anon) key! Backend requires the service_role key.")
else:
    print(f"DEBUG: SUPABASE_SERVICE_KEY first 10 chars: {SUPABASE_SERVICE_KEY[:10]}...")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = Flask(__name__)
CORS(app)

def base64_to_image(base64_str: str):
    """Convert base64 image to OpenCV BGR image"""
    try:
        img_bytes = base64.b64decode(base64_str.split(",")[1])
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        raise ValueError("Invalid base64 image")

def get_embedding(img_path):
    result = DeepFace.represent(
        img_path=img_path,
        model_name=FACE_MODEL,
        enforce_detection=True
    )
    return result[0]["embedding"]


def extract_single_embedding(img):
    """Extract exactly ONE face embedding"""
    result = DeepFace.represent(
        img_path=img,
        model_name=FACE_MODEL,
        enforce_detection=True
    )

    if not result or len(result) != 1:
        raise ValueError("Exactly one face must be visible")

    return np.array(result[0]["embedding"], dtype=np.float32)

@app.route("/enroll", methods=["POST"])
def enroll_face():
    data = request.get_json(force=True)
    user_id = data.get("userId")
    image_base64 = data.get("image")

    if not user_id or not image_base64:
        return jsonify({"error": "userId and image required"}), 400

    try:
        img = base64_to_image(image_base64)
        embedding = extract_single_embedding(img)

        supabase.table("user_profiles").update({
            "face_embedding": embedding.tolist()
        }).eq("id", user_id).execute()

        return jsonify({
            "success": True,
            "message": "Face enrolled successfully"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/verify-face-by-qr", methods=["POST"])
def verify_face_by_qr():
    data = request.get_json(force=True)
    user_id = data.get("user_id")
    image_base64 = data.get("image")
    
    try:
        if not user_id or not image_base64:
            return jsonify({"error": "user_id and image required"}), 400

        res = supabase.table("user_profiles") \
            .select("face_embedding") \
            .eq("id", user_id) \
            .execute()

        if not res.data:
            return jsonify({"error": "User not found"}), 404

        stored_embedding = res.data[0].get("face_embedding")
        
        if not stored_embedding:
            return jsonify({"error": "Face not enrolled"}), 404
        
        stored_embedding = np.array(stored_embedding, dtype=np.float32)
        live_embedding = np.array(get_embedding(image_base64))
        distance = np.linalg.norm(stored_embedding - live_embedding)
        is_match = distance < MATCH_THRESHOLD
        return jsonify({
            "success": True,
            "match": bool(is_match),
            "distance": float(distance)
        })
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)