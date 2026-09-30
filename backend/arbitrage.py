"""Currency arbitrage detection using Bellman-Ford."""

from __future__ import annotations

import math
from typing import Dict, List, Tuple


class ArbitrageError(ValueError):
    """Raised when exchange-rate input is invalid."""


Edge = Tuple[str, str, float]


def validate_rates(rates: Dict[str, Dict[str, float]]) -> List[str]:
    """Validate a currency-rate matrix and return its currency names."""
    if not isinstance(rates, dict) or len(rates) < 2:
        raise ArbitrageError("At least two currencies are required.")

    currencies = list(rates.keys())
    for currency, targets in rates.items():
        if not isinstance(currency, str) or not currency.strip():
            raise ArbitrageError("Currency names must be non-empty strings.")
        if not isinstance(targets, dict):
            raise ArbitrageError("Each currency must contain a rate object.")

        for target, rate in targets.items():
            if target not in rates:
                raise ArbitrageError(f"Unknown target currency: {target}.")
            if currency == target:
                continue
            if not isinstance(rate, (int, float)) or isinstance(rate, bool):
                raise ArbitrageError("Exchange rates must be numeric.")
            if not math.isfinite(rate) or rate <= 0:
                raise ArbitrageError("Exchange rate must be greater than 0.")

    return currencies


def build_edges(rates: Dict[str, Dict[str, float]]) -> List[Edge]:
    """Convert rates into directed weighted edges using -log(rate)."""
    edges: List[Edge] = []
    for source, targets in rates.items():
        for target, rate in targets.items():
            if source == target:
                continue
            edges.append((source, target, -math.log(rate)))
    return edges


def calculate_cycle_product(cycle: List[str], rates: Dict[str, Dict[str, float]]) -> float:
    """Return the product of exchange rates around a closed cycle."""
    product = 1.0
    for source, target in zip(cycle, cycle[1:]):
        product *= rates[source][target]
    return product


def bellman_ford_arbitrage(
    rates: Dict[str, Dict[str, float]],
    start_currency: str | None = None,
) -> dict:
    """Detect and reconstruct one reachable negative cycle."""
    currencies = validate_rates(rates)
    if start_currency is not None and start_currency not in rates:
        raise ArbitrageError("Starting currency is not present in the rate matrix.")

    edges = build_edges(rates)
    source = start_currency or currencies[0]

    # Every vertex is initially reachable. This makes detection independent
    # of which currency the evaluator selects as the starting point.
    distance = {currency: 0.0 for currency in currencies}
    predecessor = {currency: None for currency in currencies}

    updated = None
    for _ in range(len(currencies) - 1):
        updated = None
        changed = False
        for source_node, target_node, weight in edges:
            candidate = distance[source_node] + weight
            if candidate < distance[target_node] - 1e-9:
                distance[target_node] = candidate
                predecessor[target_node] = source_node
                updated = target_node
                changed = True
        if not changed:
            break

    cycle_node = None
    for source_node, target_node, weight in edges:
        if distance[source_node] + weight < distance[target_node] - 1e-9:
            predecessor[target_node] = source_node
            cycle_node = target_node
            break

    if cycle_node is None:
        return {
            "arbitrage_found": False,
            "cycle": [],
            "cycle_rates": [],
            "product": 1.0,
            "distance": distance,
            "vertices": len(currencies),
            "edges": len(edges),
            "iterations": len(currencies) - 1,
        }

    # Move V predecessors backward so we are guaranteed to enter the cycle.
    cycle_entry = cycle_node
    for _ in range(len(currencies)):
        cycle_entry = predecessor[cycle_entry]

    reverse_cycle = [cycle_entry]
    current = predecessor[cycle_entry]
    while current != cycle_entry:
        reverse_cycle.append(current)
        current = predecessor[current]
    reverse_cycle.append(cycle_entry)

    cycle = list(reversed(reverse_cycle))
    product = calculate_cycle_product(cycle, rates)

    return {
        "arbitrage_found": product > 1.0 + 1e-9,
        "cycle": cycle,
        "cycle_rates": [
            rates[source_node][target_node]
            for source_node, target_node in zip(cycle, cycle[1:])
        ],
        "product": product,
        "distance": distance,
        "vertices": len(currencies),
        "edges": len(edges),
        "iterations": len(currencies) - 1,
    }


def calculate_profit(amount: float, product: float) -> dict:
    """Calculate final amount, absolute profit and percentage return."""
    if not isinstance(amount, (int, float)) or isinstance(amount, bool):
        raise ArbitrageError("Starting amount must be numeric.")
    if not math.isfinite(amount) or amount <= 0:
        raise ArbitrageError("Starting amount must be greater than 0.")

    final_amount = amount * product
    profit = final_amount - amount
    return {
        "starting_amount": amount,
        "final_amount": final_amount,
        "profit": profit,
        "profit_percentage": (profit / amount) * 100,
    }
