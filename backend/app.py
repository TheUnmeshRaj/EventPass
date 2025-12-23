from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace  # type: ignore
import numpy as np
import base64
import cv2
import os
from numpy.linalg import norm
import tempfile

app = Flask(__name__)
CORS(app)

# ---------------- CONFIG ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_NAME = "VGG-Face"
SIMILARITY_THRESHOLD = 0.35  # tune this
# ----------------------------------------

def cosine_similarity(a, b):
    return np.dot(a, b) / (norm(a) * norm(b))


print("Loading model once...")
DeepFace.build_model(MODEL_NAME)
print("Model loaded")

print("Caching dataset embeddings...")
dataset_embeddings = []

for filename in os.listdir(DATASET_DIR):
    img_path = os.path.join(DATASET_DIR, filename)

    emb = DeepFace.represent(
        img_path=img_path,
        model_name=MODEL_NAME,
        enforce_detection=False
    )[0]["embedding"]

    dataset_embeddings.append({
        "name": filename,
        "embedding": np.array(emb)
    })

print(f"Cached {len(dataset_embeddings)} embeddings")


@app.route("/api/verify-face", methods=["POST"])
def verify_face():
    try:
        data = request.json
        image_base64 = data.get("image")
        user_id = data.get("user_id")  # currently unused but ready

        if not image_base64:
            return jsonify(success=False, result="invalid"), 400

        # Strip base64 header
        image_base64 = image_base64.split(",")[1]
        image_bytes = base64.b64decode(image_base64)

        # Save temp image
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp:
            temp.write(image_bytes)
            temp_path = temp.name

        # Get embedding of captured face
        captured_embedding = DeepFace.represent(
            img_path=temp_path,
            model_name=MODEL_NAME,
            enforce_detection=False
        )[0]["embedding"]

        captured_embedding = np.array(captured_embedding)

        best_score = -1
        best_match = None

        for item in dataset_embeddings:
            score = cosine_similarity(captured_embedding, item["embedding"])
            if score > best_score:
                best_score = score
                best_match = item["name"]

        os.remove(temp_path)

        if best_score >= SIMILARITY_THRESHOLD:
            return jsonify(
                success=True,
                result="valid",
                match=best_match,
                similarity=float(best_score)
            )

        return jsonify(
            success=True,
            result="mismatch",
            similarity=float(best_score)
        )

    except Exception as e:
        print("Error:", e)
        return jsonify(success=False, result="invalid"), 500


if __name__ == "__main__":
    app.run(debug=True)
