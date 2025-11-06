let sortColumn = "cpu_percent";
let sortDirection = "desc";

function sortBy(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortColumn = column;
    sortDirection = "desc";
  }
  updateSortArrows();
  refresh(); // re-fetch & re-render table
}

function updateSortArrows() {
  document.querySelectorAll("th").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.getAttribute("data-column") === sortColumn) {
      th.classList.add(sortDirection === "asc" ? "sort-asc" : "sort-desc");
    }
  });
}

const cpuData = [];
const memData = [];
const labels = [];

// Create chart
const ctx = document.createElement('canvas');
document.body.insertBefore(ctx, document.getElementById('process-table'));

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels,
    datasets: [
      { 
        label: 'CPU %', 
        data: cpuData, 
        borderColor: 'rgb(255,99,132)',
        tension: 0.4,            // <-- smooth line curve
        fill: false
      },
      { 
        label: 'Memory %', 
        data: memData, 
        borderColor: 'rgb(54,162,235)',
        tension: 0.4,            // <-- smooth line curve
        fill: false
      }
    ]
  },
  options: {
    animation: {
      duration: 600,            // <-- smooth transition timing
      easing: 'easeOutQuad'     // <-- smooth easing curve
    },
    scales: { 
      y: { min: 0, max: 100, ticks: { color: '#aaa' } },
      x: { ticks: { color: '#aaa' } }
    },
    plugins: { 
      legend: { labels: { color: '#ddd' } }
    }
  }
});


async function fetchStats() {
  const res = await fetch("/stats");
  if (!res.ok) return; // safeguard
  const data = await res.json();

  // update text
  document.getElementById("stats").innerHTML = `
    <b>CPU:</b> ${data.cpu_percent}% &nbsp;
    <b>Memory:</b> ${data.memory_percent}% &nbsp;
    <b>Processes:</b> ${data.total_processes}
  `;

  // push new data points
  const label = new Date().toLocaleTimeString();
  cpuData.push(data.cpu_percent);
  memData.push(data.memory_percent);
  labels.push(label);

  // keep last 30 samples
  if (cpuData.length > 30) {
    cpuData.shift(); memData.shift(); labels.shift();
  }

  chart.update('active');
}

async function fetchProcesses() {
  const res = await fetch("/processes?limit=10&sort_by=cpu");
  if (!res.ok) return;
  const data = await res.json();

  data.sort((a, b) => {
    const valA = a[sortColumn];
    const valB = b[sortColumn];
    return sortDirection === "asc" ? valA - valB : valB - valA;
  });

  const tbody = document.querySelector("#process-table tbody");
  tbody.innerHTML = data.map(
    p => `<tr>
      <td>${p.pid}</td>
      <td>${p.name}</td>
      <td>${p.cpu_percent}</td>
      <td>${p.memory_percent}</td>
    </tr>`
  ).join("");
}

function refresh() {
  fetchStats();
  fetchProcesses();
}

// ⏱️ Update every 2 seconds
setInterval(refresh, 2000);
refresh();
