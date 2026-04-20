/**
 * Loads /api/weekly and renders Chart.js visuals plus a short written summary.
 */

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatDuration(sec) {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearError() {
  const el = document.getElementById('error');
  el.textContent = '';
  el.classList.add('hidden');
}

let pieChart;
let barChart;

async function loadWeekly(userId) {
  clearError();
  const res = await fetch(`/api/weekly?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

function renderReport(data) {
  document.getElementById('content').classList.remove('hidden');

  const { totals, productiveRatio, breakdown, topHosts, generatedAt } = data;
  const totalSec = totals.productive + totals.unproductive + totals.neutral;
  const pct = Math.round(productiveRatio * 100);

  document.getElementById('kpiRatio').textContent = `${pct}% productive`;
  document.getElementById('kpiSub').textContent =
    totalSec > 0
      ? `Of ${formatDuration(totalSec)} recorded this week, ${formatDuration(totals.productive)} was classified as productive time.`
      : 'No data yet — browse with the extension and sync.';

  const pieCtx = document.getElementById('pie');
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['Productive', 'Neutral', 'Unproductive'],
      datasets: [
        {
          data: [totals.productive, totals.neutral, totals.unproductive],
          backgroundColor: ['#66bb6a', '#ffb74d', '#ef5350'],
        },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: '#e8eef7' } } },
    },
  });

  const days = Object.keys(breakdown).sort();
  const prod = days.map((d) => breakdown[d].productive || 0);
  const neu = days.map((d) => breakdown[d].neutral || 0);
  const unpr = days.map((d) => breakdown[d].unproductive || 0);

  const barCtx = document.getElementById('bar');
  if (barChart) barChart.destroy();
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        { label: 'Productive', data: prod, backgroundColor: '#66bb6a' },
        { label: 'Neutral', data: neu, backgroundColor: '#ffb74d' },
        { label: 'Unproductive', data: unpr, backgroundColor: '#ef5350' },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { stacked: true, ticks: { color: '#9aa7bd' }, grid: { color: '#243044' } },
        y: { stacked: true, ticks: { color: '#9aa7bd' }, grid: { color: '#243044' } },
      },
      plugins: { legend: { labels: { color: '#e8eef7' } } },
    },
  });

  const tbody = document.querySelector('#hosts tbody');
  tbody.innerHTML = '';
  topHosts.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${row.hostname}</td><td class="num">${formatDuration(row.seconds)}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById('generated').textContent = `Report generated: ${new Date(generatedAt).toLocaleString()}`;
}

async function bootstrap() {
  const input = document.getElementById('userId');
  const fromQuery = qs('userId');
  if (fromQuery) input.value = fromQuery;

  document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = input.value.trim();
    if (!userId) {
      showError('Enter your user id from the extension options page.');
      return;
    }
    try {
      const data = await loadWeekly(userId);
      renderReport(data);
    } catch (err) {
      showError(err.message || String(err));
      document.getElementById('content').classList.add('hidden');
    }
  });

  if (fromQuery) {
    try {
      const data = await loadWeekly(fromQuery);
      renderReport(data);
    } catch (err) {
      showError(err.message || String(err));
    }
  }
}

bootstrap();
