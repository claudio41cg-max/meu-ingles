const CACHE='meu-ingles-v13';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./upgrade-v6.js','./live-v7.css','./live-config.js','./live-v7.js','./hard-v8.js','./home-v10.css','./home-v10.js','./coach-v11.css','./coach-v11.js','./gemini-voice-v12.js','./gemini-chat-v12.js','./course-v12.css','./course-v12.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))).then(()=>self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
async function injectUpgrade(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html')) return response;
  let text=await response.text();
  if(!text.includes('upgrade-v6.js')) text=text.replace('</body>','<script src="./upgrade-v6.js?v=6"></script></body>');
  if(!text.includes('live-v7.css')) text=text.replace('</head>','<link rel="stylesheet" href="./live-v7.css?v=7"></head>');
  if(!text.includes('home-v10.css')) text=text.replace('</head>','<link rel="stylesheet" href="./home-v10.css?v=10"></head>');
  if(!text.includes('coach-v11.css')) text=text.replace('</head>','<link rel="stylesheet" href="./coach-v11.css?v=11"></head>');
  if(!text.includes('course-v12.css')) text=text.replace('</head>','<link rel="stylesheet" href="./course-v12.css?v=12"></head>');
  if(!text.includes('live-config.js')) text=text.replace('</body>','<script src="./live-config.js?v=9"></script></body>');
  if(!text.includes('live-v7.js')) text=text.replace('</body>','<script src="./live-v7.js?v=7"></script></body>');
  if(!text.includes('hard-v8.js')) text=text.replace('</body>','<script src="./hard-v8.js?v=8"></script></body>');
  if(!text.includes('home-v10.js')) text=text.replace('</body>','<script src="./home-v10.js?v=10"></script></body>');
  if(!text.includes('coach-v11.js')) text=text.replace('</body>','<script src="./coach-v11.js?v=11"></script></body>');
  if(!text.includes('gemini-voice-v12.js')) text=text.replace('</body>','<script src="./gemini-voice-v12.js?v=12"></script></body>');
  if(!text.includes('gemini-chat-v12.js')) text=text.replace('</body>','<script src="./gemini-chat-v12.js?v=12"></script></body>');
  if(!text.includes('course-v12.js')) text=text.replace('</body>','<script src="./course-v12.js?v=12"></script></body>');
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=utf-8');
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const isPage=event.request.mode==='navigate'||event.request.destination==='document';
  if(isPage){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return injectUpgrade(response);
    }).catch(async()=>{
      const cached=await caches.match(event.request)||await caches.match('./index.html');
      return cached?injectUpgrade(cached):Response.error();
    }));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    return response;
  })));
});