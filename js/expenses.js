// ============ ADD EXPENSE (modal, се користи за уредување) ============
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

    document.getElementById('expenseDate').max = toISODate(new Date());
    modal.classList.add('modal--open');
    document.getElementById('expenseAmount').focus();
}

function closeModal() {
    modal.classList.remove('modal--open');
}

// копчето + го отвора брзото додавање (quick.js)
document.getElementById('openModal').addEventListener('click', () => openQuick());
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

// ============ TRANSACTIONS ============
let searchQuery = '';
let filterCategory = 'all';

const filterSelect = document.getElementById('filterSelect');

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

// ============ ДОПОЛНИТЕЛЕН ПРИХОД ============
function loadIncomes() {
    try {
        const list = JSON.parse(localStorage.getItem('incomes'));
        return Array.isArray(list)
            ? list.filter(x => x && x.id && x.amount > 0 && typeof x.date === 'string')
            : [];
    } catch {
        return [];
    }
}

function saveIncomes() {
    localStorage.setItem('incomes', JSON.stringify(incomes));
}

const incomes = loadIncomes();

// основен месечен приход + дополнителните за тој месец (key = "2026-10")
function incomeFor(key) {
    const extra = incomes
        .filter(x => x.date.startsWith(key))
        .reduce((sum, x) => sum + x.amount, 0);
    return Math.round((settings.income + extra) * 100) / 100;
}

const incomeModal = document.getElementById('incomeModal');
const incomeForm = document.getElementById('incomeForm');

function renderIncomeList() {
    const key = monthKey(new Date());
    const list = incomes
        .filter(x => x.date.startsWith(key))
        .sort((a, b) => b.date.localeCompare(a.date));

    document.getElementById('incomeListBox').hidden = list.length === 0;
    document.getElementById('incomeList').innerHTML = '<div class="tx-group">' + list.map(x => `
        <div class="tx">
            <span class="tx__icon" style="background:#10b98122">💵</span>
            <div class="tx__info">
                <p class="tx__title">${x.description ? escapeHtml(x.description) : t('Extra income')}</p>
                <p class="tx__meta">${dayLabel(x.date)}</p>
            </div>
            <span class="tx__amount text-income">+${formatMoney(x.amount)}</span>
            <div class="tx__actions">
                <button type="button" class="tx__btn" data-id="${x.id}" aria-label="Delete">🗑</button>
            </div>
        </div>`).join('') + '</div>';
}

function openIncomeModal() {
    const today = toISODate(new Date());
    incomeForm.reset();
    document.getElementById('incomeDate').value = today;
    document.getElementById('incomeDate').min = today.slice(0, 7) + '-01';   // само тековен месец
    document.getElementById('incomeDate').max = today;
    renderIncomeList();
    incomeModal.classList.add('modal--open');
    document.getElementById('incomeAmount').focus();
}

function closeIncomeModal() {
    incomeModal.classList.remove('modal--open');
}

document.getElementById('addIncomeBtn').addEventListener('click', openIncomeModal);
document.getElementById('closeIncome').addEventListener('click', closeIncomeModal);
document.getElementById('incomeBackdrop').addEventListener('click', closeIncomeModal);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeIncomeModal(); });

incomeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const amount = Math.round(parseFloat(document.getElementById('incomeAmount').value) * 100) / 100;
    const date = document.getElementById('incomeDate').value;
    const today = toISODate(new Date());

    if (!(amount > 0) || amount > MAX_AMOUNT) return;
    if (!date || date > today || date.slice(0, 7) !== today.slice(0, 7)) return;

    const item = {
        id: newId(),
        amount,
        description: document.getElementById('incomeDesc').value.trim(),
        date
    };

    incomes.push(item);
    saveIncomes();
    closeIncomeModal();
    refresh();

    showToast(t('Income added ✓'), t('Undo'), () => {
        const i = incomes.findIndex(x => x.id === item.id);
        if (i !== -1) incomes.splice(i, 1);
        saveIncomes();
        refresh();
    });
});

document.getElementById('incomeList').addEventListener('click', (e) => {
    const btn = e.target.closest('.tx__btn');
    if (!btn) return;

    const i = incomes.findIndex(x => x.id === btn.dataset.id);
    if (i === -1 || !confirm(t('Delete this income?'))) return;

    incomes.splice(i, 1);
    saveIncomes();
    refresh();
    renderIncomeList();
});
