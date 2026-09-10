self.addEventListener('install', () => {
    // apenas força instalação imediata
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // assume controle imediatamente e remove versões antigas
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // NÃO intercepta requisições → sempre rede normal
    return;
});

// self.addEventListener('install', e => {
//     e.waitUntil(
//         caches.open('sabor-cia-v3').then(cache => {
//             return cache.addAll(['./', 'sobre', 'contato']);
//         })
//     );
// });

// self.addEventListener('fetch', e => {
//     e.respondWith(
//         caches.match(e.request).then(res => res || fetch(e.request))
//     );
// });