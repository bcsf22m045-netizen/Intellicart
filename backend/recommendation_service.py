"""
🧠 Product Recommendation Microservice
========================================

A lightweight Flask service that loads the pre-trained ML models
and computes product similarity on-the-fly.

Architecture:
    Node.js backend  →  HTTP request  →  This service  →  ML inference  →  JSON response

Usage:
    pip install flask flask-cors sentence-transformers scikit-learn joblib numpy
    python recommendation_service.py

The service loads:
    - tfidf_vectorizer.pkl   (TF-IDF vocabulary from real e-commerce data)
    - sbert_model/           (Sentence-BERT for semantic understanding)
    - model_metadata.json    (weights & config)
"""

import os
import json
import time
import logging
from datetime import datetime

import numpy as np
import joblib

from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# ── Configuration ──────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_MODELS_DIR = os.path.join(BASE_DIR, "ml_models")

FLASK_PORT = int(os.environ.get("RECOMMENDATION_PORT", 5000))
FLASK_HOST = os.environ.get("RECOMMENDATION_HOST", "127.0.0.1")

# ── Logging ────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("recommendation")

# ── Flask App ──────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

# ── Global Model State ─────────────────────────────────────────────────────────

tfidf_vectorizer = None
sbert_model = None
model_metadata = None
is_loaded = False


# ── Load Models ────────────────────────────────────────────────────────────────

def load_models():
    """Load all ML model files into memory."""
    global tfidf_vectorizer, sbert_model, model_metadata, is_loaded

    tfidf_path = os.path.join(ML_MODELS_DIR, "tfidf_vectorizer.pkl")
    sbert_path = os.path.join(ML_MODELS_DIR, "sbert_model")
    metadata_path = os.path.join(ML_MODELS_DIR, "model_metadata.json")

    if not os.path.exists(tfidf_path):
        log.warning(f"⚠️  TF-IDF model not found at: {tfidf_path}")
        log.warning("   Run the Colab notebook and extract recommendation_model.zip into backend/ml_models/")
        return False

    if not os.path.exists(sbert_path):
        log.warning(f"⚠️  SBERT model not found at: {sbert_path}")
        log.warning("   Run the Colab notebook and extract recommendation_model.zip into backend/ml_models/")
        return False

    try:
        start = time.time()
        log.info("🧠 Loading ML recommendation models...")

        # 1. TF-IDF Vectorizer
        tfidf_vectorizer = joblib.load(tfidf_path)
        log.info(f"   ✅ TF-IDF vectorizer ({len(tfidf_vectorizer.vocabulary_):,} terms)")

        # 2. Sentence-BERT
        sbert_model = SentenceTransformer(sbert_path)
        log.info(f"   ✅ Sentence-BERT ({sbert_model.get_sentence_embedding_dimension()}-dim)")

        # 3. Metadata
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                model_metadata = json.load(f)
            log.info(f"   ✅ Metadata: v{model_metadata.get('model_version', '?')}")
        else:
            model_metadata = {
                "model_version": "2.0.0",
                "tfidf_weight": 0.35,
                "sbert_weight": 0.65,
            }

        is_loaded = True
        elapsed = time.time() - start
        log.info(f"🚀 Models loaded in {elapsed:.1f}s — ready for requests!")
        return True

    except Exception as e:
        log.error(f"❌ Failed to load models: {e}")
        is_loaded = False
        return False


# ── Helper: Build text for a product ──────────────────────────────────────────

def product_to_text(product):
    """Convert a product dict into a text string for the model."""
    parts = []

    name = product.get("name", "")
    if name:
        parts.extend([name, name])  # 2x weight on name

    category = product.get("categoryName", "") or product.get("category", "")
    sub_category = product.get("subCategoryName", "") or product.get("subCategory", "")
    if category:
        parts.append(f"Category: {category}")
    if sub_category:
        parts.append(f"SubCategory: {sub_category}")

    description = product.get("description", "")
    if description and len(description) > 5:
        parts.append(description[:500])

    sizes = product.get("sizes", [])
    if sizes:
        parts.append(f"Sizes: {' '.join(sizes)}")

    colors = product.get("colors", [])
    if isinstance(colors, list):
        color_names = [c.get("name", "") if isinstance(c, dict) else str(c) for c in colors]
        if color_names:
            parts.append(f"Colors: {' '.join(color_names)}")

    return " ".join(parts) if parts else "product"


# ── Helper: Compute hybrid similarity ─────────────────────────────────────────

def compute_similarity(query_text, catalog_texts):
    """
    Compute hybrid TF-IDF + SBERT similarity.
    Returns array of similarity scores (one per catalog product).
    """
    tfidf_weight = model_metadata.get("tfidf_weight", 0.35)
    sbert_weight = model_metadata.get("sbert_weight", 0.65)

    all_texts = [query_text] + catalog_texts

    # TF-IDF similarity
    tfidf_vectors = tfidf_vectorizer.transform(all_texts)
    tfidf_sims = cosine_similarity(tfidf_vectors[0:1], tfidf_vectors[1:])[0]

    # SBERT similarity
    sbert_vectors = sbert_model.encode(all_texts, normalize_embeddings=True, show_progress_bar=False)
    sbert_sims = cosine_similarity(sbert_vectors[0:1], sbert_vectors[1:])[0]

    # Hybrid score
    scores = tfidf_weight * tfidf_sims + sbert_weight * sbert_sims
    return scores.tolist()


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model_loaded": is_loaded,
        "metadata": model_metadata,
    })


@app.route("/recommend", methods=["POST"])
def recommend():
    """
    Compute recommendations for a product.

    Request body:
    {
        "queryProduct": { "name": "...", "description": "...", "categoryName": "...", ... },
        "catalogProducts": [
            { "_id": "...", "name": "...", "description": "...", ... },
            ...
        ],
        "limit": 8
    }

    Response:
    {
        "success": true,
        "recommendations": [
            { "_id": "...", "score": 0.87 },
            ...
        ]
    }
    """
    if not is_loaded:
        return jsonify({
            "success": False,
            "message": "Models not loaded. Place model files in backend/ml_models/ and restart.",
        }), 503

    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Missing JSON body"}), 400

        query_product = data.get("queryProduct")
        catalog_products = data.get("catalogProducts", [])
        limit = min(int(data.get("limit", 8)), 30)

        if not query_product:
            return jsonify({"success": False, "message": "Missing queryProduct"}), 400

        if not catalog_products:
            return jsonify({"success": True, "recommendations": []}), 200

        # Build text representations
        query_text = product_to_text(query_product)
        catalog_texts = [product_to_text(p) for p in catalog_products]

        # Compute similarity
        start = time.time()
        scores = compute_similarity(query_text, catalog_texts)
        inference_time = time.time() - start

        # Build scored results
        scored = []
        for i, product in enumerate(catalog_products):
            scored.append({
                "_id": product.get("_id", str(i)),
                "score": round(scores[i], 4),
            })

        # Sort by score descending, take top N
        scored.sort(key=lambda x: x["score"], reverse=True)
        top_recommendations = scored[:limit]

        log.info(
            f"📊 Recommended {limit} products in {inference_time*1000:.0f}ms "
            f"(catalog size: {len(catalog_products)})"
        )

        return jsonify({
            "success": True,
            "recommendations": top_recommendations,
            "inferenceTimeMs": round(inference_time * 1000, 1),
        })

    except Exception as e:
        log.error(f"Recommendation error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/reload", methods=["POST"])
def reload():
    """Reload models from disk (useful after updating model files)."""
    success = load_models()
    return jsonify({
        "success": success,
        "message": "Models reloaded" if success else "Failed to reload",
        "metadata": model_metadata,
    })


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    log.info(f"🚀 Starting Recommendation Service on {FLASK_HOST}:{FLASK_PORT}")
    load_models()
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=False)
