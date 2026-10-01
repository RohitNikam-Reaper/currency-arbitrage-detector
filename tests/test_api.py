from backend.app import app


def test_health_endpoint():
    client = app.test_client()

    response = client.get("/api/health")

    assert response.status_code == 200

    data = response.get_json()

    assert data["status"] == "ready"


def test_detect_arbitrage():
    client = app.test_client()

    payload = {
        "rates": {
            "USD": {"GBP": 0.78, "INR": 83.20},
            "GBP": {"USD": 1.28, "INR": 106.00},
            "INR": {"USD": 0.0123, "GBP": 0.0094}
        },
        "start_currency": "USD",
        "amount": 1000
    }

    response = client.post("/api/detect", json=payload)

    assert response.status_code == 200

    data = response.get_json()

    assert data["arbitrage_found"] is True
    assert data["profit"] > 0
    assert data["profit_percentage"] > 0
    assert len(data["cycle"]) >= 2


def test_detect_no_arbitrage():
    client = app.test_client()

    payload = {
        "rates": {
            "USD": {"GBP": 0.78, "INR": 83.20},
            "GBP": {"USD": 1.0 / 0.78, "INR": 83.20 / 0.78},
            "INR": {"USD": 1.0 / 83.20, "GBP": 0.78 / 83.20}
        },
        "start_currency": "USD",
        "amount": 1000
    }

    response = client.post("/api/detect", json=payload)

    assert response.status_code == 200

    data = response.get_json()

    assert data["arbitrage_found"] is False
    assert data["profit"] == 0.0
    assert data["profit_percentage"] == 0.0


def test_invalid_zero_exchange_rate():
    client = app.test_client()

    payload = {
        "rates": {
            "USD": {"GBP": 0, "INR": 83.20},
            "GBP": {"USD": 1.28, "INR": 106.00},
            "INR": {"USD": 0.0123, "GBP": 0.0094}
        },
        "start_currency": "USD",
        "amount": 1000
    }

    response = client.post("/api/detect", json=payload)

    assert response.status_code == 400

    data = response.get_json()

    assert "error" in data
    assert "greater than 0" in data["error"]


def test_invalid_negative_exchange_rate():
    client = app.test_client()

    payload = {
        "rates": {
            "USD": {"GBP": -0.90, "INR": 83.20},
            "GBP": {"USD": 1.28, "INR": 106.00},
            "INR": {"USD": 0.0123, "GBP": 0.0094}
        },
        "start_currency": "USD",
        "amount": 1000
    }

    response = client.post("/api/detect", json=payload)

    assert response.status_code == 400

    data = response.get_json()

    assert "error" in data
    assert "greater than 0" in data["error"]

def test_detect_uses_changed_exchange_rate():
    client = app.test_client()

    base_rates = {
        "USD": {"GBP": 0.78, "INR": 83.20},
        "GBP": {"USD": 1.28, "INR": 106.00},
        "INR": {"USD": 0.0123, "GBP": 0.0094}
    }

    changed_rates = {
        "USD": {"GBP": 0.90, "INR": 83.20},
        "GBP": {"USD": 1.28, "INR": 106.00},
        "INR": {"USD": 0.0123, "GBP": 0.0094}
    }

    base_response = client.post(
        "/api/detect",
        json={"rates": base_rates, "start_currency": "USD", "amount": 1000}
    )
    changed_response = client.post(
        "/api/detect",
        json={"rates": changed_rates, "start_currency": "USD", "amount": 1000}
    )

    assert base_response.status_code == 200
    assert changed_response.status_code == 200

    base_data = base_response.get_json()
    changed_data = changed_response.get_json()

    assert base_data["profit_percentage"] != changed_data["profit_percentage"]
    assert base_data["final_amount"] != changed_data["final_amount"]
