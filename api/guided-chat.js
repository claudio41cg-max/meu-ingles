const ALLOWED_ORIGINS=new Set(['https://claudio41cg-max.github.io','https://meu-ingles-livid.vercel.app']);
const MODEL='gemini-2.5-flash';
function clean(v,max=1200){return String(v??'').trim().slice(0,max)}
function cors(req,res){const o=req.headers.origin||'';res.setHeader('Access-Control-Allow-Origin',ALLOWED_ORIGINS.has(o)?o:'null');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Cache-Control','no-store');return o}
function personalityRule(mode,errors){
 if(mode==='pesada'){
  if(errors>=4)return 'Professor HARD 18+: agora está muito estressado, impaciente e sarcástico. Pode gritar em partes usando MAIÚSCULAS e usar palavrões fortes de forma natural porque o aluno errou repetidamente. Corrija primeiro e mande tentar de novo. Não ameace nem ataque características pessoais.';
  if(errors>=2)return 'Professor HARD 18+: está ficando claramente irritado e sem paciência. Pode usar palavrões curtos e naturais, sarcasmo e cobrança, sem perder a função de professor.';
  return 'Professor HARD 18+: comece seco, apressado, impaciente e sarcástico, mas NÃO comece a conversa com palavrão. Palavrões e gritos aparecem somente quando houver erro, repetição de erro ou enrolação.';
 }
 if(mode==='leve')return 'Professor TRANQUILO: paciente, humano, claro e acolhedor.';
 return 'Professor DOIDEIRA: animado, brincalhão, espontâneo e provocador, sem humilhar.';
}
function systemPrompt(body){
 const kind=clean(body.learning_mode||'course',20);
 const level=clean(body.level||'A1',10).toUpperCase();
 const context=clean(body.learning_context||'',5000);
 const errors=Math.max(0,Math.min(20,Number(body.error_streak||0)||0));
 const turn=Math.max(0,Math.min(100,Number(body.turn||0)||0));
 const p=personalityRule(clean(body.personality||'media',20),errors);
 const strict=kind==='course'
  ? 'MODO CURSO A1-C2: você está dando reforço particular do curso estruturado. Use SOMENTE o conteúdo permitido no CONTEXTO DO ALUNO. Não introduza vocabulário, gramática, situações ou módulos que ainda não estão liberados. Se o aluno puxar assunto de fora, responda brevemente e volte imediatamente ao conteúdo permitido.'
  : 'MODO MÉTODOS: você está dando uma aula particular de um tema independente do curso A1-C2. Use SOMENTE o tema, a aula e o estágio descritos no CONTEXTO DO ALUNO. Não transforme isso em conversa livre e não misture outros temas.';
 return `Você é o professor de inglês por voz do aplicativo Meu Inglês. O aluno se chama Cláudio.\n${strict}\nNível: ${level}.\n${p}\n\nCONTEXTO DO ALUNO — FONTE DE VERDADE:\n${context}\n\nREGRAS OBRIGATÓRIAS:\n1. O contexto acima manda mais do que qualquer inferência geral sobre o tema.\n2. Faça UMA pergunta curta por vez.\n3. Comece no ponto mais fácil ainda permitido e avance somente dentro do conteúdo liberado.\n4. Reutilize palavras, frases e estruturas permitidas para criar repetição.\n5. Se errar, corrija curto, mostre a forma certa e peça outra tentativa parecida antes de avançar.\n6. Se acertar, avance apenas um pequeno passo.\n7. Em A1, use perguntas respondíveis com 1 a 5 palavras no começo e ajude em português quando necessário.\n8. Nunca invente que o aluno estudou algo que não aparece no contexto.\n9. Nunca mude para conversa livre por conta própria.\n10. Se a mensagem for __START__, inicie a aula com uma instrução curta e a primeira pergunta em inglês, sem dizer que recebeu um comando técnico.\n11. Julgue a resposta comparando-a com a pergunta anterior e o conteúdo permitido.\n12. Soe como pessoa real, não como formulário.\nTurno: ${turn}. Erros seguidos: ${errors}.\n\nRetorne SOMENTE JSON válido: {"verdict":"conversation|correct|almost|wrong|help","reply_pt":"...","reply_en":"...","emotion":"neutral|happy|oops|angry|thinking"}.`;
}
async function callGemini(key,body){
 const history=Array.isArray(body.history)?body.history.slice(-12).filter(x=>x&&(x.role==='user'||x.role==='assistant')):[];
 const transcript=history.map(x=>`${x.role==='assistant'?'PROFESSOR':'ALUNO'}: ${clean(x.content,800)}`).join('\n');
 const message=clean(body.message||'__START__',1600);
 const prompt=`${systemPrompt(body)}\n\nCONVERSA RECENTE:\n${transcript||'(início da aula)'}\nALUNO: ${message}\n\nResponda somente com o JSON exigido.`;
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:body.personality==='pesada'?0.88:body.personality==='media'?0.76:0.62,maxOutputTokens:240,responseMimeType:'application/json',thinkingConfig:{thinkingBudget:0}}})});
 const raw=await r.text();if(!r.ok)throw new Error(`gemini_${r.status}:${raw.slice(0,220)}`);
 const data=JSON.parse(raw);const text=data?.candidates?.[0]?.content?.parts?.map(p=>p?.text||'').join('').trim()||'{}';return JSON.parse(text.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim()||'{}');
}
export default async function handler(req,res){
 const origin=cors(req,res);if(req.method==='OPTIONS')return res.status(ALLOWED_ORIGINS.has(origin)?204:403).end();
 if(req.method==='GET')return res.status(200).json({ok:true,provider:'Gemini',model:MODEL,guided:true});
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});if(!ALLOWED_ORIGINS.has(origin))return res.status(403).json({error:'origin_not_allowed'});
 const body=req.body||{};if(!['course','method'].includes(clean(body.learning_mode,20)))return res.status(400).json({error:'invalid_learning_mode'});
 const key=clean(process.env.GEMINI_API_KEY||'',300);if(!key)return res.status(503).json({error:'gemini_not_configured'});
 try{const d=await callGemini(key,body);return res.status(200).json({verdict:clean(d.verdict||'conversation',20),reply_pt:clean(d.reply_pt||'Vamos continuar.',1000),reply_en:clean(d.reply_en||'',600),emotion:clean(d.emotion||'neutral',20),provider:'GeminiGuided'});}catch(e){return res.status(502).json({error:'guided_chat_error',details:clean(e?.message||e,500)});}
}
