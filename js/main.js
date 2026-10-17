// ============ ЈАЗИК: листи и прецртување ============
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

function applyLanguage() {
    setLanguage(settings.language);
    translateDom();
    buildLists();
    refresh();
    renderGoals();
    renderSubs();
}

// ============ PWA ============
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}

let installEvent = null;
const installBtn = document.getElementById('installApp');
const iosHint = document.getElementById('iosHint');

const ua = navigator.userAgent;
const isIOS = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
const isInstalled = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

// Android/Chrome: прелистувачот јавува дека може да се инсталира
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e;
    installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    installBtn.hidden = true;
});

window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

if (isIOS && !isInstalled) iosHint.hidden = false;

// ============ МЕНИ ДОЛУ (екрани) ============
const navButtons = document.querySelectorAll('.nav-btn');

function showPage(name) {
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('page--active', p.id === 'page-' + name);
    });
    navButtons.forEach(b => b.classList.toggle('nav-btn--active', b.dataset.page === name));

    window.scrollTo({ top: 0 });
    scrollActiveChip('auto');
    updateChipFades();
}

navButtons.forEach(b => b.addEventListener('click', () => showPage(b.dataset.page)));

// ============ SPLASH ============
function startApp() {
    const splash = document.getElementById('splash');
    const skip = document.documentElement.classList.contains('no-splash') || reduceMotion;

    // картичките влегуваат една по една
    document.querySelectorAll('.page').forEach(page => {
        page.querySelectorAll('.card').forEach((card, i) => {
            card.style.setProperty('--i', Math.min(i, 4));
        });
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
