(()=>{
'use strict';
const KEY='meuInglesAiCostV1';
const MODEL_TTS='gemini-2.5-flash-preview-tts';
const MODEL_LIVE='gemini-3.1-flash-live-preview';
const PRICE={
 tts:{textIn:0.50/1e6,audioOut:10/1e6},
 live:{textIn:0.75/1e6,textOut:4.50/1e6,audioInSec:0.005/60,audioOutSec:0.018/60}
};
let sessionStart=Date.now();
let session={usd:0,ttsUsd:0,liveUsd:0,tokens:0,turns:0,liveInSec:0,liveOutSec:0};
function blank(){return{events:[]}}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return{x:{...blank(),...x}}.x}catch{return blank()}}
function save(x){try{x.events=(x.events||[]).slice(-2500);localStorage.setItem(KEY,JSON.stringify(x))}catch{}}
function add(kind,data={}){
 const x=load(),e={ts:Date.now(),kind,...data};x.events.push(e);save(x);
 const usd=Number(e.usd)||0;session.usd+=usd;session.tokens+=Number(e.tokens)||0;
 if(kind.startsWith('tts'))session.ttsUsd+=usd;else if(kind.startsWith('live'))session.liveUsd+=usd;
 if(kind==='live-turn')session.turns++; if(kind==='live-in')session.liveInSec+=Number(e.seconds)||0;if(kind==='live-out')session.liveOutSec+=Number(e.seconds)||0;
 render();
}
function tokenDetails(meta,key){
 const a=meta?.[key]||meta?.[key.replace('Tokens','Token') ]||[];
 const out={text:0,audio:0,other:0};
 for(const d of Array.isArray(a)?a:[]){const n=Number(d?.tokenCount||d?.token_count)||0,m=String(d?.modality||d?.mediaType||'').toUpperCase();if(m.includes('AUDIO'))out.audio+=n;else if(m.includes('TEXT'))out.text+=n;else out.other+=n}
 return out;
}
function recordTTS(d,payload={}){
 const m=d?.usageMetadata||d?.usage_metadata||{};
 let input=Number(m.promptTokenCount||m.prompt_token_count)||0;
 let output=Number(m.candidatesTokenCount||m.candidates_token_count)||0;
 const pd=tokenDetails(m,'promptTokensDetails'),rd=tokenDetails(m,'candidatesTokensDetails');
 if(!input)input=Math.ceil(String(payload.text||'').length/4);
 let seconds=0;
 try{const b64=String(d?.audio||'');const bytes=Math.floor(b64.length*3/4);seconds=bytes/(2*(Number(d?.sample_rate)||24000));}catch{}
 if(!output&&seconds)output=Math.round(seconds*25);
 const usd=input*PRICE.tts.textIn+output*PRICE.tts.audioOut;
 add('tts',{usd,tokens:input+output,inputTokens:input,outputTokens:output,seconds,model:d?.model||MODEL_TTS,usageMetadata:!!d?.usageMetadata});
}
function recordLiveAudioIn(bytes,rate=16000){const seconds=Math.max(0,Number(bytes)||0)/(2*Math.max(1,Number(rate)||16000));if(seconds)add('live-in',{seconds,usd:seconds*PRICE.live.audioInSec,model:MODEL_LIVE})}
function recordLiveAudioOut(bytes,rate=24000){const seconds=Math.max(0,Number(bytes)||0)/(2*Math.max(1,Number(rate)||24000));if(seconds)add('live-out',{seconds,usd:seconds*PRICE.live.audioOutSec,model:MODEL_LIVE})}
function recordLiveUsage(m){
 const meta=m?.usageMetadata||m?.usage_metadata;if(!meta)return;
 const p=Number(meta.promptTokenCount||meta.prompt_token_count)||0,r=Number(meta.responseTokenCount||meta.candidatesTokenCount||meta.response_token_count||meta.candidates_token_count)||0,t=Number(meta.thoughtsTokenCount||meta.thoughts_token_count)||0;
 const pd=tokenDetails(meta,'promptTokensDetails'),rd=tokenDetails(meta,'responseTokensDetails');
 const textIn=pd.text||Math.max(0,p-pd.audio-pd.other),textOut=rd.text||Math.max(0,r-rd.audio-rd.other);
 const usd=textIn*PRICE.live.textIn+(textOut+t)*PRICE.live.textOut;
 if(p||r||t)add('live-usage',{usd,tokens:p+r+t,inputTokens:p,outputTokens:r,thinkingTokens:t,model:MODEL_LIVE});
}
function liveTurn(){add('live-turn',{usd:0})}
function since(ts){return(load().events||[]).filter(e=>e.ts>=ts)}
function sum(arr){return arr.reduce((a,e)=>{a.usd+=Number(e.usd)||0;a.tokens+=Number(e.tokens)||0;a.tts+=e.kind.startsWith('tts')?(Number(e.usd)||0):0;a.live+=e.kind.startsWith('live')?(Number(e.usd)||0):0;a.turns+=e.kind==='live-turn'?1:0;a.inSec+=e.kind==='live-in'?(Number(e.seconds)||0):0;a.outSec+=e.kind==='live-out'?(Number(e.seconds)||0):0;a.ttsSec+=e.kind==='tts'?(Number(e.seconds)||0):0;return a},{usd:0,tokens:0,tts:0,live:0,turns:0,inSec:0,outSec:0,ttsSec:0})}
function startDay(d=new Date()){return new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()}
function startMonth(d=new Date()){return new Date(d.getFullYear(),d.getMonth(),1).getTime()}
function fmt(n){return 'US$ '+(Number(n)||0).toFixed(4).replace('.',',')}
function mins(s){return((Number(s)||0)/60).toFixed(1).replace('.',',')+' min'}
function modal(){
 let m=document.getElementById('miAiCostModal');if(m)return m;
 m=document.createElement('div');m.id='miAiCostModal';m.innerHTML=`<div class="mi-cost-card">
 <div class="mi-cost-head"><div><h2>💳 Créditos IA</h2><p>Meu Inglês · medição local por uso real</p></div><button class="mi-cost-close" aria-label="Fechar">×</button></div>
 <div class="mi-cost-grid">
  <div class="mi-cost-box"><small>Sessão atual</small><b id="miSession">US$ 0,0000</b><em id="miSessionMeta">0 tokens</em></div>
  <div class="mi-cost-box"><small>Hoje</small><b id="miToday">US$ 0,0000</b><em id="miTodayMeta">0 turnos Live</em></div>
  <div class="mi-cost-box"><small>Últimos 7 dias</small><b id="mi7">US$ 0,0000</b><em id="mi7Meta">0 tokens</em></div>
  <div class="mi-cost-box"><small>Mês atual</small><b id="miMonth">US$ 0,0000</b><em id="miMonthMeta">projeção: US$ 0,00/mês</em></div>
 </div>
 <div class="mi-cost-section"><h3>Consumo de hoje</h3>
  <div class="mi-cost-row"><span>Gemini 2.5 TTS</span><span id="miTts">US$ 0,0000</span></div>
  <div class="mi-cost-row"><span>Gemini 3.1 Live</span><span id="miLive">US$ 0,0000</span></div>
  <div class="mi-cost-row"><span>Áudio enviado ao Live</span><span id="miIn">0,0 min</span></div>
  <div class="mi-cost-row"><span>Áudio recebido do Live</span><span id="miOut">0,0 min</span></div>
  <div class="mi-cost-row"><span>Voz TTS gerada</span><span id="miTtsMin">0,0 min</span></div>
 </div>
 <div class="mi-cost-section"><h3>Projeção mensal se o uso continuar igual</h3>
  <div class="mi-cost-row"><span>1 aluno</span><span id="miP1">US$ 0,00</span></div>
  <div class="mi-cost-row"><span>10 alunos</span><span id="miP10">US$ 0,00</span></div>
  <div class="mi-cost-row"><span>50 alunos</span><span id="miP50">US$ 0,00</span></div>
  <div class="mi-cost-row"><span>100 alunos</span><span id="miP100">US$ 0,00</span></div>
  <p class="mi-cost-sub"><span class="mi-cost-pill">Estimativa</span> O Google Cloud continua sendo a fonte final da cobrança. Este painel mede apenas o Meu Inglês neste aparelho, separando TTS e Live.</p>
 </div></div>`;
 document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.mi-cost-close'))m.classList.remove('open')});return m;
}
function install(){
 if(!document.getElementById('miAiCostBtn')){const h=document.querySelector('header');if(h){const b=document.createElement('button');b.id='miAiCostBtn';b.type='button';b.title='Créditos IA';b.textContent='💳';b.onclick=()=>{modal().classList.add('open');render()};const av=h.querySelector('.avatar');h.insertBefore(b,av||null)}}
 modal();render();
}
function render(){
 if(!document.getElementById('miAiCostModal'))return;
 const now=new Date(),today=sum(since(startDay(now))),week=sum(since(Date.now()-7*864e5)),month=sum(since(startMonth(now)));
 const elapsed=Math.max(1,now.getDate()),days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(),proj=month.usd/elapsed*days;
 const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
 set('miSession',fmt(session.usd));set('miSessionMeta',Math.round(session.tokens).toLocaleString('pt-BR')+' tokens');
 set('miToday',fmt(today.usd));set('miTodayMeta',today.turns+' turnos Live');
 set('mi7',fmt(week.usd));set('mi7Meta',Math.round(week.tokens).toLocaleString('pt-BR')+' tokens');
 set('miMonth',fmt(month.usd));set('miMonthMeta','projeção: '+fmt(proj)+'/mês');
 set('miTts',fmt(today.tts));set('miLive',fmt(today.live));set('miIn',mins(today.inSec));set('miOut',mins(today.outSec));set('miTtsMin',mins(today.ttsSec));
 set('miP1',fmt(proj));set('miP10',fmt(proj*10));set('miP50',fmt(proj*50));set('miP100',fmt(proj*100));
}
window.MeuInglesAiCost={recordTTS,recordLiveAudioIn,recordLiveAudioOut,recordLiveUsage,liveTurn,open(){modal().classList.add('open');render()},render};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();