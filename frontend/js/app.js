/* =========================================================
   CURRENCY ARBITRAGE DETECTOR
   Frontend Dashboard Logic
   Final frontend logic
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const CURRENCIES = ["USD", "GBP", "INR"];

/*
 * Keep multiple deterministic demo datasets so every click on
 * "Load Demo Data" visibly changes the matrix while remaining
 * valid and intentionally profitable for demonstration.
 */
const DEMO_DATASETS = [
    {
        USD: { GBP: 0.78, INR: 83.20 },
        GBP: { USD: 1.28, INR: 106.00 },
        INR: { USD: 0.0123, GBP: 0.0094 }
    },
    {
        USD: { GBP: 0.79, INR: 84.00 },
        GBP: { USD: 1.29, INR: 107.00 },
        INR: { USD: 0.01225, GBP: 0.00945 }
    },
    {
        USD: { GBP: 0.77, INR: 82.60 },
        GBP: { USD: 1.31, INR: 105.80 },
        INR: { USD: 0.01220, GBP: 0.00955 }
    }
];

let demoIndex = -1;


function generateDemoRates() {
    demoIndex = (demoIndex + 1) % DEMO_DATASETS.length;

    // Clone the selected dataset so later edits in the matrix never mutate
    // the stored demo values.
    return structuredClone(DEMO_DATASETS[demoIndex]);
}


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const currencyCount = document.getElementById("currencyCount");
const pairCount = document.getElementById("pairCount");
const cycleStatus = document.getElementById("cycleStatus");
const returnValue = document.getElementById("returnValue");

const graphStatus = document.getElementById("graphStatus");
const graphEmpty = document.getElementById("graphEmpty");
const currencyGraph = document.getElementById("currencyGraph");
let detectedCycle = [];

const startCurrency = document.getElementById("startCurrency");
const amountInput = document.getElementById("amount");

const demoButton = document.getElementById("demoButton");
const clearButton = document.getElementById("clearButton");
const detectButton = document.getElementById("detectButton");
const validationButton = document.getElementById("validationButton");
const testSuiteButton = document.getElementById("testSuiteButton");
const liveValidationButton = document.getElementById("liveValidationButton");
const validationPanel = document.getElementById("validationPanel");
const testResultsPanel = document.getElementById("testResultsPanel");
const liveValidationPanel = document.getElementById("liveValidationPanel");
const liveValidationContent = document.getElementById("liveValidationContent");

const resultState = document.getElementById("resultState");
const cycleSection = document.getElementById("cycleSection");
const cycleDisplay = document.getElementById("cycleDisplay");

const startingAmountResult =
    document.getElementById("startingAmountResult");

const finalAmountResult =
    document.getElementById("finalAmountResult");

const profitResult =
    document.getElementById("profitResult");

const profitPercentageResult =
    document.getElementById("profitPercentageResult");

/* =========================================================
   THEME SYSTEM
   ========================================================= */

const themeToggle =
    document.getElementById("themeToggle");

const themeIcon =
    document.getElementById("themeIcon");

const themeText =
    document.getElementById("themeText");


function applyTheme(theme) {

    const lightMode =
        theme === "light";

    document.body.classList.toggle(
        "light-mode",
        lightMode
    );

    if (lightMode) {

        themeIcon.textContent = "🌙";
        themeText.textContent = "Dark";

    } else {

        themeIcon.textContent = "☀";
        themeText.textContent = "Light";
    }

    localStorage.setItem(
        "currencyArbitrageTheme",
        theme
    );
}


function toggleTheme() {

    const isLight =
        document.body.classList.contains(
            "light-mode"
        );

    applyTheme(
        isLight
            ? "dark"
            : "light"
    );
}


if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        toggleTheme
    );
}


/* =========================================================
   MATRIX HELPERS
   ========================================================= */

function getRateInputs() {
    return document.querySelectorAll(
        ".rate-table input[data-from][data-to]"
    );
}


function getRatesFromMatrix() {
    const rates = {};

    CURRENCIES.forEach((currency) => {
        rates[currency] = {};
    });

    getRateInputs().forEach((input) => {
        const from = input.dataset.from;
        const to = input.dataset.to;

        rates[from][to] = Number(input.value);
    });

    return rates;
}


function setRatesToMatrix(rates) {
    getRateInputs().forEach((input) => {
        const from = input.dataset.from;
        const to = input.dataset.to;

        if (
            rates[from] &&
            rates[from][to] !== undefined
        ) {
            input.value = rates[from][to];
        }
    });
}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {
    const rates = getRatesFromMatrix();

    const currencies = Object.keys(rates);

    let pairs = 0;

    currencies.forEach((from) => {
        Object.keys(rates[from]).forEach(() => {
            pairs += 1;
        });
    });

    currencyCount.textContent = currencies.length;
    pairCount.textContent = pairs;
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateRates(rates) {
    for (const from of CURRENCIES) {

        if (!rates[from]) {
            return `Missing currency: ${from}`;
        }

        for (const to of CURRENCIES) {

            if (from === to) {
                continue;
            }

            const value = rates[from][to];

            if (
                value === undefined ||
                !Number.isFinite(value)
            ) {
                return `Missing exchange rate: ${from} → ${to}`;
            }

            if (value <= 0) {
                return `Exchange rate ${from} → ${to} must be greater than 0.`;
            }
        }
    }

    return null;
}


function getAmount() {
    const amount = Number(amountInput.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        return null;
    }

    return amount;
}


function getLiveValidationMessages() {
    const messages = [];

    getRateInputs().forEach((input) => {
        const value = input.value.trim();
        const from = input.dataset.from;
        const to = input.dataset.to;

        if (value === "") {
            messages.push(`Exchange rate ${from} → ${to} is required.`);
            return;
        }

        const number = Number(value);

        if (!Number.isFinite(number)) {
            messages.push(`Exchange rate ${from} → ${to} must be a valid number.`);
        } else if (number <= 0) {
            messages.push(`Exchange rate ${from} → ${to} must be greater than 0.`);
        }
    });

    const amountValue = amountInput.value.trim();

    if (amountValue === "") {
        messages.push("Starting amount is required.");
    } else {
        const amount = Number(amountValue);
        if (!Number.isFinite(amount) || amount <= 0) {
            messages.push("Starting amount must be greater than 0.");
        }
    }

    return messages;
}


function updateLiveValidation() {
    if (!liveValidationContent) return;

    const messages = getLiveValidationMessages();

    if (messages.length === 0) {
        liveValidationPanel.classList.remove("invalid");
        liveValidationPanel.classList.add("valid");
        liveValidationContent.innerHTML = `
            <div class="live-validation-status">
                <span class="live-status-icon">✓</span>
                <div>
                    <strong>All inputs are valid.</strong>
                    <span>Exchange rates and starting amount are ready for analysis.</span>
                </div>
            </div>
        `;
        return;
    }

    liveValidationPanel.classList.remove("valid");
    liveValidationPanel.classList.add("invalid");
    liveValidationContent.innerHTML = `
        <div class="live-validation-status">
            <span class="live-status-icon">!</span>
            <div>
                <strong>Invalid input detected.</strong>
                <ul>
                    ${messages.map((message) => `<li>${message}</li>`).join("")}
                </ul>
            </div>
        </div>
    `;
}


function toggleLiveValidation() {
    if (!liveValidationPanel || !liveValidationButton) return;

    const isHidden = liveValidationPanel.classList.contains("hidden");
    liveValidationPanel.classList.toggle("hidden");
    liveValidationButton.textContent = isHidden
        ? "Hide Live Validation"
        : "Live Validation";

    if (isHidden) {
        updateLiveValidation();
    }
}


/* =========================================================
   RESULT UI
   ========================================================= */

function showMessage(
    title,
    description,
    type = "neutral"
) {
    resultState.className = `result-state ${type}`;

    let icon = "?";

    if (type === "success") {
        icon = "✓";
    }

    if (type === "danger") {
        icon = "!";
    }

    resultState.innerHTML = `
        <div class="result-icon">
            ${icon}
        </div>

        <h4>${title}</h4>

        <p>${description}</p>
    `;
}


function resetResults() {
    cycleSection.classList.add("hidden");

    cycleDisplay.textContent = "";

    startingAmountResult.textContent = "—";
    finalAmountResult.textContent = "—";
    profitResult.textContent = "—";
    profitPercentageResult.textContent = "—";

    cycleStatus.textContent = "—";
    cycleStatus.className = "stat-value status-neutral";

    returnValue.textContent = "0.00%";

    showMessage(
        "Awaiting Analysis",
        "Enter exchange rates and run the arbitrage detector.",
        "neutral"
    );
}


/* =========================================================
   GRAPH VISUALIZATION
   ========================================================= */

function cycleEdgeSet(cycle) {
    const edges = new Set();
    for (let i = 0; i < cycle.length - 1; i += 1) {
        edges.add(`${cycle[i]}|${cycle[i + 1]}`);
    }
    return edges;
}

function svgElement(name, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
}

function formatGraphRate(value) {
    if (!Number.isFinite(value)) return "—";

    const absolute = Math.abs(value);

    // Keep labels compact without changing the actual rate used by the algorithm.
    if (absolute >= 100000 || (absolute > 0 && absolute < 0.0001)) {
        return value.toExponential(3);
    }

    return Number(value.toPrecision(6)).toString();
}

function graphLabelOverlaps(candidate, placedLabels, nodes) {
    const gap = 8;

    for (const box of placedLabels) {
        if (
            candidate.left < box.right + gap &&
            candidate.right > box.left - gap &&
            candidate.top < box.bottom + gap &&
            candidate.bottom > box.top - gap
        ) {
            return true;
        }
    }

    for (const node of nodes) {
        if (
            candidate.left < node.right + gap &&
            candidate.right > node.left - gap &&
            candidate.top < node.bottom + gap &&
            candidate.bottom > node.top - gap
        ) {
            return true;
        }
    }

    return false;
}

function chooseGraphLabelPosition({ midX, midY, nx, ny, tx, ty, labelWidth, labelHeight, placedLabels, nodes }) {
    // Try positions around the curved edge before falling back to the best
    // available position. This prevents long labels from sitting on top of
    // another directed edge label or a currency node.
    const candidates = [
        [28, 0], [42, 0], [-28, 0], [-42, 0],
        [28, 20], [28, -20], [-28, 20], [-28, -20],
        [42, 26], [42, -26], [-42, 26], [-42, -26],
        [56, 0], [-56, 0]
    ];

    const makeBox = (x, y) => ({
        left: x - labelWidth / 2,
        right: x + labelWidth / 2,
        top: y - labelHeight / 2,
        bottom: y + labelHeight / 2
    });

    for (const [normalOffset, tangentOffset] of candidates) {
        const x = midX + nx * normalOffset + tx * tangentOffset;
        const y = midY + ny * normalOffset + ty * tangentOffset;
        const box = makeBox(x, y);

        if (
            box.left >= 8 &&
            box.right <= 892 &&
            box.top >= 8 &&
            box.bottom <= 512 &&
            !graphLabelOverlaps(box, placedLabels, nodes)
        ) {
            return { x, y, box };
        }
    }

    const fallback = makeBox(midX + nx * 28, midY + ny * 28);
    return {
        x: midX + nx * 28,
        y: midY + ny * 28,
        box: fallback
    };
}

function renderGraph(cycle = []) {
    if (!currencyGraph) return;
    currencyGraph.innerHTML = "";
    currencyGraph.style.visibility = "visible";

    const defs = svgElement("defs");

    const arrow = svgElement("marker", {
        id: "graph-arrow",
        viewBox: "0 0 10 10",
        refX: "9",
        refY: "5",
        markerWidth: "5",
        markerHeight: "5",
        orient: "auto"
    });
    arrow.appendChild(
        svgElement("path", {
            d: "M 0 0 L 10 5 L 0 10 z",
            fill: "#94a3b8"
        })
    );

    const arrowArbitrage = svgElement("marker", {
        id: "graph-arrow-arbitrage",
        viewBox: "0 0 10 10",
        refX: "9",
        refY: "5",
        markerWidth: "6",
        markerHeight: "6",
        orient: "auto"
    });
    arrowArbitrage.appendChild(
        svgElement("path", {
            d: "M 0 0 L 10 5 L 0 10 z",
            fill: "#38d996"
        })
    );

    defs.appendChild(arrow);
    defs.appendChild(arrowArbitrage);
    currencyGraph.appendChild(defs);

    const rates = getRatesFromMatrix();
    const highlighted = cycleEdgeSet(cycle);
    const positions = {};
    const centerX = 450;
    const centerY = 260;
    const radius = 175;

    CURRENCIES.forEach((currency, index) => {
        const angle =
            -Math.PI / 2 +
            index * (2 * Math.PI / CURRENCIES.length);

        positions[currency] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });

    const edgeLayer = svgElement("g");
    const labelLayer = svgElement("g");
    const nodeLayer = svgElement("g");
    const placedLabels = [];
    const nodeBounds = CURRENCIES.map((currency) => {
        const point = positions[currency];
        return {
            left: point.x - 38,
            right: point.x + 38,
            top: point.y - 38,
            bottom: point.y + 38
        };
    });

    CURRENCIES.forEach((from) => {
        CURRENCIES.forEach((to) => {
            if (from === to) return;

            const rate = rates[from]?.[to];
            if (!Number.isFinite(rate) || rate <= 0) return;

            const start = positions[from];
            const end = positions[to];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const distance = Math.hypot(dx, dy);

            const nx = -dy / distance;
            const ny = dx / distance;
            const direction =
                CURRENCIES.indexOf(from) < CURRENCIES.indexOf(to)
                    ? 1
                    : -1;

            // Use a larger, deterministic separation for opposite directed
            // edges so their curves and labels remain visually distinct.
            const curve =
                Math.min(78, Math.max(48, distance * 0.20)) * direction;

            const controlX =
                (start.x + end.x) / 2 + nx * curve;
            const controlY =
                (start.y + end.y) / 2 + ny * curve;

            const isCycleEdge = highlighted.has(`${from}|${to}`);

            edgeLayer.appendChild(
                svgElement("path", {
                    d: `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`,
                    class: isCycleEdge
                        ? "graph-edge arbitrage"
                        : "graph-edge"
                })
            );

            // Position the label using the actual quadratic curve midpoint,
            // then move it away from nearby labels/nodes until a free position
            // is found. The displayed value may be compacted, but the numeric
            // rate itself is never modified.
            const midX =
                0.25 * start.x +
                0.5 * controlX +
                0.25 * end.x;
            const midY =
                0.25 * start.y +
                0.5 * controlY +
                0.25 * end.y;

            const tangentLength = Math.hypot(
                end.x - start.x,
                end.y - start.y
            );
            const tx = (end.x - start.x) / tangentLength;
            const ty = (end.y - start.y) / tangentLength;
            const labelText = formatGraphRate(rate);
            const labelWidth = Math.max(54, Math.min(132, labelText.length * 7 + 18));
            const labelHeight = 22;
            const labelPosition = chooseGraphLabelPosition({
                midX,
                midY,
                nx: nx * direction,
                ny: ny * direction,
                tx,
                ty,
                labelWidth,
                labelHeight,
                placedLabels,
                nodes: nodeBounds
            });
            const labelX = labelPosition.x;
            const labelY = labelPosition.y;
            placedLabels.push(labelPosition.box);

            const labelGroup = svgElement("g", {
                class: "graph-rate-label-group"
            });

            // Keep the pill compact even when a user enters an extremely long number.
            labelGroup.appendChild(
                svgElement("rect", {
                    x: labelX - labelWidth / 2,
                    y: labelY - 11,
                    width: labelWidth,
                    height: 22,
                    rx: 7,
                    class: isCycleEdge
                        ? "graph-rate-label-bg arbitrage"
                        : "graph-rate-label-bg"
                })
            );

            const label = svgElement("text", {
                x: labelX,
                y: labelY + 4,
                class: isCycleEdge
                    ? "graph-edge-label arbitrage"
                    : "graph-edge-label"
            });
            label.textContent = labelText;
            labelGroup.appendChild(label);
            labelLayer.appendChild(labelGroup);
        });
    });

    CURRENCIES.forEach((currency) => {
        const point = positions[currency];
        const isCycleNode = cycle.includes(currency);

        nodeLayer.appendChild(
            svgElement("circle", {
                cx: point.x,
                cy: point.y,
                r: isCycleNode ? 31 : 29,
                class: isCycleNode
                    ? "graph-node arbitrage"
                    : "graph-node"
            })
        );

        const label = svgElement("text", {
            x: point.x,
            y: point.y,
            class: "graph-node-label"
        });
        label.textContent = currency;
        nodeLayer.appendChild(label);
    });

    currencyGraph.appendChild(edgeLayer);
    currencyGraph.appendChild(labelLayer);
    currencyGraph.appendChild(nodeLayer);

    const hasRates = Object.values(rates).some((row) =>
        Object.values(row).some(
            (value) => Number.isFinite(value) && value > 0
        )
    );

    if (graphEmpty) {
        graphEmpty.style.display = hasRates ? "none" : "grid";
    }
}
function hideGraph(statusText = "GRAPH READY", message = "Run Detect Arbitrage to analyze and display the graph.") {
    detectedCycle = [];

    if (currencyGraph) {
        currencyGraph.style.visibility = "hidden";
    }

    if (graphEmpty) {
        graphEmpty.style.display = "grid";
        const title = graphEmpty.querySelector("h4");
        const description = graphEmpty.querySelector("p");
        if (title) title.textContent = "Currency Graph";
        if (description) description.textContent = message;
    }

    if (graphStatus) {
        graphStatus.innerHTML = `<span class="graph-status-dot"></span> ${statusText}`;
    }
}


function resetGraph() {
    hideGraph();
}

/* =========================================================
   BUTTON ACTIONS
   ========================================================= */

function loadDemoData() {
    const rates = generateDemoRates();
    const datasetNumber = demoIndex + 1;

    setRatesToMatrix(rates);

    startCurrency.value = "USD";
    amountInput.value = "1000";

    updateStatistics();
    resetResults();
    hideGraph(
        `DEMO ${datasetNumber} LOADED`,
        `Demo dataset ${datasetNumber} of ${DEMO_DATASETS.length} is loaded. Click Detect Arbitrage to analyze it.`
    );
    updateLiveValidation();

    // Give immediate visual confirmation that the click was processed.
    if (demoButton) {
        demoButton.textContent = `Demo ${datasetNumber} Loaded`;
        demoButton.classList.add("demo-loaded");
        window.clearTimeout(loadDemoData.feedbackTimer);
        loadDemoData.feedbackTimer = window.setTimeout(() => {
            demoButton.textContent = "Load Demo Data";
            demoButton.classList.remove("demo-loaded");
        }, 1100);
    }
}



function clearData() {
    getRateInputs().forEach((input) => {
        input.value = "";
    });

    amountInput.value = "";

    updateStatistics();
    resetResults();
    resetGraph();
}


async function detectArbitrage() {

    const rates = getRatesFromMatrix();

    const validationError = validateRates(rates);

    if (validationError) {
        resetResults();
        showMessage(
            "Invalid Input",
            validationError,
            "danger"
        );
        hideGraph("INPUT ERROR", "The graph is hidden until valid data is analyzed.");
        return;
    }

    const amount = getAmount();

    if (amount === null) {
        resetResults();
        showMessage(
            "Invalid Amount",
            "Starting amount must be greater than zero.",
            "danger"
        );
        hideGraph("INPUT ERROR", "The graph is hidden until valid data is analyzed.");
        return;
    }

    detectButton.disabled = true;
    detectButton.textContent = "Analyzing...";

    showMessage(
        "Running Bellman-Ford",
        "Analyzing the currency exchange graph for negative cycles.",
        "neutral"
    );

    cycleStatus.textContent = "ANALYZING";
    cycleStatus.className = "stat-value status-neutral";
    returnValue.textContent = "—";

    try {
        const response = await fetch(
            "/api/detect",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    rates: rates,
                    amount: amount,
                    start_currency: startCurrency.value
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "The server returned an error."
            );
        }

        if (result.vertices !== undefined) {
            currencyCount.textContent = result.vertices;
        }

        if (result.edges !== undefined) {
            pairCount.textContent = result.edges;
        }

        if (result.arbitrage_found) {

            cycleStatus.textContent = "FOUND";
            cycleStatus.className = "stat-value status-success";

            const percentage =
                Number(result.profit_percentage || 0);

            returnValue.textContent =
                `${percentage.toFixed(2)}%`;

            cycleSection.classList.remove("hidden");

            if (Array.isArray(result.cycle)) {
                detectedCycle = result.cycle;
                cycleDisplay.textContent =
                    result.cycle.join(" → ");
            } else {
                detectedCycle = [];
                cycleDisplay.textContent =
                    String(result.cycle);
            }

            startingAmountResult.textContent =
                Number(result.starting_amount).toFixed(2);

            finalAmountResult.textContent =
                Number(result.final_amount).toFixed(2);

            profitResult.textContent =
                Number(result.profit).toFixed(2);

            profitPercentageResult.textContent =
                `${percentage.toFixed(2)}%`;

            showMessage(
                "Arbitrage Opportunity Found",
                "Bellman-Ford detected a negative cycle in the currency exchange graph.",
                "success"
            );

            if (graphStatus) graphStatus.innerHTML = '<span class="graph-status-dot"></span> CYCLE HIGHLIGHTED';
            renderGraph(detectedCycle);

        } else {

            cycleSection.classList.add("hidden");
            cycleDisplay.textContent = "";

            cycleStatus.textContent = "NOT FOUND";
            cycleStatus.className =
                "stat-value status-neutral";

            returnValue.textContent = "0.00%";

            startingAmountResult.textContent =
                Number(
                    result.starting_amount ?? amount
                ).toFixed(2);

            finalAmountResult.textContent =
                Number(
                    result.final_amount ?? amount
                ).toFixed(2);

            profitResult.textContent =
                Number(result.profit ?? 0).toFixed(2);

            profitPercentageResult.textContent =
                "0.00%";

            detectedCycle = [];
            if (graphStatus) graphStatus.innerHTML = '<span class="graph-status-dot"></span> GRAPH ANALYZED';
            renderGraph([]);

            showMessage(
                "No Arbitrage Detected",
                "No negative cycle was found in the supplied exchange-rate graph.",
                "neutral"
            );
        }

    } catch (error) {

        console.error(
            "Arbitrage detection error:",
            error
        );

        resetResults();

        cycleStatus.textContent = "ERROR";
        cycleStatus.className =
            "stat-value status-danger";

        returnValue.textContent = "—";

        showMessage(
            "Analysis Failed",
            error.message ||
            "Unable to connect to the Flask backend.",
            "danger"
        );
        hideGraph("ANALYSIS ERROR", "The graph is hidden because the analysis failed.");

    } finally {

        detectButton.disabled = false;
        detectButton.textContent = "Detect Arbitrage";
    }
}

/* =========================================================
   VALIDATION / TEST TOOLS
   ========================================================= */

function showValidationRules() {
    if (!validationPanel || !validationButton) return;

    const isHidden = validationPanel.classList.contains("hidden");
    validationPanel.classList.toggle("hidden");
    validationButton.textContent = isHidden
        ? "Hide Validation Rules"
        : "Validation Rules";
}


function setTestPanelMessage(message, type = "neutral") {
    if (!testResultsPanel) return;
    testResultsPanel.className = `quality-panel test-results-panel ${type}`;
    testResultsPanel.innerHTML = message;
    testResultsPanel.classList.remove("hidden");
}


function toggleTestPanel() {
    if (!testResultsPanel || !testSuiteButton) return;

    const isHidden = testResultsPanel.classList.contains("hidden");

    if (!isHidden) {
        testResultsPanel.classList.add("hidden");
        testSuiteButton.textContent = "Run Test Cases";
        return;
    }

    runTestSuite();
}


async function runTestSuite() {
    if (testSuiteButton) {
        testSuiteButton.disabled = true;
        testSuiteButton.textContent = "Running Tests...";
    }

    const arbitrageRates = {
        USD: { GBP: 0.78, INR: 83.20 },
        GBP: { USD: 1.28, INR: 106.00 },
        INR: { USD: 0.0123, GBP: 0.0094 }
    };

    const noArbitrageRates = {
        USD: { GBP: 0.78, INR: 83.20 },
        GBP: { USD: 1 / 0.78, INR: 83.20 / 0.78 },
        INR: { USD: 1 / 83.20, GBP: 0.78 / 83.20 }
    };

    const invalidRates = {
        USD: { GBP: 0, INR: 83.20 },
        GBP: { USD: 1 / 0.78, INR: 83.20 / 0.78 },
        INR: { USD: 1 / 83.20, GBP: 0.78 / 83.20 }
    };

    const cases = [
        ["Arbitrage detection", arbitrageRates, "arbitrage_found", true],
        ["No-arbitrage detection", noArbitrageRates, "arbitrage_found", false],
        ["Zero-rate validation", invalidRates, "error", null]
    ];

    const results = [];

    try {
        for (const [name, rates, field, expected] of cases) {
            const response = await fetch("/api/detect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rates, amount: 1000, start_currency: "USD" })
            });
            const data = await response.json();

            let passed;
            if (field === "error") {
                passed = response.status === 400 && Boolean(data.error);
            } else {
                passed = response.ok && data.arbitrage_found === expected;
            }

            results.push({ name, passed });
        }

        const allPassed = results.every((item) => item.passed);
        const rows = results.map((item) => `
            <div class="quality-test-row">
                <span>${item.name}</span>
                <strong class="${item.passed ? "test-pass" : "test-fail"}">${item.passed ? "PASS" : "FAIL"}</strong>
            </div>
        `).join("");

        setTestPanelMessage(`
            <div class="quality-panel-title">API Test Cases</div>
            ${rows}
            <div class="quality-summary ${allPassed ? "test-pass" : "test-fail"}">
                ${allPassed ? "All browser API test cases passed." : "One or more browser API test cases failed."}
            </div>
        `, allPassed ? "success" : "danger");
    } catch (error) {
        setTestPanelMessage(`
            <div class="quality-panel-title">API Test Cases</div>
            <div class="quality-summary test-fail">Test run failed: ${error.message}</div>
        `, "danger");
    } finally {
        if (testSuiteButton) {
            testSuiteButton.disabled = false;
            testSuiteButton.textContent = testResultsPanel && !testResultsPanel.classList.contains("hidden")
                ? "Hide Test Cases"
                : "Run Test Cases";
        }
    }
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

demoButton.addEventListener(
    "click",
    loadDemoData
);

clearButton.addEventListener(
    "click",
    clearData
);

detectButton.addEventListener(
    "click",
    detectArbitrage
);

if (validationButton) {
    validationButton.addEventListener("click", showValidationRules);
}

if (testSuiteButton) {
    testSuiteButton.addEventListener("click", toggleTestPanel);
}

getRateInputs().forEach((input) => {
    input.addEventListener(
        "input",
        () => {
            updateStatistics();
            resetResults();
            resetGraph();
            updateLiveValidation();
        }
    );
});

if (amountInput) {
    amountInput.addEventListener("input", () => {
        resetResults();
        resetGraph();
        updateLiveValidation();
    });
}

if (liveValidationButton) {
    liveValidationButton.addEventListener("click", toggleLiveValidation);
}


/* =========================================================
   INITIALIZATION
   ========================================================= */


const savedTheme =
    localStorage.getItem(
        "currencyArbitrageTheme"
    );

applyTheme(
    savedTheme === "light"
        ? "light"
        : "dark"
);

updateStatistics();
resetResults();
hideGraph();
updateLiveValidation();
