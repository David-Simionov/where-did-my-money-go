// ============ PRO: ТЕСТ НА ИНТЕРЕС ============
// Не продава ништо. Мери колку луѓе се заинтересирани и по која цена.

const PRO_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScjLHB8cQhHO1qYRI-I26qtzeGmgT6PzH_9jUe-Lp0nBIItGw/viewform';        // залепи го линкот од твојот Google Form
const PRO_FORM_READY = !PRO_FORM_URL.includes('ВАШ-ЛИНК');
const PRO_PLANS = ['monthly', 'yearly', 'lifetime'];

const pr = (id) => document.getElementById(id);
const proModal = pr('proModal');

// ---------- Броење ----------
// Безбедно: не паѓа ако скриптата е блокирана (adblock) или си офлајн.
function track(path, title) {
    try {
        if (window.goatcounter && window.goatcounter.count) {
            window.goatcounter.count({ path, title: title || path, event: true });
            return true;
        }
    } catch (e) {}
    return false;
}

// Еднаш по уред: еден љубопитен корисник што допира 5 пати не ги надувува бројките.
function trackOnce(path, title) {
    let done = [];
    try { done = JSON.parse(localStorage.getItem('proTracked')) || []; } catch (e) {}
    if (done.includes(path)) return;

    if (!track(path, title)) return;   // не е испратено: пробај повторно следниот пат

    done.push(path);
    try { localStorage.setItem('proTracked', JSON.stringify(done)); } catch (e) {}
}

// ---------- Прозорец ----------
function markPlan(plan) {
    document.querySelectorAll('.pro-plan').forEach(b => {
        b.classList.toggle('pro-plan--active', b.dataset.plan === plan);
    });
}

function openPro(source) {
    trackOnce('pro-open-' + source, 'PRO opened (' + source + ')');
    markPlan(localStorage.getItem('proPlan'));
    proModal.classList.add('modal--open');
}

function closePro() {
    proModal.classList.remove('modal--open');
}

pr('proHeaderBtn').addEventListener('click', () => openPro('header'));
pr('proSettingsBtn').addEventListener('click', () => {
    closeSettingsModal();
    openPro('settings');
});
pr('closePro').addEventListener('click', closePro);
pr('proBackdrop').addEventListener('click', closePro);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePro(); });

// ---------- Избор на план ----------
pr('proPlans').addEventListener('click', (e) => {
    const btn = e.target.closest('.pro-plan');
    if (!btn || !PRO_PLANS.includes(btn.dataset.plan)) return;

    const plan = btn.dataset.plan;
    try { localStorage.setItem('proPlan', plan); } catch (err) {}
    markPlan(plan);
    trackOnce('pro-plan-' + plan, 'PRO plan chosen: ' + plan);
});

// ---------- Листа на чекање ----------
pr('proJoin').href = PRO_FORM_READY ? PRO_FORM_URL : '#';

pr('proJoin').addEventListener('click', (e) => {
    if (!PRO_FORM_READY) {
        e.preventDefault();
        console.warn('PRO_FORM_URL не е поставен во js/pro.js');
        showToast(t('Coming soon'));
        return;
    }
    trackOnce('pro-join', 'PRO waiting list click');
});