const ALLOWED_ORIGINS = new Set([
  "https://claudio41cg-max.github.io",
  "https://meu-ingles-claudio.netlify.app"
]);
const MODEL = "gemini-2.5-flash-preview-tts";

function headers(origin: string | null) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin || "") ? origin! : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
function getKey() {
  try { return Netlify.env.get("GEMINI_API_KEY") || Netlify.env.get("GEMINI_API_kEY") || ""; }
  catch { return ""; }
}

export default async (req: Request) => {
  const origin = req.headers.get("origin");
  const h = headers(origin);
  if (req.method === "OPTIONS") return new Response(null,{status:ALLOWED_ORIGINS.has(origin||"")?204:403,headers:h});
  const apiKey = getKey();
  if (req.method === "GET") {
    return new Response(JSON.stringify({ok:true,provider:"Gemini",model:MODEL,key_configured:!!apiKey}),{status:200,headers:h});
  }
  if (req.method !== "POST") return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:h});
  if (!ALLOWED_ORIGINS.has(origin||"")) return new Response(JSON.stringify({error:"origin_not_allowed"}),{status:403,headers:h});
  if (!apiKey) return new Response(JSON.stringify({error:"gemini_not_configured"}),{status:503,headers:h});
  let body:any; try { body=await req.json(); } catch { return new Response(JSON.stringify({error:"invalid_json"}),{status:400,headers:h}); }
  const text=String(body?.text||"").trim().slice(0,2000);
  const lang=String(body?.lang||"pt-BR").toLowerCase().startsWith("en")?"en-US":"pt-BR";
  const voice=String(body?.voice||"Kore").slice(0,40);
  const style=String(body?.style||"natural").slice(0,180);
  if(!text) return new Response(JSON.stringify({error:"empty_text"}),{status:400,headers:h});
  const instruction=lang==="pt-BR"
    ? `Fale em português brasileiro de forma humana, espontânea e natural. ${style}. Diga somente esta mensagem, sem ler instruções: ${text}`
    : `Speak in natural American English, clear for an English learner. ${style}. Say only this message: ${text}`;
  let upstream:Response;
  try {
    upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{
      method:"POST",
      headers:{"x-goog-api-key":apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:instruction}]}],generationConfig:{responseModalities:["AUDIO"],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}})
    });
  } catch { return new Response(JSON.stringify({error:"gemini_unreachable"}),{status:502,headers:h}); }
  if(!upstream.ok) return new Response(JSON.stringify({error:"gemini_tts_error",upstream_status:upstream.status}),{status:upstream.status===429?429:502,headers:h});
  try {
    const data:any=await upstream.json();
    const part=data?.candidates?.[0]?.content?.parts?.find((p:any)=>p?.inlineData?.data);
    if(!part?.inlineData?.data) throw new Error("no_audio");
    return new Response(JSON.stringify({ok:true,audio:part.inlineData.data,mime:part.inlineData.mimeType||"audio/L16;codec=pcm;rate=24000",sample_rate:24000,provider:"Gemini",model:MODEL}),{status:200,headers:h});
  } catch { return new Response(JSON.stringify({error:"invalid_gemini_audio"}),{status:502,headers:h}); }
};

export const config={path:"/api/gemini-tts"};
