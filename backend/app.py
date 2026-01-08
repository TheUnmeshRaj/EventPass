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
    denom = norm(a) * norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def extract_embedding(represent_output):
    if represent_output is None:
        return None

    if isinstance(represent_output, dict):
        emb = represent_output.get("embedding")
        if emb is None:
            return None
        arr = np.asarray(emb, dtype=np.float32)
        return arr if arr.ndim == 1 and arr.size > 0 else None

    if isinstance(represent_output, (list, tuple)):
        if len(represent_output) == 0:
            return None

        first = represent_output[0]
        if isinstance(first, (float, int, np.floating, np.integer)):
            arr = np.asarray(represent_output, dtype=np.float32)
            return arr if arr.ndim == 1 and arr.size > 0 else None

        if isinstance(first, dict):
            emb = first.get("embedding")
            if emb is None:
                return None
            arr = np.asarray(emb, dtype=np.float32)
            return arr if arr.ndim == 1 and arr.size > 0 else None

        if isinstance(first, (list, tuple, np.ndarray)):
            arr = np.asarray(first, dtype=np.float32)
            return arr if arr.ndim == 1 and arr.size > 0 else None

    try:
        arr = np.asarray(represent_output, dtype=np.float32)
        return arr if arr.ndim == 1 and arr.size > 0 else None
    except Exception:
        return None


print("Loading model once...")
DeepFace.build_model(MODEL_NAME)
print("Model loaded")

print("Caching dataset embeddings...")
dataset_embeddings = []

for filename in os.listdir(DATASET_DIR):
    img_path = os.path.join(DATASET_DIR, filename)
    if not os.path.isfile(img_path):
        continue

    embeddings = DeepFace.represent(
        img_path=img_path,
        model_name=MODEL_NAME,
        enforce_detection=False
    )
    emb = extract_embedding(embeddings)
    if emb is None:
        continue

    dataset_embeddings.append({
        "name": filename,
        "embedding": emb
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
        embeddings = DeepFace.represent(
            img_path=temp_path,
            model_name=MODEL_NAME,
            enforce_detection=False
        )

        captured_embedding = extract_embedding(embeddings)
        os.remove(temp_path)

        if captured_embedding is None:
            return jsonify(success=True, result="invalid"), 200

        best_score = -1
        best_match = None

        for item in dataset_embeddings:
            score = cosine_similarity(captured_embedding, item["embedding"])
            if score > best_score:
                best_score = score
                best_match = item["name"]

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
