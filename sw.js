/* Öğrenci Takip — service worker (v44, 08.10.2026)
   Amaç: telefonda ana ekrandan anında açılış + zayıf bağlantıda çalışma.
   - Uygulama kabuğu (index.html, manifest, ikonlar): önce önbellek, arkada ağdan tazele.
     İçerik değiştiyse açık sayfalara {tur:'yeni-surum'} gönderilir → "Yeni sürüm hazır · Yenile".
   - Google Fonts: önce önbellek.
   - Apps Script (script.google.com / googleusercontent) ve diğer her şey: DOKUNULMAZ (veri her zaman canlı). */
const KABUK = 'ot-kabuk-v1';
const FONT = 'ot-font-v1';
const KABUK_DOSYALAR = ['./', 'index.html', 'manifest.webmanifest',
  'icons/favicon.png', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(KABUK).then(c => c.addAll(KABUK_DOSYALAR)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== KABUK && k !== FONT).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function haberVer() {
  const cs = await self.clients.matchAll({ type: 'window' });
  cs.forEach(c => c.postMessage({ tur: 'yeni-surum' }));
}

/* önce önbellek; arkada ağdan çek, değiştiyse önbelleği yenile ve sayfaya haber ver */
/* NOT: navigate kipindeki Request ek ayarla yeniden fetch EDİLEMEZ (TypeError) — hep URL'den yeni istek kurulur */
async function kabuk(istek, anahtar, ev) {
  const c = await caches.open(KABUK);
  const eski = await c.match(anahtar);
  /* karşılaştırma kopyası ŞİMDİ alınır — eski yanıt sayfaya verilince gövdesi tükenir, sonradan clone() hata verir */
  const eskiMetin = eski && anahtar === 'index.html' ? eski.clone().text() : null;
  const ag = fetch(new URL(anahtar === 'index.html' ? './' : anahtar, self.registration.scope).href, { cache: 'no-cache' }).then(async yanit => {
    if (!yanit || !yanit.ok) return yanit;
    const kopya = yanit.clone();
    if (eskiMetin) {
      const [a, b] = await Promise.all([eskiMetin, kopya.clone().text()]);
      await c.put(anahtar, kopya);
      if (a !== b) haberVer();
    } else {
      await c.put(anahtar, kopya);
    }
    return yanit;
  }).catch(() => null);
  if (ev) ev.waitUntil(ag); /* arka plan tazelemesi bitmeden SW uyutulmasın */
  if (eski) return eski;
  const y = await ag;
  return y || new Response('Çevrimdışı — uygulama henüz bu cihaza kaydedilmedi. İnternete bağlanıp bir kez açın.',
    { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

self.addEventListener('message', e => {
  if (!e.data || e.data.tur !== 'surum-sor') return;
  e.waitUntil(caches.open(KABUK).then(c => c.match('index.html')).then(y => y ? y.text() : '').then(t => {
    const m = /var SURUM_DAMGA="([^"]+)"/.exec(t || '');
    if (e.source) e.source.postMessage({ tur: 'surum', damga: m ? m[1] : '' });
  }));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    if (r.mode === 'navigate' || u.pathname === '/' || u.pathname.endsWith('/index.html')) {
      e.respondWith(kabuk(r, 'index.html', e));
      return;
    }
    const yol = u.pathname.replace(/^\//, '');
    if (KABUK_DOSYALAR.indexOf(yol) >= 0) e.respondWith(kabuk(r, yol, e));
    return;
  }
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONT).then(c => c.match(r).then(h => h || fetch(r).then(y => {
      if (y && (y.ok || y.type === 'opaque')) c.put(r, y.clone());
      return y;
    }))));
  }
  /* script.google.com vb.: tarayıcıya bırak */
});
