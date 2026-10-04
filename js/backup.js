// ============ РЕЗЕРВНА КОПИЈА ============
// Користи од другите датотеки: expenses, budgets, goals, subs, settings, recurring,
// CATEGORIES, CURRENCIES, LOCALES, MAX_AMOUNT, toISODate, newId, showToast, t, locale.

const bk = (id) => document.getElementById(id);

const BACKUP_APP = 'where-did-my-money-go';
const BACKUP_VERSION = 1;
const BACKUP_MAX_BYTES = 10 * 1024 * 1024;
const BACKUP_MAX_ROWS = 20000;

const CAT_NAMES = new Set(CATEGORIES.map(c => c.name));
const PAYMENTS = ['Cash', 'Card', 'Bank'];

// ---------- 1. Проверка и чистење на податоци од датотеката ----------
// Датотеката не е доверлива: секое поле се проверува, а на лошо се дава безбедна вредност.
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const cleanStr = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const cleanNum = (v) => (typeof v === 'number' && isFinite(v) ? v : NaN);

function cleanMoney(v) {
    const n = cleanNum(v);
    return n > 0 && n <= MAX_AMOUNT ? Math.round(n * 100) / 100 : NaN;
}

function validDate(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) &&
        toISODate(new Date(s + 'T00:00:00')) === s;   // одбива 2026-02-31
}

// ID-ата влегуваат во HTML (data-id), па смеат да содржат само безбедни знаци и мора да се уникатни
function idMaker() {
    const used = new Set();
    return (v) => {
        let id = typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : newId();
        while (used.has(id)) id = newId();
        used.add(id);
        return id;
    };
}

function cleanList(list, fn) {
    const out = [];
    let skipped = 0;
    (Array.isArray(list) ? list : []).forEach(item => {
        const c = fn(item);
        if (c) out.push(c); else skipped++;
    });
    return { out, skipped };
}

function cleanBackup(d) {
    const out = { skipped: 0 };
    const goalIcons = [...document.querySelectorAll('#goalIcon option')].map(o => o.value);
    const eId = idMaker(), gId = idMaker(), sId = idMaker(), rId = idMaker();
    const safeCat = (c) => (CAT_NAMES.has(c) ? c : 'Other');
    const safePay = (p) => (PAYMENTS.includes(p) ? p : 'Card');

    // трошоци (задолжително)
    const ex = cleanList(d.expenses, (e) => {
        if (!isObj(e)) return null;
        const amount = cleanMoney(e.amount);
        if (isNaN(amount) || !validDate(e.date)) return null;

        const item = {
            id: eId(e.id),
            amount,
            category: safeCat(e.category),
            description: cleanStr(e.description, 100),
            date: e.date,
            payment: safePay(e.payment)
        };
        if (typeof e.rec === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(e.rec)) item.rec = e.rec;
        return item;
    });
    out.expenses = ex.out;
    out.skipped += ex.skipped;

    // буџети
    if (isObj(d.budgets)) {
        const overall = cleanNum(d.budgets.overall);
        const categories = {};
        if (isObj(d.budgets.categories)) {
            Object.entries(d.budgets.categories).forEach(([k, v]) => {
                const m = cleanMoney(v);
                if (CAT_NAMES.has(k) && !isNaN(m)) categories[k] = m;
            });
        }
        out.budgets = { overall: overall > 0 && overall <= MAX_AMOUNT ? overall : 0, categories };
    }

    // цели
    if (Array.isArray(d.goals)) {
        const g = cleanList(d.goals, (x) => {
            if (!isObj(x)) return null;
            const name = cleanStr(x.name, 40);
            const target = cleanMoney(x.target);
            const saved = cleanNum(x.saved);
            if (!name || isNaN(target)) return null;
            return {
                id: gId(x.id), name,
                icon: goalIcons.includes(x.icon) ? x.icon : '🎯',
                target,
                saved: saved >= 0 && saved <= MAX_AMOUNT ? saved : 0
            };
        });
        out.goals = g.out;
        out.skipped += g.skipped;
    }

    // претплати
    if (Array.isArray(d.subs)) {
        const s = cleanList(d.subs, (x) => {
            if (!isObj(x)) return null;
            const name = cleanStr(x.name, 40);
            const amount = cleanMoney(x.amount);
            if (!name || isNaN(amount)) return null;
            return { id: sId(x.id), name, amount };
        });
        out.subs = s.out;
        out.skipped += s.skipped;
    }

    // повторливи трошоци
    if (Array.isArray(d.recurring)) {
        const r = cleanList(d.recurring, (x) => {
            if (!isObj(x)) return null;
            const amount = cleanMoney(x.amount);
            const day = Number(x.day);
            if (isNaN(amount) || !Number.isInteger(day) || day < 1 || day > 31) return null;
            if (typeof x.last !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(x.last)) return null;
            return {
                id: rId(x.id), amount,
                category: safeCat(x.category),
                description: cleanStr(x.description, 100),
                payment: safePay(x.payment),
                day, last: x.last
            };
        });
        out.recurring = r.out;
        out.skipped += r.skipped;
    }

    // поставки
    if (isObj(d.settings)) {
        const s = d.settings;
        const income = cleanNum(s.income);
        out.settings = {
            name: cleanStr(s.name, 30),
            income: income >= 0 && income <= MAX_AMOUNT ? income : 0,
            currency: typeof s.currency === 'string' && Object.hasOwn(CURRENCIES, s.currency) ? s.currency : 'EUR',
            language: typeof s.language === 'string' && Object.hasOwn(LOCALES, s.language) ? s.language : 'en'
        };
    }

    if (d.theme === 'light' || d.theme === 'dark') out.theme = d.theme;

    return out;
}

// ---------- 2. Правење копија ----------
function buildBackup() {
    return {
        app: BACKUP_APP,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        data: {
            expenses, budgets, goals, subs, settings, recurring,
            theme: localStorage.getItem('theme') || 'light'
        }
    };
}

async function saveBackupFile() {
    const name = `money-backup-${toISODate(new Date())}.json`;
    const file = new File([JSON.stringify(buildBackup(), null, 2)], name, { type: 'application/json' });

    // на телефон: листот за споделување (Save to Files, Google Drive, ...)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: name });
            return true;
        } catch (err) {
            if (err.name === 'AbortError') return false;   // корисникот одустанал
            // друга грешка: паѓаме на обично превземање
        }
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
}

bk('backupBtn').addEventListener('click', async () => {
    if (await saveBackupFile()) {
        localStorage.setItem('lastBackup', toISODate(new Date()));
        updateBackupInfo();
        showToast(t('Backup saved ✓'));
    }
});

// ---------- 3. Враќање ----------
function applyRestore(clean) {
    const writes = { expenses: clean.expenses };
    ['budgets', 'goals', 'subs', 'settings', 'recurring'].forEach(k => {
        if (clean[k] !== undefined) writes[k] = clean[k];
    });

    const keys = Object.keys(writes);
    if (clean.theme) keys.push('theme');
    const before = keys.map(k => localStorage.getItem(k));

    try {
        Object.keys(writes).forEach(k => localStorage.setItem(k, JSON.stringify(writes[k])));
        if (clean.theme) localStorage.setItem('theme', clean.theme);   // темата е обичен текст, не JSON
    } catch {
        // нема место: врати го како што било
        keys.forEach((k, i) => (before[i] === null ? localStorage.removeItem(k) : localStorage.setItem(k, before[i])));
        alert(t('Could not restore the backup.'));
        return;
    }

    sessionStorage.setItem('restored', '1');
    location.reload();
}

bk('restoreFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > BACKUP_MAX_BYTES) return alert(t('This backup file is too large.'));

    let raw;
    try {
        raw = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
    } catch {
        return alert(t('This is not a valid backup file.'));
    }

    if (!isObj(raw) || raw.app !== BACKUP_APP || !isObj(raw.data) || !Array.isArray(raw.data.expenses)) {
        return alert(t('This is not a valid backup file.'));
    }
    if (typeof raw.version === 'number' && raw.version > BACKUP_VERSION) {
        return alert(t('This backup was made by a newer version of the app.'));
    }
    if (raw.data.expenses.length > BACKUP_MAX_ROWS) return alert(t('This backup file is too large.'));

    const clean = cleanBackup(raw.data);

    const when = typeof raw.exportedAt === 'string' && !isNaN(Date.parse(raw.exportedAt))
        ? new Date(raw.exportedAt).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' })
        : '?';

    let message = t('Restore backup from {date}? It has {n} expenses. This replaces your current data ({m} expenses).', {
        date: when, n: clean.expenses.length, m: expenses.length
    });
    if (clean.skipped) message += '\n\n' + t('{n} invalid entries will be skipped.', { n: clean.skipped });

    if (confirm(message)) applyRestore(clean);
});

// ---------- 4. Информација во Settings ----------
function daysSince(iso) {
    return Math.floor((Date.now() - new Date(iso + 'T00:00:00').getTime()) / 86400000);
}

function updateBackupInfo() {
    const el = bk('backupInfo');
    const last = localStorage.getItem('lastBackup');
    const valid = typeof last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(last);

    el.textContent = valid
        ? t('Last backup: {date}', {
            date: new Date(last + 'T00:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' })
        })
        : t('No backup yet. Your data lives only on this device.');

    // црвено ако има податоци, а копијата е стара (над 30 дена) или ја нема
    el.classList.toggle('settings__hint--warn', expenses.length > 0 && (!valid || daysSince(last) > 30));
}

bk('openSettings').addEventListener('click', updateBackupInfo);

// порака по успешно враќање (страницата се освежува)
if (sessionStorage.getItem('restored')) {
    sessionStorage.removeItem('restored');
    setTimeout(() => showToast(t('Backup restored ✓')), 2200);   // по splash-от
}