import cv2
import numpy as np
from deepface import DeepFace
from numpy.linalg import norm
from supabase import create_client
import os

SUPABASE_URL = "https://oirysflqkblhxoehavox.supabase.co"
SUPABASE_KEY = "sb_publishable_axPiudtnFLQIqHg_jD1jdg_58m38YwT"

MODEL_NAME = "Facenet"
THRESHOLD = 10

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================
# CAMERA CAPTURE
# =========================
def capture_image(save_path):
    cam = cv2.VideoCapture(0)
    print("📸 Press SPACE to capture | ESC to exit")

    while True:
        ret, frame = cam.read()
        if not ret:
            break

        cv2.imshow("Camera", frame)
        key = cv2.waitKey(1)

        if key == 32:  # SPACE
            cv2.imwrite(save_path, frame)
            break
        elif key == 27:
            cam.release()
            cv2.destroyAllWindows()
            exit()

    cam.release()
    cv2.destroyAllWindows()

# =========================
# EMBEDDING
# =========================
def get_embedding(img_path):
    result = DeepFace.represent(
        img_path=img_path,
        model_name=MODEL_NAME,
        enforce_detection=True
    )
    return result[0]["embedding"]

# =========================
# ENROLL USER
# =========================
def enroll_user(user_id):
    img_path = f"{user_id}_register.jpg"
    capture_image(img_path)

    print("🧬 Extracting embedding...")
    embedding = get_embedding(img_path)

    supabase.table("user_profiles").upsert({
        "id": user_id,
        "face_embedding": embedding
    }).execute()

    print("✅ User enrolled & embedding stored in Supabase")

# =========================
# VERIFY USER
# =========================
def verify_user(user_id):
    response = supabase.table("user_profiles") \
        .select("face_embedding") \
        .eq("id", user_id) \
        .execute()

    if not response.data:
        print("❌ User not found")
        return

    stored_embedding = np.array(response.data[0]["face_embedding"])

    img_path = f"{user_id}_live.jpg"
    capture_image(img_path)

    print("🧬 Extracting live embedding...")
    live_embedding = np.array(get_embedding(img_path))

    distance = norm(stored_embedding - live_embedding)
    print(f"📏 Distance: {distance:.2f}")

    if distance < THRESHOLD:
        print("✅ SAME PERSON")
    else:
        print("❌ DIFFERENT PERSON")

# =========================
# MAIN
# =========================
def main():
    print("\n--- Face Auth (Supabase) ---")
    print("1. Enroll User")
    print("2. Verify User")

    choice = input("Choose (1/2): ")
    user_id = input("User ID: ")

    if choice == "1":
        enroll_user(user_id)
    elif choice == "2":
        verify_user(user_id)
    else:
        print("❌ Invalid option")

if __name__ == "__main__":
    main()
