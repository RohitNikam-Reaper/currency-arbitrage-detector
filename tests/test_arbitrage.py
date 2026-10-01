import pytest

from backend.arbitrage import (
    ArbitrageError,
    bellman_ford_arbitrage,
    calculate_profit,
)


ARBITRAGE = {
    "USD": {"USD": 1, "EUR": 0.90, "GBP": 0.78},
    "EUR": {"USD": 1.12, "EUR": 1, "GBP": 0.90},
    "GBP": {"USD": 1.30, "EUR": 1.10, "GBP": 1},
}

NO_ARBITRAGE = {
    "USD": {"USD": 1.0, "EUR": 0.90, "GBP": 0.78},
    "EUR": {"USD": 1.0 / 0.90, "EUR": 1.0, "GBP": 0.78 / 0.90},
    "GBP": {"USD": 1.0 / 0.78, "EUR": 0.90 / 0.78, "GBP": 1.0},
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
        "USD": {"USD": 1, "EUR": bad_rate},
        "EUR": {"USD": 1.1, "EUR": 1},
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
