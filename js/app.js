// ============ ЛИМИТИ ============
const MAX_AMOUNT = 1000000;   // најголем дозволен износ

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
    { name: 'Other',         icon: '💰', color: '#94a3b8' }
];

// ============ ПОДАТОЦИ ============
// data се пресметува од листата expenses (ништо не се пишува рачно)
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
    data.income = settings.income;
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

// ============ АНИМАЦИИ ============
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lastShown = {};   // последната прикажана вредност по клуч
const runs = {};        // кој "број" е последен, за да не се тепаат две анимации

// го "брои" износот од претходната до новата вредност
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

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('toast--show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('toast--show'), 2200);
}

// ============ DASHBOARD ============
function renderDashboard() {
    const remaining = data.income - data.spent;
    const percent = data.income > 0 ? Math.round((data.spent / data.income) * 100) : 0;

    document.getElementById('greeting').textContent = getGreeting();
    document.getElementById('monthLabel').textContent = monthTitle(new Date());

    const remainingEl = document.getElementById('remaining');
    fitText(remainingEl, formatMoney(remaining), 44);   // големината се одредува од крајниот износ
    animateNumber('remaining', remaining, v => { remainingEl.textContent = formatMoney(v); });
    animateNumber('income', data.income, v => {
        document.getElementById('income').textContent = formatMoney(v);
    });
    animateNumber('spent', data.spent, v => {
        document.getElementById('spent').textContent = formatMoney(v);
    });
    document.getElementById('progressPercent').textContent = percent + '%';
    document.getElementById('progressBar').style.width = Math.min(100, percent) + '%';
    document.getElementById('remaining').classList.toggle('text-spent', remaining < 0);
    renderProfile();
}

// колку е подолг износот, толку е помал фонтот, за да собере во кругот
function setDonutTotal(amount) {
    const el = document.getElementById('donutTotal');
    const len = formatMoney(amount).length;
    el.style.fontSize = len <= 8 ? '24px' : len <= 10 ? '20px' : len <= 12 ? '17px' : '14px';
    animateNumber('donutTotal', amount, v => { el.textContent = formatMoney(v); });
}

// ============ SPENDING BREAKDOWN ============
function renderBreakdown() {
    const total = data.spent;

    if (total === 0) {
        document.getElementById('donut').style.background = 'var(--primary-soft)';
        setDonutTotal(0);
        document.getElementById('legend').innerHTML = '';
        return;
    }

    let start = 0;

    // градиме conic-gradient: секоја категорија добива свој дел од кругот
    const stops = data.categories.map(c => {
        const end = start + (c.amount / total) * 100;
        const stop = `${c.color} ${start}% ${end}%`;
        start = end;
        return stop;
    });

    document.getElementById('donut').style.background =
        `conic-gradient(${stops.join(', ')})`;
    setDonutTotal(total);

    // легенда
    document.getElementById('legend').innerHTML = data.categories.map(c => {
        const percent = Math.round((c.amount / total) * 100);
        return `
            <li class="legend__item">
                <span class="legend__dot" style="background:${c.color}"></span>
                <span class="legend__name">${c.icon} ${t(c.name)}</span>
                <span class="legend__percent">${percent}%</span>
                <span class="legend__amount">${formatMoney(c.amount)}</span>
            </li>`;
    }).join('');
}

// ============ WHERE DID MY MONEY GO ============
let selectedIndex = 0;

function renderContext() {
    if (data.categories.length === 0) {
        document.getElementById('chips').innerHTML = '';
        document.getElementById('ctxHeadline').textContent = t('No expenses yet. Tap + to add your first one.');
        ['ctxPerDay', 'ctxIncomePct', 'ctxTrend'].forEach(id => {
            document.getElementById(id).textContent = '—';
        });
        document.getElementById('ctxTrend').className = 'context__value';
        document.getElementById('ctxTrendLabel').textContent = '';
        document.getElementById('ctxInsight').textContent = t('Add an expense and your insights will show up here.');
        return;
    }

    if (selectedIndex >= data.categories.length) selectedIndex = 0;
    const c = data.categories[selectedIndex];

    // chips
    document.getElementById('chips').innerHTML = data.categories.map((cat, i) => `
        <button class="chip ${i === selectedIndex ? 'chip--active' : ''}" data-index="${i}">
            ${cat.icon} ${t(cat.name)}
        </button>`).join('');

    // пресметки
    const daysPassed = new Date().getDate();
    const perDay = c.amount / daysPassed;
    const incomePct = data.income > 0 ? Math.round((c.amount / data.income) * 100) : null;
    const diff = c.amount - c.previous;
    const diffPct = c.previous ? Math.round((diff / c.previous) * 100) : 0;
    const isUp = diff > 0;

    const now = new Date();
    const prevMonth = getMonthName(new Date(now.getFullYear(), now.getMonth() - 1));
    const catLower = t(c.name).toLowerCase();

    // приказ
    document.getElementById('ctxHeadline').innerHTML =
        t('You spent {amount} on {cat}.', {
            amount: `<strong>${formatMoney(c.amount)}</strong>`,
            cat: catLower
        });
    document.getElementById('ctxPerDay').textContent = formatMoney(perDay);
    document.getElementById('ctxIncomePct').textContent = incomePct === null ? '—' : incomePct + '%';

    const trend = document.getElementById('ctxTrend');
    if (diff === 0) {
        trend.textContent = '—';
        trend.className = 'context__value';
    } else {
        trend.textContent = `${isUp ? '↑' : '↓'} ${Math.abs(diffPct)}%`;
        trend.className = 'context__value ' + (isUp ? 'trend--up' : 'trend--down');
    }
    document.getElementById('ctxTrendLabel').textContent = t('vs {month}', { month: prevMonth });

    // insight
    let insight;
    if (diff === 0) {
        insight = t('You spent the same on {cat} as in {month}.', { cat: catLower, month: prevMonth });
    } else {
        insight = t(isUp
                ? 'You spent {amount} more on {cat} this month than last month.'
                : 'You spent {amount} less on {cat} this month than last month.',
            { amount: formatMoney(Math.abs(diff)), cat: catLower });
    }
    document.getElementById('ctxInsight').textContent = insight;
}

// клик на chip (event delegation, се закачува само еднаш)
document.getElementById('chips').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    selectedIndex = Number(btn.dataset.index);
    renderContext();
});

// ============ ADD EXPENSE (modal) ============
const modal = document.getElementById('modal');
const form = document.getElementById('expenseForm');
const categorySelect = document.getElementById('categorySelect');

let editingId = null;   // null = додаваме ново, id = уредуваме постоечко

function openModal(expense) {
    form.reset();
    editingId = expense ? expense.id : null;

    document.getElementById('modalTitle').textContent = expense ? t('Edit Expense') : t('Add Expense');
    document.getElementById('submitBtn').textContent = expense ? t('Save Changes') : t('Add Expense');

    document.getElementById('expenseAmount').value = expense ? expense.amount : '';
    categorySelect.value = expense ? expense.category : CATEGORIES[0].name;
    document.getElementById('expenseDesc').value = expense ? expense.description : '';
    document.getElementById('expenseDate').value = expense ? expense.date : toISODate(new Date());
    form.elements.payment.value = expense ? expense.payment : 'Card';

    document.getElementById('expenseDate').max = toISODate(new Date());   // <-- ново
    modal.classList.add('modal--open');

    modal.classList.add('modal--open');
    document.getElementById('expenseAmount').focus();
}

function closeModal() {
    modal.classList.remove('modal--open');
}

document.getElementById('openModal').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('expenseAmount').value);
    if (!amount || amount <= 0 || amount > MAX_AMOUNT) return;

    const values = {
        amount: Math.round(amount * 100) / 100,
        category: categorySelect.value,
        description: document.getElementById('expenseDesc').value.trim(),
        date: document.getElementById('expenseDate').value,
        payment: form.elements.payment.value
    };

    if (!values.date || values.date > toISODate(new Date())) return;

    if (editingId) {
        Object.assign(expenses.find(x => x.id === editingId), values);
    } else {
        expenses.push({ id: newId(), ...values });
    }

    saveExpenses();
    closeModal();
    refresh(values.category);
    showToast(editingId ? t('Expense updated ✓') : t('Expense added ✓'));
});

// ============ BUDGET ============
function loadBudgets() {
    const saved = localStorage.getItem('budgets');
    // прв пат: демо лимити (Shopping ќе биде надминат за €20)
    if (saved === null) {
        return { overall: 0, categories: {} };
    }
    try {
        return JSON.parse(saved);
    } catch {
        return { overall: 0, categories: {} };
    }
}

function saveBudgets() {
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

const budgets = loadBudgets();
saveBudgets();

function budgetRow(name, icon, spent, limit) {
    const percent = (spent / limit) * 100;
    const state = spent > limit ? 'over' : percent >= 90 ? 'warn' : 'ok';
    const left = limit - spent;

    const note = state === 'over'
        ? t('Over by {amount}', { amount: formatMoney(spent - limit) })
        : t('{amount} left', { amount: formatMoney(left) });

    return `
        <div class="budget-row">
            <div class="budget-row__top">
                <span class="budget-row__name">${icon} ${name}</span>
                <span class="budget-row__nums"><strong>${formatMoney(spent)}</strong> / ${formatMoney(limit)}</span>
            </div>
            <div class="progress progress--thin">
                <div class="progress__bar ${state === 'ok' ? '' : 'progress__bar--' + state}"
                     style="width:${Math.min(100, percent)}%"></div>
            </div>
            <p class="budget-row__note ${state === 'over' ? 'budget-row__note--over' : ''}">${note}</p>
        </div>`;
}

function renderBudget() {
    const rows = [];
    const warnings = [];

    if (budgets.overall > 0) {
        rows.push(budgetRow(t('Overall'), '📊', data.spent, budgets.overall));
        if (data.spent > budgets.overall) {
            warnings.push(t("You've exceeded your overall budget by {amount}.", { amount: formatMoney(data.spent - budgets.overall) }));
        }
    }

    CATEGORIES.forEach(cat => {
        const limit = budgets.categories[cat.name];
        if (!limit) return;

        const found = data.categories.find(c => c.name === cat.name);
        const spent = found ? found.amount : 0;

        rows.push(budgetRow(t(cat.name), cat.icon, spent, limit));
        if (spent > limit) {
            warnings.push(t("You've exceeded your {cat} budget by {amount}.", { cat: t(cat.name), amount: formatMoney(spent - limit) }));
        }
    });

    document.getElementById('budgetAlerts').innerHTML =
        warnings.map(w => `<div class="alert">⚠️ ${w}</div>`).join('');

    document.getElementById('budgetList').innerHTML = rows.length
        ? rows.join('')
        : '<p class="empty">' + t('No budgets yet. Tap Edit to set your first one.') + '</p>';
}

// ---- форма за уредување на буџети ----
const budgetModal = document.getElementById('budgetModal');
const budgetForm = document.getElementById('budgetForm');

function openBudgetModal() {
    document.getElementById('budgetOverall').value = budgets.overall || '';
    budgetForm.querySelectorAll('[data-cat]').forEach(input => {
        input.value = budgets.categories[input.dataset.cat] || '';
    });
    budgetModal.classList.add('modal--open');
}

function closeBudgetModal() {
    budgetModal.classList.remove('modal--open');
}

document.getElementById('editBudget').addEventListener('click', openBudgetModal);
document.getElementById('closeBudget').addEventListener('click', closeBudgetModal);
document.getElementById('budgetBackdrop').addEventListener('click', closeBudgetModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBudgetModal();
});

budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();

    budgets.overall = parseFloat(document.getElementById('budgetOverall').value) || 0;
    budgets.categories = {};

    budgetForm.querySelectorAll('[data-cat]').forEach(input => {
        const value = parseFloat(input.value);
        if (value > 0) budgets.categories[input.dataset.cat] = value;
    });

    saveBudgets();
    closeBudgetModal();
    renderBudget();
    renderAfford();
});

// ============ SAVINGS GOALS ============
function loadGoals() {
    const saved = localStorage.getItem('goals');
    if (saved === null) {
        return [];
    }
    try {
        return JSON.parse(saved);
    } catch {
        return [];
    }
}

function saveGoals() {
    localStorage.setItem('goals', JSON.stringify(goals));
}

const goals = loadGoals();
saveGoals();

function renderGoals() {
    const box = document.getElementById('goalList');

    if (goals.length === 0) {
        box.innerHTML = `<p class="empty">${t('No goals yet. Tap + New to create one.')}</p>`;
        return;
    }

    box.innerHTML = goals.map(g => {
        const percent = Math.min(100, Math.round((g.saved / g.target) * 100));
        const left = g.target - g.saved;
        const note = left > 0
            ? t('{pct}% · {amount} remaining', { pct: percent, amount: formatMoney(left) })
            : t('🎉 Goal reached!');

        return `
            <div class="goal">
                <div class="goal__top">
                    <span class="goal__name">${g.icon} ${escapeHtml(g.name)}</span>
                    <span class="goal__nums"><strong>${formatMoney(g.saved)}</strong> / ${formatMoney(g.target)}</span>
                </div>
                <div class="progress progress--thin">
                    <div class="progress__bar progress__bar--goal" style="width:${percent}%"></div>
                </div>
                <div class="goal__bottom">
                    <span class="goal__note">${note}</span>
                    <div class="goal__actions">
                        <button class="chip" data-action="add" data-id="${g.id}">${t('+ Add')}</button>
                        <button class="tx__btn" data-action="edit" data-id="${g.id}" aria-label="Edit">✏️</button>
                        <button class="tx__btn" data-action="delete" data-id="${g.id}" aria-label="Delete">🗑</button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// ---- модал: додади пари на цел (замена за prompt) ----
const addSavedModal = document.getElementById('addSavedModal');
const addSavedForm = document.getElementById('addSavedForm');
let addingToGoalId = null;

function openAddSavedModal(goal) {
    addingToGoalId = goal.id;
    addSavedForm.reset();
    document.getElementById('addSavedTitle').textContent = t('Add to {name}', { name: goal.name });
    addSavedModal.classList.add('modal--open');
    document.getElementById('addSavedAmount').focus();
}

function closeAddSavedModal() {
    addSavedModal.classList.remove('modal--open');
}

document.getElementById('closeAddSaved').addEventListener('click', closeAddSavedModal);
document.getElementById('addSavedBackdrop').addEventListener('click', closeAddSavedModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAddSavedModal();
});

addSavedForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const value = parseFloat(document.getElementById('addSavedAmount').value);
    const goal = goals.find(g => g.id === addingToGoalId);
    if (!goal || !(value > 0)) return;

    goal.saved = Math.round((goal.saved + value) * 100) / 100;
    saveGoals();
    closeAddSavedModal();
    renderGoals();
});

// ---- форма за цел ----
const goalModal = document.getElementById('goalModal');
const goalForm = document.getElementById('goalForm');
let editingGoalId = null;

function openGoalModal(goal) {
    goalForm.reset();
    editingGoalId = goal ? goal.id : null;

    document.getElementById('goalModalTitle').textContent = goal ? t('Edit Goal') : t('New Goal');
    document.getElementById('goalName').value = goal ? goal.name : '';
    document.getElementById('goalIcon').value = goal ? goal.icon : '🎯';
    document.getElementById('goalTarget').value = goal ? goal.target : '';
    document.getElementById('goalSaved').value = goal ? goal.saved : '';

    goalModal.classList.add('modal--open');
    document.getElementById('goalName').focus();
}

function closeGoalModal() {
    goalModal.classList.remove('modal--open');
}

document.getElementById('addGoal').addEventListener('click', () => openGoalModal());
document.getElementById('closeGoal').addEventListener('click', closeGoalModal);
document.getElementById('goalBackdrop').addEventListener('click', closeGoalModal);

goalForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const values = {
        name: document.getElementById('goalName').value.trim(),
        icon: document.getElementById('goalIcon').value,
        target: parseFloat(document.getElementById('goalTarget').value),
        saved: parseFloat(document.getElementById('goalSaved').value) || 0
    };
    if (!values.name || !(values.target > 0)) return;

    if (editingGoalId) {
        Object.assign(goals.find(g => g.id === editingGoalId), values);
    } else {
        goals.push({ id: newId(), ...values });
    }

    saveGoals();
    closeGoalModal();
    renderGoals();
});

// + Add / Edit / Delete (event delegation)
document.getElementById('goalList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const goal = goals.find(g => g.id === btn.dataset.id);
    if (!goal) return;

    if (btn.dataset.action === 'edit') {
        openGoalModal(goal);
    } else if (btn.dataset.action === 'delete') {
        if (confirm(t('Delete "{name}"?', { name: goal.name }))) {
            goals.splice(goals.indexOf(goal), 1);
            saveGoals();
            renderGoals();
        }
    } else {
        openAddSavedModal(goal);
    }
});

// ============ SUBSCRIPTIONS ============
function loadSubs() {
    const saved = localStorage.getItem('subs');
    if (saved === null) {
        return [];
    }
    try {
        return JSON.parse(saved);
    } catch {
        return [];
    }
}

function saveSubs() {
    localStorage.setItem('subs', JSON.stringify(subs));
}

const subs = loadSubs();
saveSubs();

function renderSubs() {
    const list = document.getElementById('subList');
    const summary = document.getElementById('subSummary');

    if (subs.length === 0) {
        list.innerHTML = `<p class="empty">${t('No subscriptions yet.')}</p>`;
        summary.innerHTML = '';
        return;
    }

    list.innerHTML = '<div class="tx-group">' + subs.map(s => `
        <div class="tx">
            <span class="tx__icon tx__icon--letter">${escapeHtml(s.name.charAt(0).toUpperCase())}</span>
            <div class="tx__info">
                <p class="tx__title">${escapeHtml(s.name)}</p>
                <p class="tx__meta">${t('Monthly')}</p>
            </div>
            <span class="tx__amount">${formatMoney(s.amount)}</span>
            <div class="tx__actions">
                <button class="tx__btn" data-action="edit" data-id="${s.id}" aria-label="Edit">✏️</button>
                <button class="tx__btn" data-action="delete" data-id="${s.id}" aria-label="Delete">🗑</button>
            </div>
        </div>`).join('') + '</div>';

    const monthly = subs.reduce((sum, s) => sum + s.amount, 0);
    const yearly = monthly * 12;

    summary.innerHTML = `
        <div class="overview__stats">
            <div class="stat">
                <span class="stat__label">${t('Monthly total')}</span>
                <span class="stat__value">${formatMoney(monthly)}</span>
            </div>
            <div class="stat">
                <span class="stat__label">${t('Yearly')}</span>
                <span class="stat__value">${formatMoney(yearly)}</span>
            </div>
        </div>
        <div class="insight">
            <span class="insight__icon">⚠️</span>
            <p class="insight__text">${t("You're spending {amount} per year on subscriptions.", { amount: formatMoney(yearly) })}</p>
        </div>`;
}

// ---- форма за претплата ----
const subModal = document.getElementById('subModal');
const subForm = document.getElementById('subForm');
let editingSubId = null;

function openSubModal(sub) {
    subForm.reset();
    editingSubId = sub ? sub.id : null;

    document.getElementById('subModalTitle').textContent = sub ? t('Edit Subscription') : t('Add Subscription');
    document.getElementById('subName').value = sub ? sub.name : '';
    document.getElementById('subAmount').value = sub ? sub.amount : '';

    subModal.classList.add('modal--open');
    document.getElementById('subName').focus();
}

function closeSubModal() {
    subModal.classList.remove('modal--open');
}

document.getElementById('addSub').addEventListener('click', () => openSubModal());
document.getElementById('closeSub').addEventListener('click', closeSubModal);
document.getElementById('subBackdrop').addEventListener('click', closeSubModal);

subForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const values = {
        name: document.getElementById('subName').value.trim(),
        amount: Math.round(parseFloat(document.getElementById('subAmount').value) * 100) / 100
    };
    if (!values.name || !(values.amount > 0)) return;

    if (editingSubId) {
        Object.assign(subs.find(s => s.id === editingSubId), values);
    } else {
        subs.push({ id: newId(), ...values });
    }

    saveSubs();
    closeSubModal();
    renderSubs();
    renderInsights();
});

document.getElementById('subList').addEventListener('click', (e) => {
    const btn = e.target.closest('.tx__btn');
    if (!btn) return;

    const sub = subs.find(s => s.id === btn.dataset.id);
    if (!sub) return;

    if (btn.dataset.action === 'edit') {
        openSubModal(sub);
    } else if (confirm(t('Delete "{name}"?', { name: sub.name }))) {
        subs.splice(subs.indexOf(sub), 1);
        saveSubs();
        renderSubs();
    }
});

// Escape ги затвора и двата нови модали
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeGoalModal();
        closeSubModal();
    }
});

// ============ SMART INSIGHTS ============
function buildInsights() {
    const now = new Date();
    const today = toISODate(now);
    const thisMonth = monthKey(now);
    const monthExpenses = expenses.filter(e => e.date.startsWith(thisMonth));
    const insights = [];

    // 1. Категорија со најголем пораст
    const risers = data.categories
        .filter(c => c.previous > 0 && c.amount > c.previous)
        .sort((a, b) => (b.amount - b.previous) - (a.amount - a.previous));

    if (risers.length) {
        const c = risers[0];
        const diff = c.amount - c.previous;
        const pct = Math.round((diff / c.previous) * 100);
        insights.push({
            icon: c.icon,
            title: t('{cat} increased', { cat: t(c.name) }),
            text: t('You spent {amount} more on {cat} than last month (+{pct}%).', {
                amount: formatMoney(diff), cat: t(c.name).toLowerCase(), pct
            })
        });
    }

    // 2. Претплати
    if (subs.length) {
        const monthly = subs.reduce((sum, s) => sum + s.amount, 0);
        insights.push({
            icon: '📱',
            title: t('Subscriptions'),
            text: t(subs.length === 1
                    ? 'You pay for 1 subscription, {amount} every month.'
                    : 'You pay for {n} subscriptions, {amount} every month.',
                { n: subs.length, amount: formatMoney(monthly) })
        });
    }

    // 3. Најголем трошок
    if (monthExpenses.length) {
        const big = monthExpenses.reduce((a, b) => (b.amount > a.amount ? b : a));
        const label = big.description ? ` (${escapeHtml(big.description)})` : '';
        insights.push({
            icon: '💸',
            title: t('Biggest expense'),
            text: t('Your biggest expense was {amount} for {cat}{label}.', {
                amount: formatMoney(big.amount), cat: t(big.category), label
            })
        });
    }

    // 4. Викенд vs работни денови
    let weekendDays = 0, weekdayDays = 0, weekendSum = 0, weekdaySum = 0;

    for (let d = 1; d <= now.getDate(); d++) {
        const day = new Date(now.getFullYear(), now.getMonth(), d).getDay();
        if (day === 0 || day === 6) weekendDays++; else weekdayDays++;
    }

    monthExpenses
        .filter(e => e.date <= today)
        .forEach(e => {
            const day = new Date(e.date + 'T00:00:00').getDay();
            if (day === 0 || day === 6) weekendSum += e.amount; else weekdaySum += e.amount;
        });

    if (weekendDays > 0 && weekdayDays > 0 && weekendSum > 0 && weekdaySum > 0) {
        const ratio = (weekendSum / weekendDays) / (weekdaySum / weekdayDays);
        const pct = Math.round(Math.abs(ratio - 1) * 100);
        if (pct >= 10) {
            insights.push({
                icon: '📅',
                title: t('Weekend spending'),
                text: t(ratio > 1
                        ? 'You spend {pct}% more per day on weekends than on weekdays.'
                        : 'You spend {pct}% less per day on weekends than on weekdays.',
                    { pct })
            });
        }
    }

    // 5. Мали купувања
    const small = monthExpenses.filter(e => e.amount < 10);
    if (small.length >= 3) {
        const smallTotal = small.reduce((sum, e) => sum + e.amount, 0);
        insights.push({
            icon: '🪙',
            title: t('Small expenses'),
            text: t('You made {n} purchases under {limit} this month, {amount} in total.', {
                n: small.length, limit: formatMoney(10), amount: formatMoney(smallTotal)
            })
        });
    }

    return insights;
}

function renderInsights() {
    const list = buildInsights();
    const box = document.getElementById('insightList');

    if (list.length === 0) {
        box.innerHTML = `<p class="empty">${t('Add a few expenses and your insights will show up here.')}</p>`;
        return;
    }

    box.innerHTML = list.map(i => `
        <div class="insight-item">
            <span class="insight-item__icon">${i.icon}</span>
            <div>
                <p class="insight-item__title">${i.title}</p>
                <p class="insight-item__text">${i.text}</p>
            </div>
        </div>`).join('');
}

// ============ ANALYTICS ============
let analyticsPeriod = 'month';

// секоја "колона" на графикот има име и тест: дали датумот припаѓа тука
function getBuckets(period) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (period === 'week') {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(y, m, now.getDate() - (6 - i));
            const iso = toISODate(d);
            return {
                label: d.toLocaleDateString(locale(), { weekday: 'short' }),
                test: date => date === iso,
                current: i === 6
            };
        });
    }

    if (period === 'month') {
        const key = monthKey(now);
        const weeks = Math.ceil(new Date(y, m + 1, 0).getDate() / 7);
        const currentWeek = Math.ceil(now.getDate() / 7);
        return Array.from({ length: weeks }, (_, i) => ({
            label: t('W') + (i + 1),
            test: date => date.startsWith(key) && Math.ceil(Number(date.slice(8, 10)) / 7) === i + 1,
            current: i + 1 === currentWeek
        }));
    }

    return Array.from({ length: 12 }, (_, i) => {
        const key = `${y}-${String(i + 1).padStart(2, '0')}`;
        return {
            label: new Date(y, i, 1).toLocaleDateString(locale(), { month: 'short' }),
            test: date => date.startsWith(key),
            current: i === m
        };
    });
}

function sumOf(list) {
    return Math.round(list.reduce((s, e) => s + e.amount, 0) * 100) / 100;
}

function renderAnalytics() {
    const now = new Date();
    const buckets = getBuckets(analyticsPeriod);

    document.querySelectorAll('#analyticsTabs .tab').forEach(tab => {
        tab.classList.toggle('tab--active', tab.dataset.period === analyticsPeriod);
    });

    const sums = buckets.map(b => sumOf(expenses.filter(e => b.test(e.date))));
    const total = Math.round(sums.reduce((a, b) => a + b, 0) * 100) / 100;

    document.getElementById('anTotal').textContent = formatMoney(total);
    document.getElementById('anPeriod').textContent = {
        week: t('last 7 days'),
        month: monthTitle(now),
        year: String(now.getFullYear())
    }[analyticsPeriod];

    const chart = document.getElementById('anChart');
    const top = document.getElementById('anTop');

    if (total === 0) {
        chart.innerHTML = `<p class="empty">${t('No expenses in this period.')}</p>`;
        top.innerHTML = '';
        return;
    }

    // график
    const max = Math.max(...sums);
    const showValues = buckets.length <= 7;

    chart.innerHTML = '<div class="bars">' + buckets.map((b, i) => `
        <div class="bar-col" title="${b.label}: ${formatMoney(sums[i])}">
            <span class="bar__value">${showValues && sums[i] > 0 ? currencySymbol() + Math.round(sums[i]) : ''}</span>
            <div class="bar-track">
                <div class="bar ${b.current ? 'bar--current' : ''}"
                     style="height:${(sums[i] / max) * 100}%"></div>
            </div>
            <span class="bar__label">${b.label}</span>
        </div>`).join('') + '</div>';

    // топ категории за истиот период
    const inPeriod = expenses.filter(e => buckets.some(b => b.test(e.date)));

    const cats = CATEGORIES
        .map(cat => ({ ...cat, amount: sumOf(inPeriod.filter(e => e.category === cat.name)) }))
        .filter(c => c.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    const topMax = cats[0].amount;

    top.innerHTML = cats.map(c => `
        <div class="budget-row">
            <div class="budget-row__top">
                <span class="budget-row__name">${c.icon} ${t(c.name)}</span>
                <span class="budget-row__nums"><strong>${formatMoney(c.amount)}</strong> · ${Math.round((c.amount / total) * 100)}%</span>
            </div>
            <div class="progress progress--thin">
                <div class="progress__bar" style="width:${(c.amount / topMax) * 100}%; background:${c.color}"></div>
            </div>
        </div>`).join('');
}

document.getElementById('analyticsTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    analyticsPeriod = tab.dataset.period;
    renderAnalytics();
});

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

    // валутата се користи насекаде, па прецртуваме сè
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

// ============ MONTHLY REVIEW ============
let reviewOffset = 0;   // 0 = тековен месец, -1 = претходен, ...

function monthStats(key) {
    const list = expenses.filter(e => e.date.startsWith(key));
    const byCat = {};

    list.forEach(e => {
        byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });
    Object.keys(byCat).forEach(k => {
        byCat[k] = Math.round(byCat[k] * 100) / 100;
    });

    return {
        total: sumOf(list),
        byCat,
        count: list.length,
        biggest: list.length ? list.reduce((a, b) => (b.amount > a.amount ? b : a)) : null
    };
}

function trendHtml(current, previous) {
    if (!previous) return '<span class="fact-row__value">—</span>';

    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return '<span class="fact-row__value">0%</span>';

    return `<span class="fact-row__value ${pct > 0 ? 'trend--up' : 'trend--down'}">
        ${pct > 0 ? '↑' : '↓'} ${Math.abs(pct)}%</span>`;
}

function renderReview() {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() + reviewOffset, 1);
    const prevDate = new Date(now.getFullYear(), now.getMonth() + reviewOffset - 1, 1);
    const monthName = getMonthName(date);
    const prevName = getMonthName(prevDate);

    const cur = monthStats(monthKey(date));
    const prev = monthStats(monthKey(prevDate));

    // најраниот месец со трошок (за да не се оди во празнина)
    const earliest = expenses.length
        ? expenses.reduce((min, e) => (e.date < min ? e.date : min), expenses[0].date).slice(0, 7)
        : null;

    document.getElementById('reviewTitle').textContent = monthTitle(date);
    document.getElementById('reviewPrev').disabled = !earliest || monthKey(date) <= earliest;
    document.getElementById('reviewNext').disabled = reviewOffset >= 0;

    const box = document.getElementById('reviewBody');

    if (cur.count === 0) {
        box.innerHTML = `<p class="empty">${t('No expenses in {month}.', { month: monthName })}</p>`;
        return;
    }

    const income = settings.income;
    const saved = income - cur.total;
    const rate = income > 0 ? (saved / income) * 100 : null;

    // најголема категорија и најголем поединечен трошок
    const [topName, topAmount] = Object.entries(cur.byCat).sort((a, b) => b[1] - a[1])[0];
    const topCat = CATEGORIES.find(c => c.name === topName);
    const big = cur.biggest;
    const bigCat = CATEGORIES.find(c => c.name === big.category);
    const bigLabel = big.description ? escapeHtml(big.description) : t(big.category);

    // споредба со претходниот месец
    const rows = [[t('📊 Spending'), cur.total, prev.total]];
    Object.entries(cur.byCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .forEach(([name, amount]) => {
            const cat = CATEGORIES.find(c => c.name === name);
            rows.push([`${cat ? cat.icon : '💰'} ${t(name)}`, amount, prev.byCat[name] || 0]);
        });

    const compare = prev.count === 0
        ? `<p class="empty">${t('No data for {month} to compare.', { month: prevName })}</p>`
        : rows.map(([label, a, b]) => `
            <div class="fact-row">
                <span>${label}</span>
                ${trendHtml(a, b)}
            </div>`).join('');

    // стапка на штедење
    let savings;
    if (rate === null) {
        savings = `<p class="empty">${t('Set your monthly income in Settings to see your savings rate.')}</p>`;
    } else {
        const barWidth = Math.max(0, Math.min(100, rate));
        const text = saved >= 0
            ? t('You saved {amount} in {month}.', { amount: formatMoney(saved), month: monthName })
            : t('You spent {amount} more than your income in {month}.', { amount: formatMoney(-saved), month: monthName });

        savings = `
            <div class="rate">
                <span class="rate__value ${saved >= 0 ? 'text-income' : 'text-spent'}">${rate.toFixed(1)}%</span>
                <span class="rate__label">${t('savings rate')}</span>
            </div>
            <div class="progress">
                <div class="progress__bar progress__bar--goal" style="width:${barWidth}%"></div>
            </div>
            <p class="progress__text">${text}</p>`;
    }

    box.innerHTML = `
        <div class="context__grid">
            <div class="context__item">
                <span class="context__value">${formatMoney(income)}</span>
                <span class="context__label">${t('Income')}</span>
            </div>
            <div class="context__item">
                <span class="context__value text-spent">${formatMoney(cur.total)}</span>
                <span class="context__label">${t('Spent')}</span>
            </div>
            <div class="context__item">
                <span class="context__value ${saved >= 0 ? 'text-income' : 'text-spent'}">${formatMoney(saved)}</span>
                <span class="context__label">${t('Saved')}</span>
            </div>
        </div>

        <p class="review__line">${t('Your biggest category')}
            <strong>${topCat ? topCat.icon : '💰'} ${t(topName)} — ${formatMoney(topAmount)}</strong></p>
        <p class="review__line">${t('Your biggest expense')}
            <strong>${bigCat ? bigCat.icon : '💰'} ${bigLabel} — ${formatMoney(big.amount)}</strong></p>

        <h4 class="subtitle review__block">${t('Compared to {month}', { month: prevName })}</h4>
        ${compare}

        <h4 class="subtitle review__block">${t('⭐ Your month')}</h4>
        ${savings}`;
}

document.getElementById('reviewPrev').addEventListener('click', () => {
    reviewOffset--;
    renderReview();
});

document.getElementById('reviewNext').addEventListener('click', () => {
    reviewOffset++;
    renderReview();
});

// ============ CAN I AFFORD THIS? ============
function renderAfford() {
    const box = document.getElementById('affordResult');
    const price = parseFloat(document.getElementById('affordPrice').value);

    if (!(price > 0)) {
        box.innerHTML = `<p class="empty">${t('Enter a price to see what it would do to your month.')}</p>`;
        return;
    }
    if (price > MAX_AMOUNT) {
        box.innerHTML = `<p class="empty">${t('Maximum amount is {amount}.', { amount: formatMoney(MAX_AMOUNT) })}</p>`;
        return;
    }
    if (settings.income <= 0) {
        box.innerHTML = `<p class="empty">${t('Set your monthly income in Settings first.')}</p>`;
        return;
    }

    const remaining = data.income - data.spent;
    const after = remaining - price;
    const incomePct = Math.round((price / data.income) * 100);

    let summary;
    if (remaining <= 0) {
        summary = t('You have no money left this month, so this purchase would go over your income.');
    } else if (price > remaining) {
        summary = t('This is {amount} more than what you have left this month.', { amount: formatMoney(price - remaining) });
    } else {
        summary = t('This purchase would use {pct}% of your remaining money.', { pct: Math.round((price / remaining) * 100) });
    }

    // ред за буџет (само ако има поставен општ буџет)
    let budgetRow = '';
    if (budgets.overall > 0) {
        const budgetAfter = budgets.overall - data.spent - price;
        budgetRow = `
            <div class="fact-row">
                <span>${budgetAfter >= 0 ? t('Budget left after') : t('Over budget by')}</span>
                <span class="fact-row__value ${budgetAfter >= 0 ? '' : 'text-spent'}">${formatMoney(Math.abs(budgetAfter))}</span>
            </div>`;
    }

    box.innerHTML = `
        <div class="afford__result">
            <div class="fact-row">
                <span>${t('Current balance')}</span>
                <span class="fact-row__value">${formatMoney(remaining)}</span>
            </div>
            <div class="fact-row">
               <span>${t('After purchase')}</span>
                <span class="fact-row__value ${after >= 0 ? '' : 'text-spent'}">${formatMoney(after)}</span>
            </div>
            <div class="fact-row">
                <span>${t('Share of monthly income')}</span>
                <span class="fact-row__value">${incomePct}%</span>
            </div>
            ${budgetRow}
            <div class="insight">
                <span class="insight__icon">💡</span>
                <p class="insight__text">${summary}</p>
            </div>
        </div>`;
}

document.getElementById('affordPrice').addEventListener('input', renderAfford);

// ============ TRANSACTIONS ============
let searchQuery = '';
let filterCategory = 'all';

const filterSelect = document.getElementById('filterSelect');

// опишот го внесува корисникот, па го "чистиме" пред да го ставиме во HTML
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
    return new Date(iso + 'T00:00:00').toLocaleDateString(locale(), {   // беше 'en-GB'
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

function renderTransactions() {
    const q = searchQuery.trim().toLowerCase();

    // најново најгоре (reverse + стабилен sort по датум)
    const list = [...expenses]
        .reverse()
        .sort((a, b) => b.date.localeCompare(a.date))
        .filter(e => filterCategory === 'all' || e.category === filterCategory)
        .filter(e => !q
            || e.description.toLowerCase().includes(q)
            || e.category.toLowerCase().includes(q));

    const box = document.getElementById('txList');

    if (list.length === 0) {
        box.innerHTML = `<p class="empty">${t('No transactions found.')}</p>`;
        return;
    }

    // групирање по датум
    const groups = {};
    list.forEach(e => {
        if (!groups[e.date]) groups[e.date] = [];
        groups[e.date].push(e);
    });

    box.innerHTML = Object.entries(groups).map(([date, items]) => {
        const dayTotal = items.reduce((s, e) => s + e.amount, 0);

        const rows = items.map(e => {
            const cat = CATEGORIES.find(c => c.name === e.category)
                || { icon: '💰', color: '#94a3b8' };
            const title = e.description ? escapeHtml(e.description) : t(e.category);

            return `
                <div class="tx">
                    <span class="tx__icon" style="background:${cat.color}22">${cat.icon}</span>
                    <div class="tx__info">
                        <p class="tx__title">${title}</p>
                        <p class="tx__meta">${t(e.category)} • ${t(e.payment)}</p>
                    </div>
                    <span class="tx__amount">-${formatMoney(e.amount)}</span>
                    <div class="tx__actions">
                        <button class="tx__btn" data-action="edit" data-id="${e.id}" aria-label="Edit">✏️</button>
                        <button class="tx__btn" data-action="delete" data-id="${e.id}" aria-label="Delete">🗑</button>
                    </div>
                </div>`;
        }).join('');

        return `
            <div class="tx-group">
                <div class="tx-group__head">
                    <span>${dayLabel(date)}</span>
                    <span>-${formatMoney(dayTotal)}</span>
                </div>
                ${rows}
            </div>`;
    }).join('');
}

// пребарување и филтер
document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTransactions();
});

filterSelect.addEventListener('change', (e) => {
    filterCategory = e.target.value;
    renderTransactions();
});

// Edit / Delete (event delegation)
document.getElementById('txList').addEventListener('click', (e) => {
    const btn = e.target.closest('.tx__btn');
    if (!btn) return;

    const expense = expenses.find(x => x.id === btn.dataset.id);
    if (!expense) return;

    if (btn.dataset.action === 'edit') {
        openModal(expense);
    } else if (confirm(t('Delete this expense?'))) {
        expenses.splice(expenses.indexOf(expense), 1);
        saveExpenses();
        refresh();
        showToast(t('Expense deleted'));
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

// ============ ЈАЗИК: листи и прецртување ============
// селектите и полињата за буџет се градат со преведени имиња на категории
function buildLists() {
    const catValue = categorySelect.value;
    const filterValue = filterSelect.value;
    const options = CATEGORIES
        .map(c => `<option value="${c.name}">${c.icon} ${t(c.name)}</option>`)
        .join('');

    categorySelect.innerHTML = options;
    categorySelect.value = catValue || CATEGORIES[0].name;

    filterSelect.innerHTML = `<option value="all">${t('All categories')}</option>` + options;
    filterSelect.value = filterValue || 'all';

    document.getElementById('budgetFields').innerHTML = CATEGORIES.map(c => `
        <label class="budget-field">
            <span class="budget-field__name">${c.icon} ${t(c.name)}</span>
            <input type="number" class="input" data-cat="${c.name}"
                   placeholder="—" step="1" min="0" max="${MAX_AMOUNT}" inputmode="decimal">
        </label>`).join('');
}

// менува јазик: статичниот текст, листите, па сè што се црта од податоци
function applyLanguage() {
    setLanguage(settings.language);
    translateDom();   // мора ПРЕД refresh(), за да не се допираат веќе нацртаните листи
    buildLists();
    refresh();
    renderGoals();
    renderSubs();
}

// ============ МЕНИ ДОЛУ ============
const navButtons = document.querySelectorAll('.nav-btn');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.target)
            .scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// активното копче се менува според тоа што е на екранот
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navButtons.forEach(b =>
            b.classList.toggle('nav-btn--active', b.dataset.target === entry.target.id));
    });
}, { rootMargin: '-40% 0px -55% 0px' });

navButtons.forEach(b => sectionObserver.observe(document.getElementById(b.dataset.target)));

function startApp() {
    const splash = document.getElementById('splash');
    const skip = document.documentElement.classList.contains('no-splash') || reduceMotion;

    // картичките влегуваат една по една
    document.querySelectorAll('.main .card').forEach((card, i) => {
        card.style.setProperty('--i', Math.min(i, 8));
    });

    const reveal = () => {
        document.body.classList.add('loaded');
        // броевите повторно се бројат од нула, сега кога се гледаат
        Object.keys(lastShown).forEach(k => delete lastShown[k]);
        renderDashboard();
        renderBreakdown();
    };

    if (skip) {
        splash.remove();
        reveal();
        return;
    }

    setTimeout(() => {
        splash.classList.add('splash--hide');
        reveal();
        try { sessionStorage.setItem('splashSeen', '1'); } catch (e) {}
        setTimeout(() => splash.remove(), 600);
    }, 1600);
}

// ============ СТАРТ ============
applyTheme(localStorage.getItem('theme') || 'light');
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.max = MAX_AMOUNT;
});
applyCurrencySymbols();
applyLanguage();
if (isFirstRun) openSettingsModal();
startApp();