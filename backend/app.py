import base64
import os
from io import BytesIO

import numpy as np
from deepface import DeepFace
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image

app = Flask(__name__)
CORS(app)

# ---- Paths ----
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATASET_FOLDER = os.path.join(BASE_DIR, "dataset")
os.makedirs(DATASET_FOLDER, exist_ok=True)


# ---- Helpers ----
def decode_base64_image(image_base64):
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    image_data = base64.b64decode(image_base64)
    image = Image.open(BytesIO(image_data)).convert("RGB")
    return np.array(image)


# ---- Routes ----
@app.route("/api/register-face", methods=["POST"])
def register_face():
    try:
        data = request.get_json()
        image_base64 = data.get("image")
        user_id = data.get("user_id")

        if not image_base64 or not user_id:
            return jsonify({"success": False, "error": "Missing image or user_id"}), 400

        image_np = decode_base64_image(image_base64)

        user_folder = os.path.join(DATASET_FOLDER, user_id)
        os.makedirs(user_folder, exist_ok=True)

        image_path = os.path.join(user_folder, f"face_{len(os.listdir(user_folder))}.jpg")
        Image.fromarray(image_np).save(image_path)

        return jsonify({"success": True, "message": "Face registered"}), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/verify-face", methods=["POST"])
def verify_face():
    print("DATASET CONTENTS:", os.listdir(DATASET_FOLDER))
    try:
        data = request.get_json()
        image_base64 = data.get("image")
        user_id = data.get("user_id")

        if not image_base64 or not user_id:
            return jsonify({"success": False, "error": "Missing image or user_id"}), 400

        user_folder = os.path.join(DATASET_FOLDER, user_id)
        print("USER ID:", repr(user_id))
        print("CHECK PATH:", user_folder)
        if not os.path.exists(user_folder):
            return jsonify({
                "success": False,
                "verified": False,
                "result": "invalid",
                "error": "User not found"
            }), 404

        captured_img = decode_base64_image(image_base64)

        result = DeepFace.verify(
            img1_path=user_folder,     # compare against ALL images
            img2_path=captured_img,
            model_name="ArcFace",
            distance_metric="cosine",
            enforce_detection=False
        )

        return jsonify({
            "success": True,
            "verified": result["verified"],
            "distance": float(result["distance"]),
            "result": "valid" if result["verified"] else "mismatch"
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "verified": False,
            "result": "error",
            "error": str(e)
        }), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
