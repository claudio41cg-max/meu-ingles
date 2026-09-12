const CACHE='meu-ingles-v15';
const ESSENTIAL=['./','./index.html','./manifest.webmanifest','./icon.svg','./live-v7.css','./coach-v11.css','./course-v12.css','./fixes-v13.css','./live-config.js','./live-v7.js','./coach-v11.js','./gemini-voice-v12.js','./course-v12.js','./fixes-v13.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ESSENTIAL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.map(key=>key===CACHE?Promise.resolve():caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

async function injectStable(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html')) return response;
  let text=await response.text();

  const headAssets=[
    '<link rel="stylesheet" href="./live-v7.css?v=15">',
    '<link rel="stylesheet" href="./coach-v11.css?v=15">',
    '<link rel="stylesheet" href="./course-v12.css?v=15">',
    '<link rel="stylesheet" href="./fixes-v13.css?v=15">'
  ];
  const bodyAssets=[
    '<script src="./live-config.js?v=15"></script>',
    '<script src="./live-v7.js?v=15"></script>',
    '<script src="./coach-v11.js?v=15"></script>',
    '<script src="./gemini-voice-v12.js?v=15"></script>',
    '<script src="./course-v12.js?v=15"></script>',
    '<script src="./fixes-v13.js?v=15"></script>'
  ];

  for(const tag of headAssets){
    const name=(tag.match(/href="\.\/(.*?)\?/ )||[])[1];
    if(name && !text.includes(name)) text=text.replace('</head>',tag+'</head>');
  }
  for(const tag of bodyAssets){
    const name=(tag.match(/src="\.\/(.*?)\?/ )||[])[1];
    if(name && !text.includes(name)) text=text.replace('</body>',tag+'</body>');
  }

  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=utf-8');
  headers.set('cache-control','no-store');
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const isPage=event.request.mode==='navigate'||event.request.destination==='document';

  if(isPage){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>injectStable(response))
        .catch(async()=>{
          const cached=await caches.match('./index.html');
          return cached?injectStable(cached):Response.error();
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request,{cache:'no-store'})
      .then(response=>{
        if(response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
