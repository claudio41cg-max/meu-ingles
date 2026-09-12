const CACHE='meu-ingles-v5';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./upgrade-v5.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

async function injectUpgrade(response){
  const html=await response.text();
  const injected=html.includes('upgrade-v5.js')
    ? html
    : html.replace('</body>','<script src="./upgrade-v5.js?v=5"></script></body>');
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=utf-8');
  headers.set('cache-control','no-cache');
  return new Response(injected,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const isPage=event.request.mode==='navigate'||event.request.destination==='document';

  if(isPage){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return injectUpgrade(response);
      }catch(e){
        const cached=await caches.match(event.request)||await caches.match('./index.html');
        return cached?injectUpgrade(cached):Response.error();
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return response;
    }))
  );
});
