const CACHE_NAME='meu-ingles-pwa-v3';
const APP_SHELL=[
  './',
  './index.html',
  './icon.svg',
  './manifest.webmanifest',
  './stable.css?v=8',
  './home-v65.css?v=16',
  './ai-cost-v1.css?v=3',
  './stable.js?v=15',
  './a1-v15.js?v=17',
  './tts-v22.js?v=24',
  './home-v26.js?v=35'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map(url=>cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name!==CACHE_NAME).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  if(url.pathname.endsWith('/gpt-bridge-s20-v2.js')||url.pathname.endsWith('/gpt-bridge-v1.js')){event.respondWith(fetch(req,{cache:'no-store'}));return;}

  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req);
        const cache=await caches.open(CACHE_NAME);
        cache.put('./index.html',fresh.clone()).catch(()=>{});
        return fresh;
      }catch{
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(req);
    const network=fetch(req).then(async fresh=>{
      if(fresh&&fresh.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(req,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }).catch(()=>null);

    if(cached){
      event.waitUntil(network);
      return cached;
    }
    return (await network) || new Response('',{status:504,statusText:'Offline'});
  })());
});
