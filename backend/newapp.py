from flask import Flask, request, jsonify # type: ignore
from deepface import Deepface # type: ignore
from flask_cors import CORS # type: ignore
app = Flask(__name__)
CORS(app)

