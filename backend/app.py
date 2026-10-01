from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

PROJECT_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIR = PROJECT_ROOT / "frontend"
try:
    from backend.arbitrage import (
        ArbitrageError,
        bellman_ford_arbitrage,
        calculate_profit,
    )
except ModuleNotFoundError:
    from arbitrage import (
        ArbitrageError,
        bellman_ford_arbitrage,
        calculate_profit,
    )
app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
CORS(app)


@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.post("/api/detect")
def detect():
    try:
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            raise ArbitrageError("Request body must be valid JSON.")

        rates = payload.get("rates")
        amount = payload.get("amount", 1000)
        start_currency = payload.get("start_currency")

        result = bellman_ford_arbitrage(rates, start_currency)
        if result["arbitrage_found"]:
            result.update(calculate_profit(amount, result["product"]))
        else:
            result.update({
                "starting_amount": amount,
                "final_amount": amount,
                "profit": 0.0,
                "profit_percentage": 0.0,
            })

        result.pop("distance", None)
        return jsonify(result)

    except (ArbitrageError, TypeError, KeyError) as exc:
        return jsonify({"error": str(exc)}), 400


@app.get("/api/health")
def health():
    return jsonify({"status": "ready"})


if __name__ == "__main__":
    app.run(debug=True)
