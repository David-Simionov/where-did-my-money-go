// ============ ЛИМИТИ ============
const MAX_AMOUNT = 1000000;

// ============ КАТЕГОРИИ ============
const CATEGORIES = [
    { name: 'Food',          icon: '🍔', color: '#6366f1' },
    { name: 'Transport',     icon: '🚗', color: '#10b981' },
    { name: 'Groceries',     icon: '🛒', color: '#84cc16' },
    { name: 'Housing',       icon: '🏠', color: '#0ea5e9' },
    { name: 'Shopping',      icon: '🛍', color: '#f59e0b' },
    { name: 'Entertainment', icon: '🎮', color: '#ec4899' },
    { name: 'Subscriptions', icon: '📱', color: '#06b6d4' },
    { name: 'Health',        icon: '💊', color: '#ef4444' },
    { name: 'Education',     icon: '🎓', color: '#8b5cf6' },
    { name: 'Travel',        icon: '✈️', color: '#14b8a6' },
    { name: 'Cash',          icon: '💵', color: '#64748b' },
    { name: 'Other',         icon: '💰', color: '#94a3b8' }
];

// ============ ПОДАТОЦИ ============
const data = {
    income: 0,
    categories: [],
    spent: 0
};

// ============ ДАТУМИ ============
function toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function monthKey(d) {
    return toISODate(d).slice(0, 7); // "2026-09"
}

function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ============ ЗАЧУВУВАЊЕ НА ТРОШОЦИ ============
function loadExpenses() {
    const saved = localStorage.getItem('expenses');
    if (saved === null) return [];
    try {
        return JSON.parse(saved);
    } catch {
        return [];
    }
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

const expenses = loadExpenses();
saveExpenses();

// ============ ПРЕСМЕТКИ ============
function recalcData() {
    data.income = incomeFor(monthKey(new Date()));
    const now = new Date();
    const thisMonth = monthKey(now);
    const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    data.categories = CATEGORIES
        .map(cat => {
            const inCat = expenses.filter(e => e.category === cat.name);
            const sumFor = key => {
                const sum = inCat
                    .filter(e => e.date.startsWith(key))
                    .reduce((s, e) => s + e.amount, 0);
                return Math.round(sum * 100) / 100;
            };
            return { ...cat, amount: sumFor(thisMonth), previous: sumFor(lastMonth) };
        })
        .filter(c => c.amount > 0)
        .sort((a, b) => b.amount - a.amount);

    data.spent = Math.round(data.categories.reduce((s, c) => s + c.amount, 0) * 100) / 100;
}

function refresh(focusCategory) {
    recalcData();

    if (focusCategory) {
        const i = data.categories.findIndex(c => c.name === focusCategory);
        if (i !== -1) selectedIndex = i;
    }

    renderDashboard();
    renderBreakdown();
    renderContext();
    renderTransactions();
    renderBudget();
    renderInsights();
    renderAnalytics();
    renderReview();
    renderAfford();
    renderHighlights();
    renderWhy();
    if (typeof renderQuickRepeat === 'function') renderQuickRepeat();
}

// ============ ПОМОШНИ ФУНКЦИИ ============
function formatMoney(amount) {
    const sym = currencySymbol();
    return (amount < 0 ? '-' : '') +
        sym + (sym.length > 1 ? ' ' : '') +
        Math.abs(amount).toLocaleString(locale(), {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
}

function getGreeting() {
    const hour = new Date().getHours();
    const part = hour < 12 ? t('Good morning') : hour < 18 ? t('Good afternoon') : t('Good evening');
    return settings.name ? `${part}, ${settings.name} 👋` : `${part} 👋`;
}

function fitText(el, text, basePx) {
    el.textContent = text;
    const len = text.length;
    const scale = len <= 9 ? 1 : len <= 11 ? 0.8 : len <= 13 ? 0.65 : 0.52;
    el.style.fontSize = Math.round(basePx * scale) + 'px';
}

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function dayLabel(iso) {
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    if (iso === toISODate(today)) return t('Today');
    if (iso === toISODate(yesterday)) return t('Yesterday');
    return new Date(iso + 'T00:00:00').toLocaleDateString(locale(), {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

const MIN_COMPARE_DAYS = 5;

function signed(n) {
    return (n > 0 ? '+' : n < 0 ? '−' : '') + formatMoney(Math.abs(n));
}

function comparePeriod() {
    const now = new Date();
    const day = now.getDate();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevDay = Math.min(day, new Date(now.getFullYear(), now.getMonth(), 0).getDate());
    const curKey = monthKey(now);
    const prevKey = monthKey(prevDate);

    const cur = {}, prev = {};
    expenses.forEach(e => {
        const d = Number(e.date.slice(8, 10));
        if (e.date.startsWith(curKey) && d <= day) cur[e.category] = (cur[e.category] || 0) + e.amount;
        else if (e.date.startsWith(prevKey) && d <= prevDay) prev[e.category] = (prev[e.category] || 0) + e.amount;
    });

    const round = n => Math.round(n * 100) / 100;
    const names = [...new Set([...Object.keys(cur), ...Object.keys(prev)])];
    const rows = names.map(name => ({
        name,
        cur: round(cur[name] || 0),
        prev: round(prev[name] || 0),
        diff: round((cur[name] || 0) - (prev[name] || 0))
    }));

    const curTotal = round(rows.reduce((s, r) => s + r.cur, 0));
    const prevTotal = round(rows.reduce((s, r) => s + r.prev, 0));

    return {
        day, prevDay,
        prevMonth: getMonthName(prevDate),
        rows, curTotal, prevTotal,
        diff: round(curTotal - prevTotal)
    };
}

// ============ АНИМАЦИИ ============
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lastShown = {};
const runs = {};

function animateNumber(key, to, apply) {
    const from = lastShown[key] ?? 0;
    lastShown[key] = to;

    if (from === to || reduceMotion) {
        apply(to);
        return;
    }

    const id = (runs[key] = (runs[key] || 0) + 1);
    const start = performance.now();
    const duration = 700;

    apply(from);

    function tick(now) {
        if (runs[key] !== id) return;   // стартувана е понова анимација
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        apply(from + (to - from) * eased);
        if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// ============ TOAST ============
let toastTimer;

function showToast(message, actionLabel, onAction) {
    const toast = document.getElementById('toast');
    toast.textContent = message;

    if (actionLabel) {
        const btn = document.createElement('button');
        btn.className = 'toast__action';
        btn.textContent = actionLabel;
        btn.addEventListener('click', () => {
            onAction();
            toast.classList.remove('toast--show');
        });
        toast.append(btn);
    }

    toast.classList.add('toast--show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('toast--show'), actionLabel ? 5000 : 2200);
}
