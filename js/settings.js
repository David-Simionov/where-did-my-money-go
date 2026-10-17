// ============ SETTINGS ============
const CURRENCIES = { EUR: '€', USD: '$', GBP: '£', MKD: 'ден' };

// пред да се направи ништо: дали корисникот е нов?
const isFirstRun = localStorage.getItem('settings') === null;

function loadSettings() {
    const fallback = { name: '', income: 0, currency: 'EUR', language: detectLanguage() };
    try {
        return { ...fallback, ...JSON.parse(localStorage.getItem('settings')) };
    } catch {
        return fallback;
    }
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

const settings = loadSettings();
setLanguage(settings.language);

function currencySymbol() {
    return CURRENCIES[settings.currency] || '€';
}

// симболот во полињата за износ (€ / $ / £ / ден)
function applyCurrencySymbols(sym = currencySymbol(), root = document) {
    root.querySelectorAll('.money-input').forEach(box => {
        box.querySelector('.money-input__symbol').textContent = sym;
        box.querySelector('.input').style.paddingLeft = sym.length > 1 ? '64px' : '36px';
    });
}

function renderProfile() {
    document.getElementById('openSettings').textContent =
        settings.name ? settings.name.charAt(0).toUpperCase() : '👤';
}

// ---- форма ----
const settingsModal = document.getElementById('settingsModal');
const settingsForm = document.getElementById('settingsForm');

function openSettingsModal() {
    document.getElementById('settingsName').value = settings.name;
    document.getElementById('settingsIncome').value = settings.income || '';
    document.getElementById('settingsCurrency').value = settings.currency;
    document.getElementById('settingsLanguage').value = settings.language;
    applyCurrencySymbols();
    settingsModal.classList.add('modal--open');
}

function closeSettingsModal() {
    settingsModal.classList.remove('modal--open');
}

// симболот во "Monthly income" се менува веднаш кога ќе избереш валута
document.getElementById('settingsCurrency').addEventListener('change', (e) => {
    applyCurrencySymbols(CURRENCIES[e.target.value], settingsForm);
});

document.getElementById('openSettings').addEventListener('click', openSettingsModal);
document.getElementById('closeSettings').addEventListener('click', closeSettingsModal);
document.getElementById('settingsBackdrop').addEventListener('click', closeSettingsModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSettingsModal();
});

settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();

    settings.name = document.getElementById('settingsName').value.trim();
    settings.income = parseFloat(document.getElementById('settingsIncome').value) || 0;
    settings.currency = document.getElementById('settingsCurrency').value;
    settings.language = document.getElementById('settingsLanguage').value;

    saveSettings();
    applyCurrencySymbols();
    closeSettingsModal();

    // валутата и јазикот се користат насекаде, па прецртуваме сè
    applyLanguage();
});

// ---- Export CSV ----
function csvCell(value) {
    let text = String(value);
    // Excel извршува формули што почнуваат со = + - @ (CSV injection), па ги "неутрализираме"
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
}

function exportCSV() {
    const header = ['Date', 'Amount', 'Category', 'Description', 'Payment'];
    const rows = [...expenses]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(e => [e.date, e.amount.toFixed(2), e.category, e.description, e.payment]);

    const csv = [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n');

    // \ufeff (BOM) за да ја препознае Excel кирилицата
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${toISODate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

document.getElementById('exportCsv').addEventListener('click', () => {
    if (expenses.length === 0) {
        alert(t('Nothing to export yet.'));
        return;
    }
    exportCSV();
});

// ---- Delete all data ----
document.getElementById('deleteAll').addEventListener('click', () => {
    if (confirm(t('Delete ALL your data? This cannot be undone.'))) {
        localStorage.clear();
        location.reload();
    }
});

// ============ ТЕМА (light / dark) ============
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
    document.querySelector('meta[name="theme-color"]')
        .setAttribute('content', theme === 'dark' ? '#0d0f16' : '#f5f6fa');
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
});
