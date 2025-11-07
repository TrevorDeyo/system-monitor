// Default sorting state for the process table
let sortColumn = "cpu_percent";
let sortDirection = "desc";


// ---------------------------------------------------------
// Sorting Logic
// Toggles ascending/descending if the same column is clicked.
// Otherwise selects a new column to sort by.
// ---------------------------------------------------------
function sortBy(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortColumn = column;
    sortDirection = "desc";
  }
  updateSortArrows();
  refresh(); // re-fetch and update table
}


// ---------------------------------------------------------
// Update the visual arrow indicators in table headers
// ---------------------------------------------------------
function updateSortArrows() {
  document.querySelectorAll("th").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");

    const col = th.getAttribute("data-column");
    if (col === sortColumn) {
      th.classList.add(sortDirection === "asc" ? "sort-asc" : "sort-desc");
    }
  });
}


// ---------------------------------------------------------
// Fetch overall system statistics and update display
// ---------------------------------------------------------
async function fetchStats() {
  const res = await fetch("/stats");
  if (!res.ok) return; // safety check

  const data = await res.json();

  document.getElementById("stats").innerHTML = `
    <b>CPU:</b> ${data.cpu_percent}% &nbsp;
    <b>Memory:</b> ${data.memory_percent}% &nbsp;
    <b>Processes:</b> ${data.total_processes}
  `;

  // Keep chart data updated smoothly
  updateCharts(data.cpu_percent, data.memory_percent);
}


// ---------------------------------------------------------
// Fetch running processes and update the process table
// ---------------------------------------------------------
async function fetchProcesses() {
  const res = await fetch(`/processes?sort_by=${sortColumn}`);
  if (!res.ok) return;

  let data = await res.json();

  // Apply sorting direction (ascending/descending)
  data.sort((a, b) => {
    const diff = a[sortColumn] - b[sortColumn];
    return sortDirection === "asc" ? diff : -diff;
  });

  const tbody = document.querySelector("#process-table tbody");

  tbody.innerHTML = data.map(p => {
    // Visual emphasis on heavy CPU/memory usage
    const cpuClass = p.cpu_percent > 30 ? "cpu-high" : "";
    const memClass = p.memory_percent > 20 ? "memory-high" : "";

    return `
      <tr>
        <td>${p.pid}</td>
        <td>${p.name}</td>
        <td class="${cpuClass}">${p.cpu_percent}</td>
        <td class="${memClass}">${p.memory_percent}</td>
      </tr>
    `;
  }).join("");
}


// ---------------------------------------------------------
// Chart Setup and Update Logic
// ---------------------------------------------------------
const labels = [];
const cpuData = [];
const memData = [];

const chart = new Chart(document.getElementById("chart"), {
  type: "line",
  data: {
    labels,
    datasets: [
      { label: "CPU %", data: cpuData, borderWidth: 2, tension: 0.4, cubicInterpolationMode: "monotone", fill: false },
      { label: "Memory %", data: memData, borderWidth: 2, tension: 0.4, cubicInterpolationMode: "monotone", fill: false }
    ]
  },
  options: {
    animation: { duration: 600, easing: "easeOutQuad" },
    scales: { y: { beginAtZero: true, max: 100 } }
  }
});

function updateCharts(cpu, mem) {
  const time = new Date().toLocaleTimeString();

  // Add new label
  labels.push(time);

  // Smooth transitions between points
  const lastCpu = cpuData.length ? cpuData[cpuData.length - 1] : cpu;
  const lastMem = memData.length ? memData[memData.length - 1] : mem;

  const cpuSmooth = lastCpu * 0.6 + cpu * 0.4;
  const memSmooth = lastMem * 0.6 + mem * 0.4;

  cpuData.push(cpuSmooth);
  memData.push(memSmooth);

  // Limit history length
  if (labels.length > 30) {
    labels.shift();
    cpuData.shift();
    memData.shift();
  }

  chart.update();
}



// ---------------------------------------------------------
// Refresh both process table & stats display
// ---------------------------------------------------------
function refresh() {
  fetchStats();
  fetchProcesses();
}


// Refresh every second
setInterval(refresh, 1000);
refresh();
