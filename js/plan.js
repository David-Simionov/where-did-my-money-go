// ============ BUDGET ============
function loadBudgets() {
    const saved = localStorage.getItem('budgets');
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
    renderHighlights();   // надминат буџет се гледа и на Почетна
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

// ---- модал: додади пари на цел ----
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
    renderTips();   // советите покажуваат "за колку месеци е целта"
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
    renderTips();
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
            renderTips();
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
        renderInsights();   // увидот за претплати се менува и при бришење
    }
});

// Escape ги затвора модалите за цел и претплата
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeGoalModal();
        closeSubModal();
    }
});
