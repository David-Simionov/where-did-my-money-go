const CACHE = 'money-v1';   // ако некогаш сакаш да го исчистиш кешот кај сите, смени го бројот

const SHELL = [
    './', 'index.html', 'css/style.css', 'js/i18n.js', 'js/app.js',
    'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

function save(req, res) {
    // чуваме само успешни (или "opaque" од Google Fonts) одговори
    if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
    }
    return res;
}

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    const sameOrigin = url.origin === location.origin;
    const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
    if (!sameOrigin && !isFont) return;

    // фонтови: прво кеш (не се менуваат)
    if (isFont) {
        e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => save(req, res))));
        return;
    }

    // наши датотеки: прво мрежа, а без интернет од кеш
    e.respondWith(
        fetch(req)
            .then(res => save(req, res))
            .catch(() => caches.match(req).then(hit =>
                hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
    );
});