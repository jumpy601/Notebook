/* 手寫小筆記 Service Worker */
var CACHE = 'hwnote-v42';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './huninn.woff2',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './pdf.min.js',
  './pdf.worker.min.js'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return;

  /* app shell: network-first so updates land, cache fallback when offline */
  if(req.mode === 'navigate' || url.pathname.slice(-11) === '/index.html'){
    e.respondWith(
      fetch(req).then(function(r){
        var cp = r.clone();
        caches.open(CACHE).then(function(c){ c.put('./index.html', cp); });
        return r;
      }).catch(function(){
        return caches.match('./index.html').then(function(hit){
          return hit || caches.match('./');
        });
      })
    );
    return;
  }

  /* static assets: cache-first */
  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(r){
        var cp = r.clone();
        caches.open(CACHE).then(function(c){ c.put(req, cp); });
        return r;
      });
    })
  );
});
