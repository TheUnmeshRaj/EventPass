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

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

FACE_MODEL = "Facenet512"
MATCH_THRESHOLD = 0.7 

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
    """
    Body:
    {
        userId: string,
        image: base64
    }
    """

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
    """
    Body:
    {
        user_id: string,
        image: base64
    }
    """

    data = request.get_json(force=True)
    user_id = data.get("user_id")
    image_base64 = data.get("image")

    if not user_id or not image_base64:
        return jsonify({"error": "user_id and image required"}), 400

    try:
        # 1️⃣ Fetch stored embedding
        res = supabase.table("user_profiles") \
            .select("face_embedding") \
            .eq("id", user_id) \
            .execute()
        if not res.data:
            print("❌ User not found")
            return

        stored_embedding = res.data[0].get("face_embedding")
        print("Stored embedding:", stored_embedding)

        if not stored_embedding:
            return jsonify({"error": "Face not enrolled"}), 404

        stored_embedding = np.array(stored_embedding, dtype=np.float32)
        print("🧬 Extracting live embedding...")
        live_embedding = np.array(get_embedding(image_base64))

        distance = np.linalg.norm(stored_embedding - live_embedding)
        print(f"📏 Distance: {distance:.2f}")

        is_match = distance < MATCH_THRESHOLD

        return jsonify({
            "success": True,
            "match": bool(is_match),
            "distance": float(distance),
            "message": "Welcome" if is_match else "Face mismatch"
        })

    except Exception as e:
        print("Error during verification:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)