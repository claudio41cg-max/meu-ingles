const ALLOWED_ORIGINS = new Set([
  "https://claudio41cg-max.github.io",
  "https://meu-ingles-claudio.netlify.app"
]);
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const GEMINI_MODEL = "gemini-2.5-flash";

function cors(origin: string | null) {
  const allow = ALLOWED_ORIGINS.has(origin || "") ? origin! : "null";
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
function env(name: string) { try { return Netlify.env.get(name) || ""; } catch { return ""; } }
function safeJson(text: string) {
  const t = String(text || "").replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(t || "{}");
}
function levelRule(level: string) {
  const rules: Record<string,string> = {
    A1:"Aluno iniciante. Use frases curtas, vocabulário simples e explique em português.",
    A2:"Aluno básico. Use inglês cotidiano e explicações claras em português.",
    B1:"Aluno intermediário. Incentive respostas completas e corrija os erros mais importantes.",
    B2:"Aluno intermediário alto. Use inglês natural, expressões comuns e corrija nuances.",
    C1:"Aluno avançado. Use inglês natural e idiomático, com correções finas.",
    C2:"Aluno de domínio. Trabalhe precisão, nuance, registro e naturalidade."
  };
  return rules[level] || rules.A1;
}
function personalityPrompt(mode: string, streak: number) {
  if (mode === "pesada") return `Modo HARD 18+. Professor brasileiro engraçado, impaciente e espontâneo. Pode usar palavrões quando combinarem com a situação. Intensidade conforme sequência de erros: ${streak}. 0-1 zoeira leve, 2 aperta, 3 irritado e engraçado, 4+ hard de verdade. Nunca ataque características pessoais, nunca ameace e nunca humilhe cruelmente. Se acertar, comemore.`;
  if (mode === "media") return "Modo DOIDEIRA. Seja brasileiro, brincalhão, provocador e variado. Pode tirar onda do erro e usar gírias, sem humilhar.";
  return "Modo TRANQUILO. Seja paciente, caloroso, direto e sem palavrões.";
}
function makeSystem(body: any) {
  const mode = String(body?.mode || "conversation");
  const level = String(body?.level || "A1").toUpperCase();
  const personality = String(body?.personality || "leve");
  const scenario = String(body?.scenario || "Livre").slice(0,120);
  const streak = Math.max(0, Math.min(20, Number(body?.error_streak || 0) || 0));
  let task = "";
  if (mode === "lesson_feedback") {
    const target = String(body?.target || "").slice(0,500);
    const heard = String(body?.heard || "").slice(0,500);
    const score = Math.max(0, Math.min(100, Number(body?.score || 0) || 0));
    const passed = body?.passed === true;
    const lesson = String(body?.lesson || "treino de fala").slice(0,150);
    task = `\nTAREFA: ${lesson}. Frase esperada: "${target}". Reconhecimento ouviu: "${heard}". Compatibilidade textual: ${score}%. Resultado técnico: ${passed ? "passou" : "ainda não passou"}. Erros seguidos: ${streak}. Se não passou, NÃO elogie como acerto; explique curto e peça para repetir a frase correta. Se passou, comemore e avance. Não finja avaliar fonética sem áudio.`;
  }
  return `Você é a professora de inglês do aplicativo Meu Inglês. O aluno se chama Cláudio. Sua missão é ENSINAR inglês.\n${levelRule(level)}\n${personalityPrompt(personality, streak)}\nSituação: ${scenario}.${task}\n\nRegras obrigatórias: responda em português brasileiro para explicar, corrigir e brincar; use inglês nos exemplos e exercícios; se o aluno disser "não sei", algo sem relação ou demonstrar dúvida, não diga que acertou; varie as reações; mantenha a resposta curta; retorne SOMENTE JSON válido no formato {"verdict":"correct|almost|wrong|help|conversation","reply_pt":"...","reply_en":"..."}.`;
}
async function callGroq(apiKey: string, system: string, messages: any[], personality: string) {
  const r = await fetch(GROQ_URL, {
    method:"POST",
    headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      model:GROQ_MODEL,
      messages:[{role:"system",content:system},...messages],
      temperature:personality==="pesada"?.9:personality==="media"?.82:.68,
      max_completion_tokens:360,
      reasoning_effort:"medium",
      response_format:{type:"json_object"}
    })
  });
  if (!r.ok) throw new Error(`groq_${r.status}`);
  const data: any = await r.json();
  return safeJson(data?.choices?.[0]?.message?.content || "{}");
}
async function callGemini(apiKey: string, system: string, messages: any[], personality: string) {
  const transcript = messages.map(m => `${m.role === "assistant" ? "PROFESSORA" : "ALUNO"}: ${m.content}`).join("\n");
  const prompt = `${system}\n\nCONVERSA RECENTE:\n${transcript}\n\nResponda agora somente com o JSON exigido.`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method:"POST",
    headers:{"x-goog-api-key":apiKey,"Content-Type":"application/json"},
    body:JSON.stringify({
      contents:[{parts:[{text:prompt}]}],
      generationConfig:{temperature:personality==="pesada"?.9:personality==="media"?.82:.68,responseMimeType:"application/json"}
    })
  });
  if (!r.ok) throw new Error(`gemini_${r.status}`);
  const data: any = await r.json();
  return safeJson(data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("") || "{}");
}

export default async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = cors(origin);
  if (req.method === "OPTIONS") return new Response(null,{status:ALLOWED_ORIGINS.has(origin||"")?204:403,headers});
  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY") || env("GEMINI_API_kEY");
  if (req.method === "GET") {
    return new Response(JSON.stringify({
      ok:true,
      key_configured:!!(groqKey||geminiKey),
      groq_configured:!!groqKey,
      gemini_configured:!!geminiKey,
      provider:"GroqCloud + Gemini fallback"
    }),{status:200,headers});
  }
  if (req.method !== "POST") return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  if (!ALLOWED_ORIGINS.has(origin||"")) return new Response(JSON.stringify({error:"origin_not_allowed"}),{status:403,headers});
  if (!groqKey && !geminiKey) return new Response(JSON.stringify({error:"ai_not_configured"}),{status:503,headers});
  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({error:"invalid_json"}),{status:400,headers}); }
  const message = String(body?.message || body?.heard || "").trim().slice(0,1800);
  if (!message) return new Response(JSON.stringify({error:"empty_message"}),{status:400,headers});
  const history = Array.isArray(body?.history) ? body.history.slice(-10).filter((x:any)=>x&&(x.role==="user"||x.role==="assistant")).map((x:any)=>({role:x.role,content:String(x.content||"").slice(0,1200)})) : [];
  const messages = [...history,{role:"user",content:message}];
  const system = makeSystem(body);
  const personality = String(body?.personality || "leve");
  let parsed: any = null, provider = "";
  if (groqKey) { try { parsed = await callGroq(groqKey,system,messages,personality); provider="GroqCloud"; } catch(e) { console.warn("Groq fallback",String(e)); } }
  if (!parsed && geminiKey) { try { parsed = await callGemini(geminiKey,system,messages,personality); provider="Gemini"; } catch(e) { console.warn("Gemini fallback",String(e)); } }
  if (!parsed) return new Response(JSON.stringify({error:"all_ai_providers_failed"}),{status:502,headers});
  return new Response(JSON.stringify({
    verdict:String(parsed.verdict||"conversation").slice(0,20),
    reply_pt:String(parsed.reply_pt||"Vamos tentar novamente.").slice(0,1200),
    reply_en:String(parsed.reply_en||"").slice(0,600),
    provider
  }),{status:200,headers});
};

export const config = { path: "/api/groq-chat" };
