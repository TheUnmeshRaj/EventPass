from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import base64
import tempfile
import os

app = Flask(__name__)
CORS(app)

MODEL_NAME = "VGG-Face"
DISTANCE_THRESHOLD = 0.4  # VGG-Face default-ish

print("Loading model once...")
DeepFace.build_model(MODEL_NAME)
print("Model loaded")

@app.route("/api/verify-face", methods=["POST"])
def verify_face():
    temp_path = None
    try:
        data = request.get_json()
        image_base64 = data.get("image")

        if not image_base64:
            return jsonify(success=False, result="invalid"), 400

        db_image_url = (
            "https://oirysflqkblhxoehavox.supabase.co/storage/v1/object/public/"
            "avatars/2591c897-ef15-4552-8bc9-87870aec8752.png"
        )

        image_bytes = base64.b64decode(image_base64.split(",")[1])

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp:
            temp.write(image_bytes)
            temp_path = temp.name

        result = DeepFace.verify(
            img1_path=db_image_url,
            img2_path=temp_path,
            model_name=MODEL_NAME,
            enforce_detection=True,          # safer
            detector_backend="retinaface"
        )

        distance = float(result["distance"])
        print("Computed distance:", distance)

        if distance <= DISTANCE_THRESHOLD:
            return jsonify(success=True, result="valid", distance=distance)

        return jsonify(success=True, result="mismatch", distance=distance)

    except Exception as e:
        print("Error:", e)
        return jsonify(success=False, result="invalid"), 500

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    app.run(debug=True)
