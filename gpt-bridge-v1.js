(()=>{
'use strict';

const TURBO='https://turbo-engine-production.up.railway.app';
const TOKEN_KEY='meuIngles.turboToken.v1';
const SESSION_KEY='meuIngles.gptSession.v1';

let loginPromise=null;

function injectLogin(){
  if(document.getElementById('gptTurboLogin'))return;
  const style=document.createElement('style');
  style.textContent=`
  .gptTurboLogin{position:fixed;inset:0;z-index:99999;display:none;place-items:center;padding:18px;background:rgba(3,8,15,.78);backdrop-filter:blur(9px)}
  .gptTurboLogin.open{display:grid}
  .gptTurboCard{width:min(100%,390px);border:1px solid rgba(120,180,255,.28);background:#0b1728;color:#eef6ff;border-radius:20px;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.45)}
  .gptTurboCard h3{margin:0 0 6px}.gptTurboCard p{margin:0 0 14px;color:#9fb2ca;font-size:13px;line-height:1.45}
  .gptTurboCard input{width:100%;margin:0 0 9px;border:1px solid #29415f;background:#07111e;color:white;border-radius:12px;padding:12px 13px;font:inherit}
  .gptTurboActions{display:flex;gap:8px;justify-content:flex-end;margin-top:7px}
  .gptTurboActions button{border:1px solid #29415f;border-radius:11px;padding:10px 13px;font-weight:800}
  .gptTurboCancel{background:#101d2f;color:#e7f1ff}.gptTurboEnter{background:#2586d4;color:white}
  .gptTurboError{min-height:18px;margin-top:7px;color:#ff8698;font-size:12px}
  `;
  document.head.appendChild(style);

  const wrap=document.createElement('div');
  wrap.id='gptTurboLogin';
  wrap.className='gptTurboLogin';
  wrap.innerHTML=`
    <div class="gptTurboCard">
      <h3>Entrar no GPT do Meu Inglês</h3>
      <p>Use o mesmo acesso do Cláudio Turbo Agent. O app guarda apenas o token de sessão neste aparelho.</p>
      <input id="gptTurboUser" autocomplete="username" value="claudio" placeholder="Usuário">
      <input id="gptTurboPass" type="password" autocomplete="current-password" placeholder="Senha do Turbo">
      <div id="gptTurboError" class="gptTurboError"></div>
      <div class="gptTurboActions">
        <button type="button" class="gptTurboCancel" id="gptTurboCancel">Cancelar</button>
        <button type="button" class="gptTurboEnter" id="gptTurboEnter">Entrar</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
}

function login(){
  if(loginPromise)return loginPromise;
  injectLogin();
  const wrap=document.getElementById('gptTurboLogin');
  const user=document.getElementById('gptTurboUser');
  const pass=document.getElementById('gptTurboPass');
  const error=document.getElementById('gptTurboError');
  const enter=document.getElementById('gptTurboEnter');
  const cancel=document.getElementById('gptTurboCancel');

  wrap.classList.add('open');
  error.textContent='';
  setTimeout(()=>pass.focus(),50);

  loginPromise=new Promise((resolve,reject)=>{
    const cleanup=()=>{
      enter.onclick=null;cancel.onclick=null;pass.onkeydown=null;
      wrap.classList.remove('open');
      loginPromise=null;
    };
    const submit=async()=>{
      error.textContent='';
      enter.disabled=true;enter.textContent='Entrando...';
      try{
        const r=await fetch(TURBO+'/__turbo/panel-login',{
          method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({username:user.value.trim(),password:pass.value})
        });
        const d=await r.json().catch(()=>({}));
        if(!r.ok||!d.ok||!d.token)throw new Error(d.error||'Não foi possível entrar.');
        localStorage.setItem(TOKEN_KEY,d.token);
        pass.value='';
        cleanup();
        resolve(d.token);
      }catch(e){
        error.textContent=e?.message||String(e);
      }finally{
        enter.disabled=false;enter.textContent='Entrar';
      }
    };
    enter.onclick=submit;
    cancel.onclick=()=>{cleanup();reject(new Error('Login cancelado.'));};
    pass.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();submit();}};
  });
  return loginPromise;
}

async function token(){
  return localStorage.getItem(TOKEN_KEY)||login();
}

function parseReply(raw){
  const text=String(raw||'').trim();
  if(!text)return {reply_pt:'',reply_en:'',verdict:'conversation',provider:'GPT'};
  let cleaned=text.replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'').trim();
  const first=cleaned.indexOf('{'),last=cleaned.lastIndexOf('}');
  if(first>=0&&last>first)cleaned=cleaned.slice(first,last+1);
  try{
    const d=JSON.parse(cleaned);
    return {
      reply_pt:String(d.reply_pt||d.portugues||'').trim(),
      reply_en:String(d.reply_en||d.english||'').trim(),
      verdict:String(d.verdict||'conversation'),
      provider:'GPT via Turbo'
    };
  }catch{
    const pt=/PORTUGU[EÊ]S\s*:\s*([\s\S]*?)(?:\n\s*(?:INGL[EÊ]S|ENGLISH)\s*:|$)/i.exec(text)?.[1]?.trim()||'';
    const en=/(?:INGL[EÊ]S|ENGLISH)\s*:\s*([\s\S]*)$/i.exec(text)?.[1]?.trim()||'';
    if(pt||en)return {reply_pt:pt,reply_en:en,verdict:'conversation',provider:'GPT via Turbo'};
    return {reply_pt:text,reply_en:'',verdict:'conversation',provider:'GPT via Turbo'};
  }
}

function teacherMode(p){
  return p==='pesada'
    ?'Hard 18+: direto, bem-humorado e adulto, sem ser ofensivo gratuitamente.'
    :p==='media'
      ?'Doideira: animado, brincalhão e espontâneo.'
      :'Tranquilo: paciente, acolhedor e didático.';
}

async function ask(payload,retry=true){
  const auth=await token();
  const history=Array.isArray(payload?.history)?payload.history.slice(-8):[];
  const prompt=[
    'Você é o professor de inglês do aplicativo Meu Inglês.',
    'Esta é a fase de teste da conversa livre. Não controle outras partes do curso ainda.',
    'Nível do aluno: '+String(payload?.level||'A1')+'.',
    'Personalidade: '+teacherMode(payload?.personality)+'.',
    'Cenário: '+String(payload?.scenario||'Livre')+'.',
    'Responda de forma curta, natural e útil.',
    'Quando for apropriado, explique rapidamente em português e dê uma frase/resposta natural em inglês.',
    'Retorne SOMENTE JSON válido, sem markdown, neste formato:',
    '{"reply_pt":"texto em português","reply_en":"texto em inglês","verdict":"conversation"}',
    history.length?'Histórico recente: '+JSON.stringify(history):'',
    'Mensagem do aluno: '+String(payload?.message||'')
  ].filter(Boolean).join('\n');

  const r=await fetch(TURBO+'/__turbo/chat',{
    method:'POST',
    headers:{'content-type':'application/json','authorization':'Bearer '+auth},
    body:JSON.stringify({
      sessionId:localStorage.getItem(SESSION_KEY)||null,
      project:{key:'meu-ingles',name:'Meu Inglês',repo:'claudio41cg-max/meu-ingles'},
      message:prompt
    })
  });
  const d=await r.json().catch(()=>({}));
  if(r.status===401&&retry){
    localStorage.removeItem(TOKEN_KEY);
    return ask(payload,false);
  }
  if(!r.ok||!d.ok)throw new Error(d.error||'GPT indisponível.');
  if(d.sessionId)localStorage.setItem(SESSION_KEY,d.sessionId);
  return parseReply(d.reply);
}

window.meuInglesGptAsk=ask;
window.meuInglesTurboAuth=token;
window.meuInglesTurboBase=TURBO;
window.meuInglesGptReset=()=>{
  localStorage.removeItem(SESSION_KEY);
};
window.meuInglesGptLogout=()=>{
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
};
})();