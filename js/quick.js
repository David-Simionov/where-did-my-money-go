// ============ БРЗО ВНЕСУВАЊЕ И ПОВТОРЛИВИ ТРОШОЦИ ============
// Користи од app.js: expenses, saveExpenses, refresh, CATEGORIES, formatMoney, fitText...

const qe = (id) => document.getElementById(id);

// ---------- 1. Повторливи трошоци ----------
function loadRecurring() {
    try {
        const list = JSON.parse(localStorage.getItem('recurring'));
        if (!Array.isArray(list)) return [];
        return list.filter(r => r && r.id && r.amount > 0 && r.day >= 1 && r.day <= 31 &&
            /^\d{4}-\d{2}$/.test(r.last));
    } catch {
        return [];
    }
}

function saveRecurring() {
    localStorage.setItem('recurring', JSON.stringify(recurring));
}

const recurring = loadRecurring();

// Создава трошоци за месеците што ги пропуштил (на пример ако не си ја отворил апликацијата).
// Враќа колку трошоци се додадени.
function runRecurring() {
    const today = toISODate(new Date());
    const nowKey = today.slice(0, 7);
    let added = 0;

    recurring.forEach(r => {
        for (let guard = 0; guard < 36 && r.last < nowKey; guard++) {
            const [y, m] = r.last.split('-').map(Number);
            const key = monthKey(new Date(y, m, 1));                  // следниот месец
            const daysInMonth = new Date(y, m + 1, 0).getDate();
            const date = `${key}-${String(Math.min(r.day, daysInMonth)).padStart(2, '0')}`;
            if (date > today) break;                                  // уште не е време

            expenses.push({
                id: newId(),
                amount: r.amount,
                category: CATEGORIES.some(c => c.name === r.category) ? r.category : 'Other',
                description: r.description,
                date,
                payment: r.payment,
                rec: r.id
            });
            r.last = key;
            added++;
        }
    });

    if (added) {
        saveExpenses();
        saveRecurring();
    }
    return added;
}

function renderRecurring() {
    qe('recurringBox').hidden = recurring.length === 0;

    qe('recurringList').innerHTML = '<div class="tx-group">' + recurring.map(r => {
        const cat = CATEGORIES.find(c => c.name === r.category) || { icon: '💰', color: '#94a3b8' };
        const title = r.description ? escapeHtml(r.description) : t(r.category);
        return `
            <div class="tx">
                <span class="tx__icon" style="background:${cat.color}22">${cat.icon}</span>
                <div class="tx__info">
                    <p class="tx__title">${title}</p>
                    <p class="tx__meta">${t('Every month (day {n})', { n: r.day })}</p>
                </div>
                <span class="tx__amount">${formatMoney(r.amount)}</span>
                <div class="tx__actions">
                    <button type="button" class="tx__btn" data-id="${r.id}" aria-label="Delete">🗑</button>
                </div>
            </div>`;
    }).join('') + '</div>';
}

qe('recurringList').addEventListener('click', (e) => {
    const btn = e.target.closest('.tx__btn');
    if (!btn) return;

    const i = recurring.findIndex(r => r.id === btn.dataset.id);
    if (i === -1 || !confirm(t('Stop this recurring expense?'))) return;

    recurring.splice(i, 1);
    saveRecurring();
    renderRecurring();
});

qe('openSettings').addEventListener('click', renderRecurring);

// ---------- 2. Меморија: опис → категорија ----------
const qa = { amount: '', cat: null, catTouched: false, mem: null };
const qaModal = qe('quickModal');

function buildMemory() {
    const byDesc = new Map();   // "vero" → { text: 'Vero', cats: { Groceries: 3 }, n: 3 }
    const catCount = {};

    expenses.forEach(e => {
        catCount[e.category] = (catCount[e.category] || 0) + 1;

        const text = (e.description || '').trim();
        if (!text) return;

        const key = text.toLowerCase();
        let m = byDesc.get(key);
        if (!m) {
            m = { text, cats: {}, n: 0 };
            byDesc.set(key, m);
        }
        m.cats[e.category] = (m.cats[e.category] || 0) + 1;
        m.n++;
    });

    // последните различни описи (за брзо повторување)
    const recent = [];
    for (let i = expenses.length - 1; i >= 0 && recent.length < 4; i--) {
        const key = (expenses[i].description || '').trim().toLowerCase();
        if (key && !recent.includes(key)) recent.push(key);
    }

    return { byDesc, catCount, recent };
}

function topCat(cats) {
    return Object.entries(cats).sort((a, b) => b[1] - a[1])[0][0];
}

// ---------- 3. Приказ ----------
function decimalSep() {
    return (1.1).toLocaleString(locale()).charAt(1);
}

function buildKeys() {
    qe('qaKeys').innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']
        .map(k => `<button type="button" class="qa-key" data-k="${k}"${k === '⌫' ? ' aria-label="Backspace"' : ''}>${k === '.' ? decimalSep() : k}</button>`)
        .join('');
}

function renderQuickCats() {
    const counts = qa.mem.catCount;

    // најчестите категории се напред
    const list = CATEGORIES
        .map((c, i) => ({ c, i, n: counts[c.name] || 0 }))
        .sort((a, b) => b.n - a.n || a.i - b.i)
        .map(x => x.c);

    qe('qaCats').innerHTML = list.map(c => `
        <button type="button" class="chip ${c.name === qa.cat ? 'chip--active' : ''}" data-cat="${c.name}">
            ${c.icon} ${t(c.name)}
        </button>`).join('');
}

function updateQuick() {
    const value = parseFloat(qa.amount) || 0;
    const sym = currencySymbol();
    const shown = qa.amount === '' ? '0' : qa.amount.replace('.', decimalSep());
    const amountEl = qe('qaAmount');

    fitText(amountEl, sym + (sym.length > 1 ? ' ' : '') + shown, 44);
    amountEl.classList.toggle('qa__amount--empty', qa.amount === '');

    const ready = value > 0 && qa.cat !== null;
    const btn = qe('qaAdd');
    btn.disabled = !ready;
    btn.textContent = ready ? t('Add {amount}', { amount: formatMoney(value) }) : t('Add');
}

function showSuggest(keys) {
    qe('qaSuggest').innerHTML = keys.map(k => {
        const m = qa.mem.byDesc.get(k);
        return `<button type="button" class="chip" data-key="${escapeHtml(k)}">${escapeHtml(m.text)}</button>`;
    }).join('');
}

// ---------- 4. Отворање и затворање ----------
function openQuick() {
    qa.amount = '';
    qa.cat = null;
    qa.catTouched = false;
    qa.mem = buildMemory();

    qe('qaDesc').value = '';
    qe('qaDate').value = toISODate(new Date());
    qe('qaDate').max = toISODate(new Date());
    qe('qaRepeat').checked = false;
    qe('qaMore').open = false;

    const payment = localStorage.getItem('lastPayment') || 'Card';
    const radio = document.querySelector(`input[name="qaPayment"][value="${payment}"]`);
    if (radio) radio.checked = true;

    buildKeys();
    renderQuickCats();
    showSuggest(qa.mem.recent);
    updateQuick();
    qaModal.classList.add('modal--open');
}

function closeQuick() {
    qaModal.classList.remove('modal--open');
}

// ---------- 5. Внесување на износ ----------
function pressKey(k) {
    let a = qa.amount;

    if (k === '⌫') {
        a = a.slice(0, -1);
    } else if (k === '.') {
        if (!a.includes('.')) a = (a || '0') + '.';
    } else {
        if (a === '0') a = '';                                  // нема водечки нули
        const next = a + k;
        const dec = next.split('.')[1] || '';
        if (dec.length > 2 || parseFloat(next) > MAX_AMOUNT) return;
        a = next;
    }

    qa.amount = a;
    updateQuick();
}

// ---------- 6. Зачувување и враќање ----------
function saveQuick() {
    const amount = Math.round((parseFloat(qa.amount) || 0) * 100) / 100;
    if (!(amount > 0) || !qa.cat) return;

    const today = toISODate(new Date());
    const date = qe('qaDate').value || today;
    if (date > today) return;                                   // нема датум во иднина

    const payment = document.querySelector('input[name="qaPayment"]:checked').value;
    const description = qe('qaDesc').value.trim();
    const repeat = qe('qaRepeat').checked;

    const exp = { id: newId(), amount, category: qa.cat, description, date, payment };
    let recId = null;

    if (repeat) {
        recId = newId();
        exp.rec = recId;
        recurring.push({
            id: recId, amount, category: qa.cat, description, payment,
            day: new Date(date + 'T00:00:00').getDate(),
            last: date.slice(0, 7)                              // овој месец е веќе покриен
        });
        saveRecurring();
    }

    expenses.push(exp);
    saveExpenses();
    localStorage.setItem('lastPayment', payment);
    if (repeat) runRecurring();                                 // ако датумот е во минатото, дополни ги месеците

    if (typeof viewOffset !== 'undefined') viewOffset = 0;      // (само ако го имаш Дел 16) врати на тековен месец

    closeQuick();
    refresh(exp.category);
    showToast(
        repeat ? t('Added. Repeats every month ✓') : t('Expense added ✓'),
        t('Undo'),
        () => undoQuick(exp.id, recId)
    );
}

function undoQuick(expId, recId) {
    for (let i = expenses.length - 1; i >= 0; i--) {
        if (expenses[i].id === expId || (recId && expenses[i].rec === recId)) expenses.splice(i, 1);
    }
    saveExpenses();

    if (recId) {
        const i = recurring.findIndex(r => r.id === recId);
        if (i !== -1) recurring.splice(i, 1);
        saveRecurring();
        renderRecurring();
    }
    refresh();
}

// ---------- 7. Настани ----------
qe('qaKeys').addEventListener('click', (e) => {
    const btn = e.target.closest('.qa-key');
    if (btn) pressKey(btn.dataset.k);
});

qe('qaCats').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    qa.cat = btn.dataset.cat;
    qa.catTouched = true;
    renderQuickCats();
    updateQuick();
});

qe('qaDesc').addEventListener('input', () => {
    const q = qe('qaDesc').value.trim().toLowerCase();
    if (!q) return showSuggest(qa.mem.recent);

    // познат опис: категоријата се бира сама (освен ако веќе си избрал рачно)
    const hit = qa.mem.byDesc.get(q);
    if (hit && !qa.catTouched) {
        qa.cat = topCat(hit.cats);
        renderQuickCats();
        updateQuick();
    }

    const keys = [...qa.mem.byDesc.entries()]
        .filter(([key]) => key !== q && key.includes(q))
        .sort((a, b) => (b[0].startsWith(q) - a[0].startsWith(q)) || (b[1].n - a[1].n))
        .slice(0, 3)
        .map(([key]) => key);

    showSuggest(keys);
});

qe('qaSuggest').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;

    const m = qa.mem.byDesc.get(btn.dataset.key);
    if (!m) return;

    qe('qaDesc').value = m.text;
    qa.cat = topCat(m.cats);
    qa.catTouched = false;
    showSuggest([]);
    renderQuickCats();
    updateQuick();
});

qe('qaAdd').addEventListener('click', saveQuick);
qe('closeQuick').addEventListener('click', closeQuick);
qe('quickBackdrop').addEventListener('click', closeQuick);

// тастатура (на компјутер)
document.addEventListener('keydown', (e) => {
    if (!qaModal.classList.contains('modal--open')) return;

    if (e.key === 'Escape') return closeQuick();

    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
        if (e.key === 'Enter' && e.target.id === 'qaDesc') {
            e.preventDefault();
            saveQuick();
        }
        return;
    }

    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === '.' || e.key === ',') pressKey('.');
    else if (e.key === 'Backspace') pressKey('⌫');
    else if (e.key === 'Enter' && tag !== 'BUTTON') saveQuick();
});

// ---------- 8. Старт: дополни ги повторливите трошоци ----------
function syncRecurring() {
    const n = runRecurring();
    if (n) {
        refresh();
        setTimeout(() => showToast(t('Recurring expenses added: {n}', { n })), 2000);   // по splash-от
    }
}

syncRecurring();
renderRecurring();

// ако апликацијата стои отворена во позадина (PWA), провери кога ќе се врати на екран
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncRecurring();
});