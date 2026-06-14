const $ = id => document.getElementById(id);
const range = n => [...Array(n)];
const key = state => state.join(",");
const value = id => +$(id).value;

const PIN_MIN = 1;
const PIN_MAX = 7;
const TARGET = 4;
const MAX_SECTIONS = 10;

function sectionCount() {
    return Math.max(1, Math.min(MAX_SECTIONS, value("n") || 1));
}

function build() {
    const n = sectionCount();
    $("n").value = n;

    $("states").innerHTML = `
        <h2>Start</h2>
        <table>
            <tr>${range(n).map((_, i) => `<th>${i + 1}</th>`).join("")}</tr>
            <tr>${range(n).map((_, i) => `<td><input id="s${i}" value="1"></td>`).join("")}</tr>
        </table>
    `;

    $("matrix").innerHTML = `
        <h2>Influence</h2>
        <p>Rows: section you turn. Columns: section that moves.</p>
        <table>
            <tr>
                <th>turn \\ moves</th>
                ${range(n).map((_, i) => `<th>${i + 1}</th>`).join("")}
            </tr>
            ${range(n).map((_, row) => `
                <tr>
                    <th>${row + 1}</th>
                    ${range(n).map((_, col) => influenceCell(row, col)).join("")}
                </tr>
            `).join("")}
        </table>
    `;

    $("out").textContent = "";
}

function influenceCell(row, col) {
    if (row === col) {
        return `<td><select disabled><option>same</option></select></td>`;
    }

    return `
        <td>
            <select id="m${row}_${col}">
                <option value="0">nothing</option>
                <option value="1">same</option>
                <option value="-1">opposite</option>
            </select>
        </td>
    `;
}

function readStart(n) {
    return range(n).map((_, i) => value("s" + i));
}

function readMoves(n) {
    return range(n).map((_, row) =>
        range(n).map((_, col) =>
            row === col ? 1 : value(`m${row}_${col}`)
        )
    );
}

function applyMove(state, move, direction) {
    const next = state.map((x, i) => x + move[i] * direction);

    if (next.some(x => x < PIN_MIN || x > PIN_MAX)) {
        return null;
    }

    return next;
}

function solve() {
    const n = sectionCount();
    const start = readStart(n);
    const goal = Array(n).fill(TARGET);
    const moves = readMoves(n);

    const startKey = key(start);
    const goalKey = key(goal);

    const queue = [start];
    const seen = new Set([startKey]);
    const previous = {};
    const action = {};

    for (let i = 0; i < queue.length && !seen.has(goalKey); i++) {
        const state = queue[i];
        const stateKey = key(state);

        for (let section = 0; section < n; section++) {
            for (const direction of [1, -1]) {
                const next = applyMove(state, moves[section], direction);
                if (!next) continue;

                const nextKey = key(next);
                if (seen.has(nextKey)) continue;

                seen.add(nextKey);
                previous[nextKey] = stateKey;
                action[nextKey] = `${section + 1} ${direction > 0 ? "left" : "right"}`;
                queue.push(next);
            }
        }
    }

    if (!seen.has(goalKey)) {
        $("out").textContent = "No solution";
        return;
    }

    const path = [];
    for (let k = goalKey; k !== startKey; k = previous[k]) {
        path.push(action[k]);
    }

    path.reverse();

    const compact = [];
    for (const step of path) {
        const last = compact[compact.length - 1];

        if (last && last.step === step) {
            last.count++;
        } else {
            compact.push({ step, count: 1 });
        }
    }

    $("out").textContent =
        compact.map((x, i) =>
            `${i + 1}. ${x.step}${x.count > 1 ? " x" + x.count : ""}`
        ).join("\n") || "Already solved";
}

build();