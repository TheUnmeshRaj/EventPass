import face_recognition
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Allow React to talk to this backend

# In a real app, you would fetch this from a database based on the User ID
# This represents the "User's Registered Face" (loaded from storage/S3)
# For demo purposes, we assume we have a 'known_face.jpg'
try:
    # Load a sample picture and learn how to recognize it.
    known_image = face_recognition.load_image_file("user.jpg")
    known_encoding = face_recognition.face_encodings(known_image)[0]
    
    # In-memory "Database" of faces
    user_face_database = {
        "IND-9876": known_encoding
    }
except:
    print("Warning: No registration image found. Verification will fail.")
    user_face_database = {}

@app.route('/verify-face', methods=['POST'])
def verify_face():
    """
    Receives an image upload and a user ID.
    Returns whether the face matches the registered user.
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    user_id = request.form.get('userId')
    if user_id not in user_face_database:
        return jsonify({"error": "User not found"}), 404

    # 1. Load the uploaded image
    file = request.files['image']
    unknown_image = face_recognition.load_image_file(file)

    # 2. Find faces in the uploaded image
    unknown_encodings = face_recognition.face_encodings(unknown_image)

    if len(unknown_encodings) == 0:
        return jsonify({"match": False, "message": "No face detected in image"}), 200

    # 3. Compare with the registered user's face encoding
    # tolerance=0.6 is typical; lower is stricter
    match_results = face_recognition.compare_faces(
        [user_face_database[user_id]], 
        unknown_encodings[0],
        tolerance=0.6
    )

    if match_results[0]:
        return jsonify({
            "match": True, 
            "message": "Identity Verified",
            "confidence": "High"
        })
    else:
        return jsonify({
            "match": False, 
            "message": "Face does not match registered user"
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)