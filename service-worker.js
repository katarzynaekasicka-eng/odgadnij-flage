const CACHE="odgadnij-flage-icon-v22";
const ASSETS=["./", "./index.html", "./manifest.json", "./icons/icon-48.png", "./icons/icon-72.png", "./icons/icon-96.png", "./icons/icon-144.png", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return; e.respondWith(fetch(e.request).catch(async()=>{const c=await caches.open(CACHE);return (await c.match(e.request))||(e.request.mode==='navigate'?await c.match('./index.html'):Response.error());}));});
