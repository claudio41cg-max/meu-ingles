const ALLOWED_ORIGINS = new Set([
  "https://claudio41cg-max.github.io",
  "https://meu-ingles-claudio.netlify.app"
]);
const MODELS = ["gemini-3.1-flash-tts-preview","gemini-2.5-flash-preview-tts"];

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
function sampleRateFromMime(mime:string){
  const m=String(mime||"").match(/rate=(\d+)/i);
  return m?Number(m[1])||24000:24000;
}
async function callModel(model:string,apiKey:string,instruction:string,voice:string,languageCode:string){
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
    method:"POST",
    headers:{"x-goog-api-key":apiKey,"Content-Type":"application/json"},
    body:JSON.stringify({
      contents:[{parts:[{text:instruction}]}],
      generationConfig:{
        responseModalities:["AUDIO"],
        speechConfig:{
          languageCode,
          voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}
        }
      }
    })
  });
  if(!r.ok) throw new Error(`${model}_${r.status}`);
  const data:any=await r.json();
  const part=data?.candidates?.[0]?.content?.parts?.find((p:any)=>p?.inlineData?.data);
  if(!part?.inlineData?.data) throw new Error(`${model}_no_audio`);
  const mime=part.inlineData.mimeType||"audio/L16;codec=pcm;rate=24000";
  return {audio:part.inlineData.data,mime,sample_rate:sampleRateFromMime(mime),model};
}

export default async (req: Request) => {
  const origin = req.headers.get("origin");
  const h = headers(origin);
  if (req.method === "OPTIONS") return new Response(null,{status:ALLOWED_ORIGINS.has(origin||"")?204:403,headers:h});
  const apiKey = getKey();
  if (req.method === "GET") {
    return new Response(JSON.stringify({ok:true,provider:"Gemini",models:MODELS,key_configured:!!apiKey}),{status:200,headers:h});
  }
  if (req.method !== "POST") return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:h});
  if (!ALLOWED_ORIGINS.has(origin||"")) return new Response(JSON.stringify({error:"origin_not_allowed"}),{status:403,headers:h});
  if (!apiKey) return new Response(JSON.stringify({error:"gemini_not_configured"}),{status:503,headers:h});
  let body:any; try { body=await req.json(); } catch { return new Response(JSON.stringify({error:"invalid_json"}),{status:400,headers:h}); }
  const text=String(body?.text||"").trim().slice(0,2000);
  const lang=String(body?.lang||"pt-BR").toLowerCase().startsWith("en")?"en-US":"pt-BR";
  const voice=String(body?.voice||"Achird").slice(0,40);
  const style=String(body?.style||"natural").slice(0,320);
  if(!text) return new Response(JSON.stringify({error:"empty_text"}),{status:400,headers:h});

  const instruction=lang==="pt-BR"
    ? `Diga apenas a mensagem abaixo em português brasileiro. Fale como uma pessoa conversando cara a cara, com ritmo natural, pausas pequenas, emoção e variação de entonação. Não use voz de locutor, assistente virtual ou robô. ${style}\n\nMensagem: ${text}`
    : `Say only the message below in natural American English for a beginner. Use clear pronunciation, human rhythm, small natural pauses and warm conversational intonation. Do not sound like an announcer or robot. ${style}\n\nMessage: ${text}`;

  const errors:string[]=[];
  for(const model of MODELS){
    try{
      const out=await callModel(model,apiKey,instruction,voice,lang);
      return new Response(JSON.stringify({ok:true,...out,provider:"Gemini"}),{status:200,headers:h});
    }catch(e){errors.push(String(e));}
  }
  return new Response(JSON.stringify({error:"gemini_tts_error",details:errors.slice(-2)}),{status:502,headers:h});
};

export const config={path:"/api/gemini-tts"};
