# Currency Arbitrage Detector

A college Computer Science project that detects potential currency arbitrage opportunities using the **Bellman-Ford algorithm** and negative-cycle detection.

The final demonstration uses three currencies:

- **USD** — US Dollar
- **GBP** — British Pound
- **INR** — Indian Rupee

Three currencies are enough to demonstrate the complete graph-algorithm workflow while keeping the classroom visualization easy to understand.

## Features

- Manual Bellman-Ford negative-cycle detection
- Exchange-rate matrix for USD, GBP and INR
- Editable user inputs
- Reconstructed arbitrage cycle
- Theoretical profit and return calculation
- Native SVG currency graph
- Highlighted arbitrage cycle
- Long-number-safe graph labels
- Live input validation
- API test cases in the browser
- Three deterministic demo datasets
- Responsive dark/light dashboard
- Flask backend with JSON API
- Automated Python tests

## Technology Stack

- Python 3.10+
- Flask 3.1.2
- Flask-CORS 6.0.1
- pytest 8.4.2
- HTML5
- CSS3
- Vanilla JavaScript
- Native SVG for graph visualization

No external graph library is used for Bellman-Ford. The algorithm is implemented directly in `backend/arbitrage.py`.

## Project Structure

```text
currency-arbitrage-detector/
├── backend/
│   ├── __init__.py
│   ├── app.py
│   ├── arbitrage.py
│   └── requirements.txt
├── data/
│   └── sample_rates.json
├── frontend/
│   ├── assets/
│   │   └── arbitrage-logo.png
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── index.html
├── tests/
│   ├── test_api.py
│   └── test_arbitrage.py
├── .gitignore
├── LICENSE
├── pytest.ini
└── README.md
```

## Requirements

Install Python and create a virtual environment. No Node.js installation is required to run the application.

## Installation

From the project root:

### Windows PowerShell

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

If PowerShell blocks script activation, use:

```powershell
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

## Run the Project

From the project root:

```powershell
.venv\Scripts\python.exe backend\app.py
```

Then open:

```text
http://127.0.0.1:5000
```

The Flask server serves the frontend and the API from the same application.

## How to Use

1. Open the dashboard.
2. Enter or edit the exchange rates.
3. Select USD, GBP or INR as the starting currency.
4. Enter a positive starting amount.
5. Click **Detect Arbitrage**.
6. The backend builds the directed graph, transforms each rate using `-log(rate)`, runs Bellman-Ford, reconstructs a negative cycle when found, and calculates the theoretical return.
7. The SVG graph is updated from the same exchange-rate matrix and highlights the detected cycle.

## Demo Mode

**Load Demo Data** cycles through three deterministic datasets:

```text
Click 1 → Demo 1
Click 2 → Demo 2
Click 3 → Demo 3
Click 4 → Demo 1 again
```

Each dataset changes the matrix while remaining valid and intentionally containing an arbitrage opportunity for demonstration. The button gives immediate visual feedback showing which dataset was loaded.

After loading demo data, click **Detect Arbitrage** to run the real backend calculation.

## Mathematical Model

Each currency is a vertex and each exchange rate is a directed edge.

```text
weight(u, v) = -log(exchange_rate)
```

For a cycle, a negative total weight corresponds to:

```text
product of exchange rates > 1
```

which indicates a theoretical arbitrage opportunity before transaction costs and market effects.

## API

### Health Check

```text
GET /api/health
```

Example response:

```json
{
  "status": "ready"
}
```

### Detect Arbitrage

```text
POST /api/detect
```

Example request:

```json
{
  "rates": {
    "USD": {"GBP": 0.78, "INR": 83.20},
    "GBP": {"USD": 1.28, "INR": 106.00},
    "INR": {"USD": 0.0123, "GBP": 0.0094}
  },
  "start_currency": "USD",
  "amount": 1000
}
```

The backend validates that every currency has a rate for every other currency and rejects missing, unknown, non-finite, zero or negative rates.

## Testing

Run the complete suite from a clean environment after installing the dependencies:

```powershell
pytest -q
```

The tests cover:

- Arbitrage detection
- No-arbitrage detection
- Invalid rates
- Cycle reconstruction
- Profit calculation
- INR support
- API health endpoint
- API arbitrage detection
- API no-arbitrage detection
- Zero-rate rejection
- Negative-rate rejection

## Common Errors

### `ModuleNotFoundError: No module named 'flask'`

Activate the virtual environment and install dependencies:

```powershell
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

### PowerShell does not allow `.ps1` activation

Run the Python executable inside the environment directly:

```powershell
.venv\Scripts\python.exe backend\app.py
```

### Port 5000 is already in use

Stop the other Flask/Python process using port 5000, then start the application again.

### The browser shows an analysis error

Confirm that the Flask server is running and that the page was opened from `http://127.0.0.1:5000`, not by double-clicking `index.html`.

## Complexity

Bellman-Ford runs in **O(VE)** time. The distance and predecessor structures use **O(V)** auxiliary space, where `V` is the number of currencies and `E` is the number of directed exchange edges.

## Real-World Limitations

The detected result is a **theoretical opportunity**, not a guarantee of executable profit. Real trading can be affected by:

- Transaction fees
- Bid-ask spread
- Slippage
- Liquidity
- Exchange-rate latency
- Transfer fees and limits
- Market/API delays

## Graph Visualization

The frontend renders the exchange network using native SVG. The graph is generated from the current matrix, and the cycle returned by Bellman-Ford is highlighted after analysis. Exchange-rate labels use compact formatting for unusually large or small values so long user inputs do not overflow the graph.

## License

MIT License. See `LICENSE`.
