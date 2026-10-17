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

// ============ КАТЕГОРИИ: ЛИЗГАЊЕ ============
let selectedIndex = 0;

function updateChipFades() {
    const box = document.getElementById('chips');
    const wrap = document.getElementById('chipsWrap');
    wrap.classList.toggle('chips-wrap--left', box.scrollLeft > 4);
    wrap.classList.toggle('chips-wrap--right', box.scrollLeft + box.clientWidth < box.scrollWidth - 4);
}

// избраната категорија секогаш се гледа цела
function scrollActiveChip(behavior = 'smooth') {
    const box = document.getElementById('chips');
    const active = box.querySelector('.chip--active');
    if (!active || !box.clientWidth) return;   // скриен екран

    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    const pad = 28;

    if (left < box.scrollLeft + pad) box.scrollTo({ left: left - pad, behavior });
    else if (right > box.scrollLeft + box.clientWidth - pad) box.scrollTo({ left: right - box.clientWidth + pad, behavior });
}

function renderChips() {
    const box = document.getElementById('chips');
    const keep = box.scrollLeft;   // не скокај на почеток при секое прецртување

    box.innerHTML = data.categories.map((cat, i) => `
        <button class="chip ${i === selectedIndex ? 'chip--active' : ''}" data-index="${i}">
            ${cat.icon} ${t(cat.name)}
        </button>`).join('');

    box.scrollLeft = keep;
    scrollActiveChip();
    updateChipFades();
}

document.getElementById('chips').addEventListener('scroll', updateChipFades, { passive: true });
window.addEventListener('resize', updateChipFades);

document.getElementById('chipsLeft').addEventListener('click', () => {
    const box = document.getElementById('chips');
    box.scrollBy({ left: -box.clientWidth * 0.7, behavior: 'smooth' });
});
document.getElementById('chipsRight').addEventListener('click', () => {
    const box = document.getElementById('chips');
    box.scrollBy({ left: box.clientWidth * 0.7, behavior: 'smooth' });
});

// клик на chip (event delegation, се закачува само еднаш)
document.getElementById('chips').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    selectedIndex = Number(btn.dataset.index);
    renderContext();
});

// ============ WHERE DID MY MONEY GO ============
function renderContext() {
    if (data.categories.length === 0) {
        document.getElementById('chips').innerHTML = '';
        updateChipFades();
        document.getElementById('ctxHeadline').textContent = t('No expenses yet. Tap + to add your first one.');
        ['ctxPerDay', 'ctxIncomePct', 'ctxTrend'].forEach(id => {
            document.getElementById(id).textContent = '—';
        });
        document.getElementById('ctxTrend').className = 'context__value';
        document.getElementById('ctxTrendLabel').textContent = '';
        document.getElementById('ctxInsight').textContent = t('Add an expense and your insights will show up here.');
        document.getElementById('tipsCard').hidden = true;
        return;
    }

    if (selectedIndex >= data.categories.length) selectedIndex = 0;
    const c = data.categories[selectedIndex];

    renderChips();

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
    renderTips();
}

// ============ СОВЕТИ ЗА ШТЕДЕЊЕ ============
let savePct = 10;

function renderTips() {
    const card = document.getElementById('tipsCard');
    const c = data.categories[selectedIndex];
    const tips = c && TIPS[c.name];

    card.hidden = !tips;
    if (!tips) return;

    const list = tips[currentLang] || tips.en;

    // "типичен месец": ако овој месец допрва почнал, се користи поголемиот од двата
    const base = Math.max(c.amount, c.previous);
    const monthly = Math.round(base * savePct) / 100;
    const yearly = Math.round(monthly * 12 * 100) / 100;

    // колку месеци до првата недовршена цел
    const goal = goals.find(g => g.saved < g.target);
    let goalLine = '';
    if (goal && monthly > 0) {
        const months = Math.ceil((goal.target - goal.saved) / monthly);
        if (months <= 120) {
            goalLine = `<p class="save-box__line">${t(months === 1
                    ? 'That would complete your goal "{name}" in 1 month.'
                    : 'That would complete your goal "{name}" in {n} months.',
                { name: escapeHtml(goal.name), n: months })}</p>`;
        }
    }

    document.getElementById('tipsTitle').textContent = t('Savings tips: {cat}', { cat: t(c.name) });

    document.getElementById('tipsBody').innerHTML = `
        <ol class="tips__list">
            ${list.map((text, i) => `
                <li class="tip"><span class="tip__n">${i + 1}</span><span>${text}</span></li>`).join('')}
        </ol>

        <div class="save-box">
            <p class="save-box__title">${t('What if you spend less?')}</p>
            <div class="save-pcts">
                ${[10, 20, 30].map(p => `
                    <button class="chip ${p === savePct ? 'chip--active' : ''}" data-pct="${p}">-${p}%</button>`).join('')}
            </div>
            <p class="save-box__big">${t('You would save {amount} per month.', { amount: formatMoney(monthly) })}</p>
            <p class="save-box__line">${t('That is {amount} per year.', { amount: formatMoney(yearly) })}</p>
            ${goalLine}
            <p class="save-box__small">${t('Based on a typical month: {amount} on {cat}.', {
                amount: formatMoney(base), cat: t(c.name).toLowerCase()
            })}</p>
        </div>

        <p class="tips__note">${t('General ideas, not financial advice.')}</p>`;
}

document.getElementById('tipsBody').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pct]');
    if (!btn) return;
    savePct = Number(btn.dataset.pct);
    renderTips();
});

// ============ ПРЕГЛЕД: НАЈВАЖНОТО ============
function renderHighlights() {
    const card = document.getElementById('highlights');
    const items = [];

    // 1. најголема категорија
    if (data.spent > 0 && data.categories.length) {
        const c = data.categories[0];
        items.push({
            icon: c.icon, tone: '',
            title: t('You spend the most on {cat}', { cat: t(c.name).toLowerCase() }),
            text: t('{amount} · {pct}% of your spending', {
                amount: formatMoney(c.amount),
                pct: Math.round((c.amount / data.spent) * 100)
            })
        });
    }

    // 2. спрема минатиот месец (исти денови)
    const cmp = comparePeriod();
    if (cmp.prevTotal > 0 && cmp.diff !== 0 && cmp.day >= MIN_COMPARE_DAYS) {
        const more = cmp.diff > 0;
        items.push({
            icon: more ? '⚠️' : '✅', tone: more ? 'warn' : 'ok',
            title: t(more ? 'You spend more than last month' : 'You spend less than last month'),
            text: t(more
                    ? '{amount} more than the first {n} days of {month}.'
                    : '{amount} less than the first {n} days of {month}.',
                { amount: formatMoney(Math.abs(cmp.diff)), n: cmp.prevDay, month: cmp.prevMonth }),
            link: ['stats', t('Why?')]
        });
    }

    // 3. надминати буџети
    const over = [];
    if (budgets.overall > 0 && data.spent > budgets.overall) {
        over.push({ key: 'overall', by: data.spent - budgets.overall });
    }
    CATEGORIES.forEach(cat => {
        const limit = budgets.categories[cat.name];
        if (!limit) return;
        const found = data.categories.find(c => c.name === cat.name);
        const spent = found ? found.amount : 0;
        if (spent > limit) over.push({ key: cat.name, by: spent - limit });
    });
    over.sort((a, b) => b.by - a.by);

    if (over.length === 1) {
        const o = over[0];
        items.push({
            icon: '⚠️', tone: 'warn',
            title: t('Budget exceeded'),
            text: o.key === 'overall'
                ? t("You've exceeded your overall budget by {amount}.", { amount: formatMoney(o.by) })
                : t("You've exceeded your {cat} budget by {amount}.", { cat: t(o.key), amount: formatMoney(o.by) }),
            link: ['plan', t('See budget')]
        });
    } else if (over.length > 1) {
        const o = over[0];
        items.push({
            icon: '⚠️', tone: 'warn',
            title: t('Budgets exceeded: {n}', { n: over.length }),
            text: t('Biggest overrun: {cat} (+{amount})', {
                cat: o.key === 'overall' ? t('Overall') : t(o.key),
                amount: formatMoney(o.by)
            }),
            link: ['plan', t('See budget')]
        });
    }

    card.hidden = items.length === 0;
    document.getElementById('highlightList').innerHTML = items.map(i => `
        <div class="insight-item">
            <span class="insight-item__icon ${i.tone ? 'insight-item__icon--' + i.tone : ''}">${i.icon}</span>
            <div>
                <p class="insight-item__title">${i.title}</p>
                <p class="insight-item__text">${i.text}</p>
                ${i.link ? `<button type="button" class="link-btn" data-goto="${i.link[0]}">${i.link[1]}</button>` : ''}
            </div>
        </div>`).join('');
}

document.getElementById('highlightList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-goto]');
    if (btn) showPage(btn.dataset.goto);
});
