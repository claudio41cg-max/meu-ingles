const ALLOWED_ORIGINS = new Set([
  "https://claudio41cg-max.github.io",
  "https://meu-ingles-claudio.netlify.app"
]);
const GROQ_MODEL = "openai/gpt-oss-120b";
const GEMINI_MODEL = "gemini-2.5-flash";

function cors(origin: string | null) {
  return {
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "Access-Control-Allow-Origin":ALLOWED_ORIGINS.has(origin||"") ? origin! : "null",
    "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type",
    "Vary":"Origin"
  };
}
function env(name: string) {
  try { return String(Netlify.env.get(name) || "").trim(); }
  catch { return ""; }
}
function cleanJson(text: string) {
  return JSON.parse(String(text||"").replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim() || "{}");
}
function pedagogyRule(level:string,moduleTitle:string,lessonNumber:number){
  if(level==="A1"){
    const firstModule=/primeiros contatos/i.test(moduleTitle);
    return `REGRAS A1 OBRIGATÓRIAS: trate o aluno como iniciante real. Introduza no máximo 2 a 4 palavras novas por aula. Reaproveite palavras já vistas várias vezes em exercícios diferentes antes de aumentar a frase. Prefira substantivos e ações concretas do cotidiano. Frases novas devem ter normalmente 1 a 4 palavras; só aumente quando a estrutura já tiver sido repetida. Evite frases abstratas e genéricas como "practice this topic", "real conversation" ou "this is useful". A explicação em português deve ter no máximo 2 frases curtas. Os exemplos devem parecer algo que uma pessoa realmente falaria. ${firstModule&&lessonNumber>=4?'Neste primeiro módulo, considere já familiares: coffee/café, water/água, milk/leite, please/por favor e a estrutura I want. Reutilize esse vocabulário antes de acrescentar novidade.':''}`;
  }
  if(level==="A2")return "REGRAS A2: introduza poucas estruturas novas por aula, reutilize vocabulário conhecido e mantenha exemplos curtos e cotidianos.";
  return "Aumente a complexidade gradualmente e recicle vocabulário anterior antes de introduzir muita novidade.";
}
function lessonPrompt(body: any) {
  const level=String(body?.level||"A1").toUpperCase().slice(0,2);
  const moduleTitle=String(body?.module_title||"Fundamentos").slice(0,120);
  const grammar=String(body?.grammar||"").slice(0,300);
  const vocabulary=String(body?.vocabulary||"").slice(0,500);
  const canDo=String(body?.can_do||"").slice(0,300);
  const lessonType=String(body?.lesson_type||"Vocabulário e compreensão").slice(0,100);
  const lessonNumber=Math.max(1,Math.min(8,Number(body?.lesson_number||1)||1));
  const pedagogy=pedagogyRule(level,moduleTitle,lessonNumber);
  return `Você é um autor de curso de inglês para brasileiros e trabalha junto com uma professora IA conversacional. Crie UMA aula original para celular. Nunca copie material de cursos, livros ou sites. Nível ${level}. Módulo: ${moduleTitle}. Aula ${lessonNumber}/8. Tipo: ${lessonType}. Gramática: ${grammar}. Vocabulário: ${vocabulary}. Objetivo: ${canDo}.\n${pedagogy}\nA aula será usada num formato híbrido: explicação mínima, vocabulário, escolha de tradução, escuta, montagem de frase curta, repetição oral e conversa final com IA. O aluno deve ver as mesmas palavras reaparecendo em formatos diferentes. A1/A2 usam mais português; B1/B2 equilibram; C1/C2 priorizam inglês natural e nuance.\nRetorne SOMENTE JSON: {"title":"...","goal_pt":"...","explanation_pt":"...","examples":[{"en":"...","pt":"..."}],"vocabulary":[{"en":"...","pt":"..."}],"practice_steps":["..."],"speaking_prompt_en":"...","speaking_help_pt":"...","model_answer_en":"...","mini_reading_en":"...","mini_reading_question_pt":"...","final_task_pt":"..."}. Para A1, use 3 exemplos muito curtos e 3 a 5 itens de vocabulário; para os demais níveis, use 3 a 5 exemplos e 5 a 8 itens.`;
}
async function callGroq(apiKey:string,prompt:string) {
  const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",
    headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({model:GROQ_MODEL,messages:[{role:"system",content:prompt},{role:"user",content:"Crie a aula agora."}],temperature:.62,max_completion_tokens:1600,reasoning_effort:"medium",response_format:{type:"json_object"}})
  });
  if(!r.ok) throw new Error(`groq_${r.status}`);
  const d:any=await r.json();
  return cleanJson(d?.choices?.[0]?.message?.content||"{}");
}
async function callGemini(apiKey:string,prompt:string) {
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,{
    method:"POST",
    headers:{"x-goog-api-key":apiKey,"Content-Type":"application/json"},
    body:JSON.stringify({contents:[{parts:[{text:prompt+"\nCrie a aula agora."}]}],generationConfig:{temperature:.62,responseMimeType:"application/json"}})
  });
  if(!r.ok) throw new Error(`gemini_${r.status}`);
  const d:any=await r.json();
  return cleanJson(d?.candidates?.[0]?.content?.parts?.map((x:any)=>x.text||"").join("")||"{}");
}

export default async(req:Request)=>{
  const origin=req.headers.get("origin"), headers=cors(origin);
  const groqKey=env("GROQ_API_KEY"), geminiKey=env("GEMINI_API_KEY")||env("GEMINI_API_kEY");
  if(req.method==="OPTIONS") return new Response(null,{status:ALLOWED_ORIGINS.has(origin||"")?204:403,headers});
  if(req.method==="GET") return new Response(JSON.stringify({ok:true,key_configured:!!(groqKey||geminiKey),groq_configured:!!groqKey,gemini_configured:!!geminiKey,provider:"Gemini + Groq fallback"}),{status:200,headers});
  if(req.method!=="POST") return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  if(!ALLOWED_ORIGINS.has(origin||"")) return new Response(JSON.stringify({error:"origin_not_allowed"}),{status:403,headers});
  let body:any; try{body=await req.json()}catch{return new Response(JSON.stringify({error:"invalid_json"}),{status:400,headers})}
  const prompt=lessonPrompt(body);
  let out:any=null,provider="";
  if(geminiKey){try{out=await callGemini(geminiKey,prompt);provider="Gemini"}catch(e){console.warn(String(e))}}
  if(!out&&groqKey){try{out=await callGroq(groqKey,prompt);provider="GroqCloud"}catch(e){console.warn(String(e))}}
  if(!out) return new Response(JSON.stringify({error:"course_generation_failed"}),{status:502,headers});
  return new Response(JSON.stringify({...out,provider}),{status:200,headers});
};

export const config={path:"/api/course-lesson"};
