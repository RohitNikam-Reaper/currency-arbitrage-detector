# Currency Arbitrage Detector

A college Computer Science project that detects potential currency arbitrage opportunities using the Bellman-Ford algorithm and negative-cycle detection.

## Stack
- Python + Flask
- HTML5, CSS3, JavaScript
- Bellman-Ford implemented manually

## Run
```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r backend/requirements.txt
python backend/app.py
```

Open `http://127.0.0.1:5000`.

## Test
```bash
pytest -q
```

## Mathematical model

Each currency is a vertex and each exchange rate is a directed edge.

`weight(u, v) = -log(exchange_rate)`

A negative cycle means the product of rates around that cycle is greater than 1, indicating a theoretical arbitrage opportunity before fees, spreads, slippage and other real-world costs.

## API

`POST /api/detect`

```json
{
  "rates": {
    "USD": {"USD": 1, "EUR": 0.90},
    "EUR": {"USD": 1.12, "EUR": 1}
  },
  "start_currency": "USD",
  "amount": 1000
}
```

## Complexity
Bellman-Ford: O(VE) time and O(V) auxiliary space for the distance/predecessor arrays.

## Limitations
The result is a theoretical opportunity. Real execution can be affected by transaction fees, bid-ask spread, slippage, liquidity, transfer limits and rate latency.
