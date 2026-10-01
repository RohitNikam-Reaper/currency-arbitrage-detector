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
            "USD": {
                "EUR": 0.90,
                "GBP": 0.78
            },
            "EUR": {
                "USD": 1.11,
                "GBP": 0.90
            },
            "GBP": {
                "USD": 1.30,
                "EUR": 1.10
            }
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
            "USD": {
                "EUR": 0.90,
                "GBP": 0.78
            },
            "EUR": {
                "USD": 1.1111111111,
                "GBP": 0.8666666667
            },
            "GBP": {
                "USD": 1.2820512821,
                "EUR": 1.1538461538
            }
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
            "USD": {
                "EUR": 0,
                "GBP": 0.78
            },
            "EUR": {
                "USD": 1.11,
                "GBP": 0.90
            },
            "GBP": {
                "USD": 1.30,
                "EUR": 1.10
            }
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
            "USD": {
                "EUR": -0.90,
                "GBP": 0.78
            },
            "EUR": {
                "USD": 1.11,
                "GBP": 0.90
            },
            "GBP": {
                "USD": 1.30,
                "EUR": 1.10
            }
        },
        "start_currency": "USD",
        "amount": 1000
    }

    response = client.post("/api/detect", json=payload)

    assert response.status_code == 400

    data = response.get_json()

    assert "error" in data
    assert "greater than 0" in data["error"]