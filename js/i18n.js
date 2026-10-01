// ============ ПРЕВОДИ ============
// Англискиот текст е клуч. Ако нема превод, се прикажува англискиот.
const DICT = {
    mk: {
        // поздрав
        'Good morning': 'Добро утро',
        'Good afternoon': 'Добар ден',
        'Good evening': 'Добра вечер',
        'See where your money goes.': 'Види каде одат парите.',

        // Dashboard
        'Remaining': 'Останато',
        'of income spent': 'од приходот потрошено',
        'Income': 'Приход',
        'Spent': 'Потрошено',
        'Saved': 'Заштедено',
        'Spending breakdown': 'Преглед на трошоци',
        'Total spent': 'Вкупно потрошено',

        // Where did my money go
        'Where did my money go?': 'Каде отидоа парите?',
        'per day': 'на ден',
        'of income': 'од приходот',
        'vs {month}': 'спрема {month}',
        'No expenses yet. Tap + to add your first one.': 'Сè уште нема трошоци. Допри + за да додадеш прв.',
        'Add an expense and your insights will show up here.': 'Додај трошок и тука ќе се појават твоите увиди.',
        'You spent {amount} on {cat}.': 'Потроши {amount} за {cat}.',
        'You spent the same on {cat} as in {month}.': 'За {cat} потроши исто колку и во {month}.',
        'You spent {amount} more on {cat} this month than last month.': 'Овој месец потроши {amount} повеќе за {cat} отколку минатиот.',
        'You spent {amount} less on {cat} this month than last month.': 'Овој месец потроши {amount} помалку за {cat} отколку минатиот.',

        // Insights
        '💡 Your spending insights': '💡 Твои увиди за трошење',
        '{cat} increased': '{cat}: зголемување',
        'You spent {amount} more on {cat} than last month (+{pct}%).': 'Потроши {amount} повеќе за {cat} отколку минатиот месец (+{pct}%).',
        'You pay for 1 subscription, {amount} every month.': 'Плаќаш 1 претплата, {amount} секој месец.',
        'You pay for {n} subscriptions, {amount} every month.': 'Плаќаш {n} претплати, {amount} секој месец.',
        'Biggest expense': 'Најголем трошок',
        'Your biggest expense was {amount} for {cat}{label}.': 'Најголемиот трошок беше {amount} за {cat}{label}.',
        'Weekend spending': 'Трошење за викенд',
        'You spend {pct}% more per day on weekends than on weekdays.': 'Викендите трошиш {pct}% повеќе дневно отколку во работните денови.',
        'You spend {pct}% less per day on weekends than on weekdays.': 'Викендите трошиш {pct}% помалку дневно отколку во работните денови.',
        'Small expenses': 'Ситни трошоци',
        'You made {n} purchases under {limit} this month, {amount} in total.': 'Овој месец направи {n} купувања под {limit}, вкупно {amount}.',
        'Add a few expenses and your insights will show up here.': 'Додај неколку трошоци и тука ќе се појават твоите увиди.',

        // Analytics
        'Analytics': 'Анализа',
        'Week': 'Недела',
        'Month': 'Месец',
        'Year': 'Година',
        'last 7 days': 'последни 7 дена',
        'W': 'Н',
        'Top spending categories': 'Категории со најмногу трошоци',
        'No expenses in this period.': 'Нема трошоци во овој период.',

        // Monthly Review
        'Monthly Review': 'Месечен преглед',
        'Previous month': 'Претходен месец',
        'Next month': 'Следен месец',
        'No expenses in {month}.': 'Нема трошоци во {month}.',
        '📊 Spending': '📊 Трошење',
        'No data for {month} to compare.': 'Нема податоци за {month} за споредба.',
        'Set your monthly income in Settings to see your savings rate.': 'Постави месечен приход во Поставки за да ја видиш стапката на штедење.',
        'You saved {amount} in {month}.': 'Во {month} заштеди {amount}.',
        'You spent {amount} more than your income in {month}.': 'Во {month} потроши {amount} повеќе од приходот.',
        'savings rate': 'стапка на штедење',
        'Your biggest category': 'Твојата најголема категорија',
        'Your biggest expense': 'Твојот најголем трошок',
        'Compared to {month}': 'Споредба со {month}',
        '⭐ Your month': '⭐ Твојот месец',

        // Can I afford this
        '💰 Can I afford this?': '💰 Дали можам да си дозволам?',
        'Price': 'Цена',
        'Enter a price to see what it would do to your month.': 'Внеси цена за да видиш како ќе влијае на твојот месец.',
        'Maximum amount is {amount}.': 'Максималниот износ е {amount}.',
        'Set your monthly income in Settings first.': 'Прво постави месечен приход во Поставки.',
        'You have no money left this month, so this purchase would go over your income.': 'Овој месец немаш останато пари, па купувањето би го надминало приходот.',
        'This is {amount} more than what you have left this month.': 'Ова е {amount} повеќе од тоа што ти останува овој месец.',
        'This purchase would use {pct}% of your remaining money.': 'Ова купување би потрошило {pct}% од парите што ти останале.',
        'Current balance': 'Тековна состојба',
        'After purchase': 'По купувањето',
        'Share of monthly income': 'Дел од месечниот приход',
        'Budget left after': 'Остаток од буџетот',
        'Over budget by': 'Над буџетот за',

        // Budget
        'Monthly Budget': 'Месечен буџет',
        'Edit': 'Уреди',
        'Overall': 'Вкупно',
        'Categories (leave empty for no limit)': 'Категории (остави празно ако нема лимит)',
        'Save Budget': 'Зачувај буџет',
        'Over by {amount}': 'Надминато за {amount}',
        '{amount} left': 'Остануваат {amount}',
        "You've exceeded your overall budget by {amount}.": 'Вкупниот буџет е надминат за {amount}.',
        "You've exceeded your {cat} budget by {amount}.": 'Буџетот за {cat} е надминат за {amount}.',
        'No budgets yet. Tap Edit to set your first one.': 'Сè уште нема буџети. Допри „Уреди“ за да поставиш прв.',

        // Goals
        'Savings Goals': 'Цели за штедење',
        '+ New': '+ Нова',
        '+ Add': '+ Додај',
        'No goals yet. Tap + New to create one.': 'Сè уште нема цели. Допри „+ Нова“ за да направиш.',
        '{pct}% · {amount} remaining': '{pct}% · остануваат {amount}',
        '🎉 Goal reached!': '🎉 Целта е постигната!',
        'New Goal': 'Нова цел',
        'Edit Goal': 'Уреди цел',
        'Name': 'Име',
        'Icon': 'Икона',
        '🏖 Trip': '🏖 Патување',
        '📱 Phone': '📱 Телефон',
        '💻 PC': '💻 Компјутер',
        '🚗 Car': '🚗 Автомобил',
        '🛡 Emergency fund': '🛡 Фонд за итни случаи',
        '🎁 Gift': '🎁 Подарок',
        '🎯 Other': '🎯 Друго',
        'Goal amount': 'Износ на целта',
        'Already saved': 'Веќе заштедено',
        'Save Goal': 'Зачувај цел',
        'Greece Trip': 'Патување во Грција',
        'Add to goal': 'Додај на цел',
        'Add to {name}': 'Додај на {name}',
        'Add': 'Додај',
        'Delete "{name}"?': 'Да избришам „{name}“?',

        // Subscriptions
        'Subscriptions': 'Претплати',
        'No subscriptions yet.': 'Сè уште нема претплати.',
        'Monthly': 'Месечно',
        'Monthly total': 'Месечно вкупно',
        'Yearly': 'Годишно',
        "You're spending {amount} per year on subscriptions.": 'Годишно трошиш {amount} на претплати.',
        'Add Subscription': 'Додај претплата',
        'Edit Subscription': 'Уреди претплата',
        'Monthly price': 'Месечна цена',
        'Save Subscription': 'Зачувај претплата',
        'Netflix': 'Netflix',

        // Transactions + Add Expense
        'Transactions': 'Трансакции',
        '🔍 Search': '🔍 Пребарај',
        'All categories': 'Сите категории',
        'No transactions found.': 'Нема пронајдени трансакции.',
        'Today': 'Денес',
        'Yesterday': 'Вчера',
        'Add Expense': 'Додај трошок',
        'Edit Expense': 'Уреди трошок',
        'Save Changes': 'Зачувај промени',
        'Add expense': 'Додај трошок',
        'Amount': 'Износ',
        'Category': 'Категорија',
        'Description': 'Опис',
        'Date': 'Датум',
        'Payment': 'Плаќање',
        'Cash': 'Готовина',
        'Card': 'Картичка',
        'Bank': 'Банка',
        'Lunch': 'Ручек',
        'Delete this expense?': 'Да го избришам овој трошок?',
        'Expense added ✓': 'Трошокот е додаден ✓',
        'Expense updated ✓': 'Трошокот е ажуриран ✓',
        'Expense deleted': 'Трошокот е избришан',

        // Settings
        'Settings': 'Поставки',
        'Your name': 'Твоето име',
        'David': 'Давид',
        'Monthly income': 'Месечен приход',
        'Currency': 'Валута',
        'Currency is only a label. Amounts are not converted.': 'Валутата е само ознака. Износите не се претвораат.',
        'Language': 'Јазик',
        'Save': 'Зачувај',
        'Export CSV': 'Извези CSV',
        'Delete all data': 'Избриши ги сите податоци',
        'Nothing to export yet.': 'Сè уште нема што да се извезе.',
        'Delete ALL your data? This cannot be undone.': 'Да ги избришам СИТЕ твои податоци? Ова не може да се врати.',

        // Мени долу
        'Home': 'Почетна',
        'Stats': 'Статистика',
        'Budget': 'Буџет',
        'Goals': 'Цели',
        'History': 'Историја',

        // Категории
        'Food': 'Храна',
        'Transport': 'Превоз',
        'Groceries': 'Намирници',
        'Housing': 'Домување',
        'Shopping': 'Шопинг',
        'Entertainment': 'Забава',
        'Health': 'Здравје',
        'Education': 'Образование',
        'Travel': 'Патувања',
        'Other': 'Друго'
    }
};

// ============ ЈАЗИК ============
const LOCALES = { en: 'en-GB', mk: 'mk-MK' };
let currentLang = 'en';
const warned = new Set();

function setLanguage(lang) {
    currentLang = LOCALES[lang] ? lang : 'en';
    document.documentElement.lang = currentLang;
}

function detectLanguage() {
    return (navigator.language || '').toLowerCase().startsWith('mk') ? 'mk' : 'en';
}

function locale() {
    return LOCALES[currentLang];
}

// t('You spent {amount}.', { amount: '€5' })
function t(key, params) {
    const dict = DICT[currentLang];
    let text = key;

    if (dict) {
        if (Object.hasOwn(dict, key)) {
            text = dict[key];
        } else if (/[A-Za-z]{3}/.test(key) && !warned.has(key)) {
            warned.add(key);
            console.warn('Missing translation:', key);   // ти кажува што си заборавил да преведеш
        }
    }

    // една постапка, па текст од корисникот (опис) никогаш не се третира како {параметар}
    return params
        ? text.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m))
        : text;
}

// ============ ДАТУМИ ============
function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function getMonthName(date, style = 'long') {
    return date.toLocaleDateString(locale(), { month: style });
}

function monthTitle(date) {
    return cap(getMonthName(date)) + ' ' + date.getFullYear();
}

// ============ ПРЕВОД НА СТАТИЧНИОТ HTML ============
const originalText = new WeakMap();   // текстуален јазол → оригинален англиски текст

function translateDom() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
        const tag = node.parentElement.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') continue;

        if (!originalText.has(node)) {
            const key = node.nodeValue.trim();
            if (!key || !Object.hasOwn(DICT.mk, key)) continue;   // само познати текстови
            originalText.set(node, {
                key,
                pre: node.nodeValue.match(/^\s*/)[0],
                post: node.nodeValue.match(/\s*$/)[0]
            });
        }

        const o = originalText.get(node);
        node.nodeValue = o.pre + t(o.key) + o.post;
    }

    // placeholder и aria-label
    document.querySelectorAll('[placeholder], [aria-label]').forEach(el => {
        el._i18n = el._i18n || {};
        ['placeholder', 'aria-label'].forEach(attr => {
            if (!el.hasAttribute(attr)) return;
            if (!(attr in el._i18n)) el._i18n[attr] = el.getAttribute(attr);
            el.setAttribute(attr, t(el._i18n[attr]));
        });
    });
}