// ===== Currencies =====
const CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'USD ($)'  },
  { code: 'EUR', symbol: '\u20ac', label: 'EUR (\u20ac)' },
  { code: 'GBP', symbol: '\u00a3', label: 'GBP (\u00a3)' },
  { code: 'IDR', symbol: 'Rp', label: 'IDR (Rp)' },
  { code: 'JPY', symbol: '\u00a5', label: 'JPY (\u00a5)' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$)' },
];

// ===== Built-in categories =====
const BUILTIN_CATEGORIES = ['Food', 'Transport', 'Fun'];

// Palette for custom categories (cycles if more than palette length)
const CUSTOM_PALETTE = [
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#06b6d4', '#a855f7', '#84cc16', '#ef4444',
];

// Fixed colors for built-ins
const BUILTIN_COLORS = {
  Food:      '#10b981',
  Transport: '#3b82f6',
  Fun:       '#f59e0b',
};

// ===== State =====
let transactions    = JSON.parse(localStorage.getItem('txs')            || '[]');
let customCategories = JSON.parse(localStorage.getItem('customCats')    || '[]');
let spendLimit      = parseFloat(localStorage.getItem('spendLimit')     || '0');
let currency        = localStorage.getItem('currency')                  || 'USD';
let chart           = null;

// ===== DOM Refs =====
const totalBalanceEl    = document.getElementById('totalBalance');
const txCountEl         = document.getElementById('txCount');
const spendLimitEl      = document.getElementById('spendLimit');
const txListEl          = document.getElementById('txList');
const emptyStateEl      = document.getElementById('emptyState');
const noChartDataEl     = document.getElementById('noChartData');
const txForm            = document.getElementById('txForm');
const itemNameEl        = document.getElementById('itemName');
const amountEl          = document.getElementById('amount');
const categoryEl        = document.getElementById('category');
const txDateEl          = document.getElementById('txDate');
const sortByEl          = document.getElementById('sortBy');
const summaryTypeEl     = document.getElementById('summaryType');
const summaryPeriodEl   = document.getElementById('summaryPeriod');
const summaryTotalEl    = document.getElementById('summaryTotal');
const limitInputEl      = document.getElementById('limitInput');
const setLimitBtn       = document.getElementById('setLimitBtn');
const themeToggleBtn    = document.getElementById('themeToggle');
const currencySelectEl  = document.getElementById('currencySelect');
const exportBtn         = document.getElementById('exportBtn');
const reportNameEl      = document.getElementById('reportName');
const categoryListEl    = document.getElementById('categoryList');
const newCategoryInput  = document.getElementById('newCategoryInput');
const addCategoryBtn    = document.getElementById('addCategoryBtn');
const categoryAddError  = document.getElementById('categoryAddError');
const balanceMoodEl     = document.getElementById('balanceMood');

// ===== Category helpers =====
function allCategories() {
  return [...BUILTIN_CATEGORIES, ...customCategories];
}

function categoryColor(name) {
  if (BUILTIN_COLORS[name]) return BUILTIN_COLORS[name];
  const idx = customCategories.indexOf(name);
  return CUSTOM_PALETTE[idx % CUSTOM_PALETTE.length] || '#9ca3af';
}

function saveCustomCategories() {
  localStorage.setItem('customCats', JSON.stringify(customCategories));
}

// ===== Render category select (form dropdown) =====
function renderCategorySelect() {
  const current = categoryEl.value;
  categoryEl.innerHTML = '<option value="">-- Select --</option>' +
    allCategories().map(c =>
      `<option value="${escapeHtml(c)}"${c === current ? ' selected' : ''}>${escapeHtml(c)}</option>`
    ).join('');
}

// ===== Render category manager list =====
function renderCategoryManager() {
  categoryListEl.innerHTML = '';

  allCategories().forEach(name => {
    const isBuiltin = BUILTIN_CATEGORIES.includes(name);
    const color = categoryColor(name);
    const li = document.createElement('li');
    li.className = 'cat-manage-item';
    li.innerHTML = `
      <span class="cat-manage-dot" style="background:${color}"></span>
      <span class="cat-manage-name">${escapeHtml(name)}</span>
      ${isBuiltin
        ? '<span class="cat-manage-builtin">built-in</span>'
        : `<button class="cat-manage-delete" data-cat="${escapeHtml(name)}" aria-label="Delete category">✕</button>`
      }
    `;
    categoryListEl.appendChild(li);
  });
}

// ===== Add custom category =====
addCategoryBtn.addEventListener('click', () => {
  const val = newCategoryInput.value.trim();
  categoryAddError.textContent = '';

  if (!val) {
    categoryAddError.textContent = 'Enter a category name.';
    return;
  }
  if (allCategories().map(c => c.toLowerCase()).includes(val.toLowerCase())) {
    categoryAddError.textContent = 'Category already exists.';
    return;
  }

  customCategories.push(val);
  saveCustomCategories();
  newCategoryInput.value = '';
  renderCategoryManager();
  renderCategorySelect();
});

newCategoryInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); addCategoryBtn.click(); }
});

// ===== Delete custom category =====
categoryListEl.addEventListener('click', e => {
  const btn = e.target.closest('.cat-manage-delete');
  if (!btn) return;
  const name = btn.dataset.cat;
  customCategories = customCategories.filter(c => c !== name);
  saveCustomCategories();
  renderCategoryManager();
  renderCategorySelect();
  // Re-render list so badges still show (they fall back gracefully)
  renderList();
  renderChart();
});

// ===== Init =====
function init() {
  txDateEl.value = new Date().toISOString().split('T')[0];

  // Theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggleBtn.textContent = savedTheme === 'dark' ? '\u2600\ufe0f' : '\ud83c\udf19';

  // Spend limit
  if (spendLimit > 0) limitInputEl.value = spendLimit;

  // Currency select
  currencySelectEl.innerHTML = CURRENCIES.map(c =>
    `<option value="${c.code}"${c.code === currency ? ' selected' : ''}>${c.label}</option>`
  ).join('');

  renderCategoryManager();
  renderCategorySelect();
  populateSummaryPeriods();
  render();
}

// ===== Persist transactions =====
function save() {
  localStorage.setItem('txs', JSON.stringify(transactions));
}

// ===== Render =====
function render() {
  renderBalance();
  renderList();
  renderChart();
  renderSummary();
}

function renderBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  totalBalanceEl.textContent = formatCurrency(total);
  txCountEl.textContent = transactions.length + ' transaction' + (transactions.length !== 1 ? 's' : '');
  spendLimitEl.classList.toggle('hidden', !(spendLimit > 0 && total > spendLimit));
  balanceMoodEl.textContent = getSpendingMood(total);
}

function getSpendingMood(total) {
  if (spendLimit <= 0) return '';
  const pct = (total / spendLimit) * 100;
  if (pct <= 25)        return 'Get some coffee and castengel please!. Love yourself!';
  if (pct <= 50)        return 'You might forget to buy something!';
  if (pct <= 75)        return 'Wise spending and saving!';
  if (pct <= 90)        return 'You saved little smile for tomorrow!';
  if (pct <= 100)       return "It's okay to reach your budget limit";
  if (pct <= 120)       return "Don't overthink the overbudget, it may important purchase for you";
  return 'whoaa, be wise, that\'s overbudget';
}

function renderList() {
  const sorted = getSorted([...transactions]);

  if (sorted.length === 0) {
    txListEl.innerHTML = '';
    txListEl.appendChild(emptyStateEl);
    emptyStateEl.style.display = '';
    return;
  }

  emptyStateEl.style.display = 'none';
  txListEl.innerHTML = '';

  sorted.forEach(tx => {
    const color = categoryColor(tx.category);
    const li = document.createElement('li');
    li.className = 'tx-item' + (spendLimit > 0 && tx.amount > spendLimit ? ' over-limit' : '');
    li.innerHTML =
      '<div class="tx-info">' +
        '<div class="tx-name">' + escapeHtml(tx.name) + '</div>' +
        '<div class="tx-meta">' +
          '<span class="cat-badge" style="background:' + color + '22;color:' + color + '">' + escapeHtml(tx.category) + '</span>' +
          '&nbsp;' + (tx.date || '') +
        '</div>' +
      '</div>' +
      '<span class="tx-amount">-' + formatCurrency(tx.amount) + '</span>' +
      '<button class="tx-delete" data-id="' + tx.id + '" aria-label="Delete transaction">\ud83d\uddd1</button>';
    txListEl.appendChild(li);
  });
}

function renderChart() {
  const totals = {};
  transactions.forEach(tx => {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  });

  const labels = Object.keys(totals);
  const data   = Object.values(totals);

  if (labels.length === 0) {
    noChartDataEl.style.display = '';
    if (chart) { chart.destroy(); chart = null; }
    return;
  }

  noChartDataEl.style.display = 'none';
  const colors    = labels.map(l => categoryColor(l));
  const ctx       = document.getElementById('spendingChart').getContext('2d');
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.options.plugins.legend.labels.color = textColor;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: 'transparent' }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, padding: 14, font: { size: 13 } }
          },
          tooltip: {
            callbacks: {
              label: function(ctx) { return ' ' + ctx.label + ': ' + formatCurrency(ctx.parsed); }
            }
          }
        },
        cutout: '60%'
      }
    });
  }
}

function renderSummary() {
  const type   = summaryTypeEl.value;
  const period = summaryPeriodEl.value;
  if (!period) { summaryTotalEl.textContent = formatCurrency(0); return; }

  const total = transactions
    .filter(tx => {
      if (!tx.date) return false;
      return type === 'monthly'
        ? tx.date.slice(0, 7) === period
        : tx.date.slice(0, 4) === period;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  summaryTotalEl.textContent = formatCurrency(total);
}

function populateSummaryPeriods() {
  const type    = summaryTypeEl.value;
  const periods = new Set();

  transactions.forEach(tx => {
    if (!tx.date) return;
    periods.add(type === 'monthly' ? tx.date.slice(0, 7) : tx.date.slice(0, 4));
  });

  const now = new Date().toISOString();
  periods.add(type === 'monthly' ? now.slice(0, 7) : now.slice(0, 4));

  const current = summaryPeriodEl.value;
  summaryPeriodEl.innerHTML = [...periods].sort().reverse()
    .map(p => '<option value="' + p + '"' + (p === current ? ' selected' : '') + '>' + formatPeriod(p, type) + '</option>')
    .join('');

  renderSummary();
}

// ===== Sorting =====
function getSorted(list) {
  const key = sortByEl.value;
  return list.sort(function(a, b) {
    if (key === 'amount-desc') return b.amount - a.amount;
    if (key === 'amount-asc')  return a.amount - b.amount;
    if (key === 'category')    return a.category.localeCompare(b.category);
    if (key === 'date-asc')    return (a.date || '').localeCompare(b.date || '');
    return (b.date || '').localeCompare(a.date || '');
  });
}

// ===== Form Submit =====
txForm.addEventListener('submit', function(e) {
  e.preventDefault();
  if (!validateForm()) return;

  transactions.unshift({
    id:       Date.now().toString(),
    name:     itemNameEl.value.trim(),
    amount:   parseFloat(amountEl.value),
    category: categoryEl.value,
    date:     txDateEl.value,
  });

  save();
  populateSummaryPeriods();
  render();
  txForm.reset();
  renderCategorySelect(); // restore placeholder after reset
  txDateEl.value = new Date().toISOString().split('T')[0];
});

function validateForm() {
  let valid = true;
  const nameErr     = document.getElementById('nameError');
  const amountErr   = document.getElementById('amountError');
  const categoryErr = document.getElementById('categoryError');
  nameErr.textContent = amountErr.textContent = categoryErr.textContent = '';

  if (!itemNameEl.value.trim()) {
    nameErr.textContent = 'Item name is required.'; valid = false;
  }
  if (!amountEl.value || parseFloat(amountEl.value) <= 0) {
    amountErr.textContent = 'Enter a valid amount.'; valid = false;
  }
  if (!categoryEl.value) {
    categoryErr.textContent = 'Please select a category.'; valid = false;
  }
  return valid;
}

// ===== Delete transaction =====
txListEl.addEventListener('click', function(e) {
  const btn = e.target.closest('.tx-delete');
  if (!btn) return;
  transactions = transactions.filter(function(tx) { return tx.id !== btn.dataset.id; });
  save();
  populateSummaryPeriods();
  render();
});

// ===== Sort =====
sortByEl.addEventListener('change', function() { renderList(); });

// ===== Summary =====
summaryTypeEl.addEventListener('change', function() { populateSummaryPeriods(); });
summaryPeriodEl.addEventListener('change', function() { renderSummary(); });

// ===== Spend Limit =====
setLimitBtn.addEventListener('click', function() {
  const val = parseFloat(limitInputEl.value);
  spendLimit = isNaN(val) || val <= 0 ? 0 : val;
  localStorage.setItem('spendLimit', spendLimit);
  render();
});

// ===== Currency =====
currencySelectEl.addEventListener('change', function() {
  currency = currencySelectEl.value;
  localStorage.setItem('currency', currency);
  if (chart) { chart.destroy(); chart = null; }
  render();
});

// ===== Theme Toggle =====
themeToggleBtn.addEventListener('click', function() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  themeToggleBtn.textContent = next === 'dark' ? '\u2600\ufe0f' : '\ud83c\udf19';
  if (chart) { chart.destroy(); chart = null; }
  renderChart();
});

// ===== Export as Infographic =====
exportBtn.addEventListener('click', async function() {
  if (typeof html2canvas === 'undefined') {
    alert('Export library not loaded. Check your internet connection.');
    return;
  }
  exportBtn.textContent = '\u23f3 Generating...';
  exportBtn.disabled = true;
  try {
    const target = document.querySelector('.app-container');
    const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: null });
    const link   = document.createElement('a');
    const name   = reportNameEl.value.trim() || 'budget-report';
    link.download = name.replace(/\s+/g, '-').toLowerCase() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    alert('Export failed: ' + err.message);
  } finally {
    exportBtn.textContent = '\ud83d\udcf8 Export as Infographic';
    exportBtn.disabled = false;
  }
});

// ===== Helpers =====
function formatCurrency(n) {
  const c = CURRENCIES.find(function(x) { return x.code === currency; }) || CURRENCIES[0];
  const noDecimal = currency === 'JPY' || currency === 'IDR';
  const formatted = noDecimal
    ? Math.round(n).toLocaleString()
    : n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return c.symbol + formatted;
}

function formatPeriod(p, type) {
  if (type === 'yearly') return p;
  const parts = p.split('-');
  return new Date(parts[0], parts[1] - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// ===== Start =====
init();
