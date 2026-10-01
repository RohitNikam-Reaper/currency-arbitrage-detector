import pytest

from backend.arbitrage import (
    ArbitrageError,
    bellman_ford_arbitrage,
    calculate_profit,
)


ARBITRAGE = {
    "USD": {"USD": 1, "GBP": 0.78, "INR": 83.20},
    "GBP": {"USD": 1.28, "GBP": 1, "INR": 106.00},
    "INR": {"USD": 0.0123, "GBP": 0.0094, "INR": 1},
}

NO_ARBITRAGE = {
    "USD": {"USD": 1.0, "GBP": 0.78, "INR": 83.20},
    "GBP": {"USD": 1.0 / 0.78, "GBP": 1.0, "INR": 83.2 / 0.78},
    "INR": {"USD": 1.0 / 83.20, "GBP": 0.78 / 83.20, "INR": 1.0},
}


def test_arbitrage_exists():
    result = bellman_ford_arbitrage(ARBITRAGE, "USD")
    assert result["arbitrage_found"] is True
    assert result["product"] > 1


def test_no_arbitrage():
    result = bellman_ford_arbitrage(NO_ARBITRAGE, "USD")
    assert result["arbitrage_found"] is False


@pytest.mark.parametrize("bad_rate", [0, -1])
def test_invalid_rate(bad_rate):
    rates = {
        "USD": {"USD": 1, "GBP": bad_rate},
        "GBP": {"USD": 1.1, "GBP": 1},
    }
    with pytest.raises(ArbitrageError):
        bellman_ford_arbitrage(rates)


def test_cycle_reconstruction():
    result = bellman_ford_arbitrage(ARBITRAGE)
    cycle = result["cycle"]
    assert cycle[0] == cycle[-1]
    assert len(cycle) >= 3


def test_profit_calculation():
    result = calculate_profit(1000, 1.053)
    assert result["final_amount"] == pytest.approx(1053)
    assert result["profit"] == pytest.approx(53)
    assert result["profit_percentage"] == pytest.approx(5.3)


def test_inr_is_supported_in_three_currency_graph():
    rates = {
        "USD": {"USD": 1, "GBP": 0.78, "INR": 83.20},
        "GBP": {"USD": 1.28, "GBP": 1, "INR": 106.00},
        "INR": {"USD": 0.0123, "GBP": 0.0094, "INR": 1},
    }
    result = bellman_ford_arbitrage(rates, "INR")
    assert result["arbitrage_found"] is True
    assert result["vertices"] == 3
    assert result["edges"] == 6
    assert "INR" in result["cycle"]


def test_missing_exchange_rate_is_rejected():
    incomplete = {
        "USD": {"GBP": 0.78, "INR": 83.20},
        "GBP": {"USD": 1.28},
        "INR": {"USD": 0.0123, "GBP": 0.0094},
    }
    with pytest.raises(ArbitrageError, match="Missing exchange rate"):
        bellman_ford_arbitrage(incomplete)


def test_profit_overflow_is_rejected():
    with pytest.raises(ArbitrageError, match="supported numeric range"):
        calculate_profit(1e308, 1e308)
