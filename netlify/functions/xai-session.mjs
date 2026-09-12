const hits=new Map();

function cors(origin,allowed){
  return {
    'Content-Type':'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin===allowed?allowed:'null',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Vary':'Origin',
    'Cache-Control':'no-store'
  };
}

function limited(ip){
  const now=Date.now(),windowMs=60_000,max=8;
  const prev=hits.get(ip)||[];
  const keep=prev.filter(t=>now-t<windowMs);
  keep.push(now);hits.set(ip,keep);
  return keep.length>max;
}

export default async function handler(req){
  const allowed=process.env.ALLOWED_ORIGIN||'https://claudio41cg-max.github.io';
  const origin=req.headers.get('origin')||'';
  const headers=cors(origin,allowed);

  if(req.method==='OPTIONS')return new Response('',{status:204,headers});
  if(req.method!=='POST')return new Response(JSON.stringify({error:'method_not_allowed'}),{status:405,headers});
  if(origin!==allowed)return new Response(JSON.stringify({error:'origin_not_allowed'}),{status:403,headers});

  const ip=req.headers.get('x-nf-client-connection-ip')||req.headers.get('x-forwarded-for')||'unknown';
  if(limited(ip))return new Response(JSON.stringify({error:'rate_limited'}),{status:429,headers});

  const key=process.env.XAI_API_KEY;
  if(!key)return new Response(JSON.stringify({error:'xai_key_not_configured'}),{status:503,headers});

  const ttl=Math.max(30,Math.min(300,Number(process.env.XAI_SESSION_TTL||90)));
  try{
    const upstream=await fetch('https://api.x.ai/v1/realtime/client_secrets',{
      method:'POST',
      headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({expires_after:{seconds:ttl}})
    });
    const body=await upstream.text();
    if(!upstream.ok){
      console.error('xAI session error',upstream.status,body.slice(0,300));
      return new Response(JSON.stringify({error:'xai_session_failed',status:upstream.status}),{status:502,headers});
    }
    const data=JSON.parse(body);
    return new Response(JSON.stringify({value:data.value,expires_at:data.expires_at,model:process.env.XAI_MODEL||'grok-voice-latest',voice:process.env.XAI_VOICE||'eve'}),{status:200,headers});
  }catch(err){
    console.error(err);
    return new Response(JSON.stringify({error:'server_error'}),{status:500,headers});
  }
}
