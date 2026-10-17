// ============ SMART INSIGHTS ============
function buildInsights() {
    const now = new Date();
    const today = toISODate(now);
    const thisMonth = monthKey(now);
    const monthExpenses = expenses.filter(e => e.date.startsWith(thisMonth));
    const insights = [];

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

// ============ MONTHLY REVIEW ============
let reviewOffset = 0;

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

    const income = incomeFor(monthKey(date));
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
    if (data.income <= 0) {
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

// ============ ЗОШТО ПОТРОШИВ ПОВЕЌЕ? ============
function renderWhy() {
    const card = document.getElementById('whyCard');
    const cmp = comparePeriod();

    if (!(cmp.prevTotal > 0) || cmp.diff === 0 || cmp.day < MIN_COMPARE_DAYS) {
        card.hidden = true;
        return;
    }

    const more = cmp.diff > 0;
    const pct = Math.round((Math.abs(cmp.diff) / cmp.prevTotal) * 100);

    // категории што најмногу придонеле во насоката на промената
    const movers = cmp.rows
        .filter(r => (more ? r.diff > 0 : r.diff < 0))
        .sort((a, b) => (more ? b.diff - a.diff : a.diff - b.diff))
        .slice(0, 3);

    if (!movers.length) {
        card.hidden = true;
        return;
    }
    card.hidden = false;

    const other = cmp.rows
        .filter(r => (more ? r.diff < 0 : r.diff > 0))
        .sort((a, b) => (more ? a.diff - b.diff : b.diff - a.diff))[0];

    const max = Math.abs(movers[0].diff);
    const iconOf = (name) => (CATEGORIES.find(c => c.name === name) || { icon: '💰' }).icon;

    document.getElementById('whyTitle').textContent =
        t(more ? 'Why did I spend more?' : 'Why did I spend less?');

    document.getElementById('whyBody').innerHTML = `
        <p class="why__total ${more ? 'text-spent' : 'text-income'}">${signed(cmp.diff)}</p>
        <p class="why__sub">${t('{pct}% vs the first {n} days of {month} ({amount})', {
            pct: (more ? '+' : '−') + pct,
            n: cmp.prevDay,
            month: cmp.prevMonth,
            amount: formatMoney(cmp.prevTotal)
        })}</p>

        <h4 class="subtitle">${t('Biggest changes')}</h4>
        ${movers.map(r => `
            <div class="budget-row">
                <div class="budget-row__top">
                    <span class="budget-row__name">${iconOf(r.name)} ${t(r.name)}</span>
                    <span class="fact-row__value ${more ? 'text-spent' : 'text-income'}">${signed(r.diff)}</span>
                </div>
                <div class="progress progress--thin">
                    <div class="progress__bar ${more ? 'progress__bar--over' : 'progress__bar--goal'}"
                         style="width:${(Math.abs(r.diff) / max) * 100}%"></div>
                </div>
            </div>`).join('')}

        ${other ? `<p class="why__other">${t('On the other side')}: ${iconOf(other.name)} ${t(other.name)} ${signed(other.diff)}</p>` : ''}

        <p class="tips__note">${t('The same days of each month are compared, so the comparison is fair.')}</p>`;
}
