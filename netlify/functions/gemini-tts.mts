const APP_ORIGIN = "https://claudio41cg-max.github.io";
const MODEL = "gemini-3.1-flash-tts-preview";

function headers(origin: string | null) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": origin === APP_ORIGIN ? APP_ORIGIN : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function getKey() {
  return Netlify.env.get("GEMINI_API_KEY") || Netlify.env.get("GEMINI_API_kEY") || "";
}

export default async (req: Request) => {
  const origin = req.headers.get("origin");
  const h = headers(origin);

  if (req.method === "OPTIONS") {
    if (origin !== APP_ORIGIN) return new Response(null, { status: 403, headers: h });
    return new Response(null, { status: 204, headers: h });
  }

  const apiKey = getKey();

  if (req.method === "GET") {
    if (origin && origin !== APP_ORIGIN) {
      return new Response(JSON.stringify({ ok: false, error: "origin_not_allowed" }), { status: 403, headers: h });
    }
    return new Response(JSON.stringify({ ok: true, provider: "Gemini", model: MODEL, key_configured: !!apiKey }), { status: 200, headers: h });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: h });
  }
  if (origin !== APP_ORIGIN) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), { status: 403, headers: h });
  }
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "gemini_not_configured" }), { status: 503, headers: h });
  }

  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: h });
  }

  const text = String(body?.text || "").trim().slice(0, 1800);
  const lang = String(body?.lang || "pt-BR").toLowerCase().startsWith("en") ? "en-US" : "pt-BR";
  const voice = String(body?.voice || "Kore").slice(0, 40);
  const style = String(body?.style || "natural").slice(0, 120);
  if (!text) return new Response(JSON.stringify({ error: "empty_text" }), { status: 400, headers: h });

  const spokenInstruction = lang === "pt-BR"
    ? `Fale em português brasileiro natural, humano e conversacional. ${style}. Não leia instruções, apenas diga exatamente esta mensagem: ${text}`
    : `Speak in natural American English, clear for an English learner. ${style}. Do not read the instructions, only say exactly this message: ${text}`;

  let upstream: Response;
  try {
    upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: spokenInstruction }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
          }
        }
      })
    });
  } catch {
    return new Response(JSON.stringify({ error: "gemini_unreachable" }), { status: 502, headers: h });
  }

  if (!upstream.ok) {
    let detail = "";
    try { detail = (await upstream.text()).slice(0, 500); } catch {}
    return new Response(JSON.stringify({ error: "gemini_tts_error", upstream_status: upstream.status, detail }), { status: upstream.status === 429 ? 429 : 502, headers: h });
  }

  try {
    const data: any = await upstream.json();
    const part = data?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData?.data);
    const audio = part?.inlineData?.data;
    if (!audio) throw new Error("no_audio");
    return new Response(JSON.stringify({
      ok: true,
      audio,
      mime: part?.inlineData?.mimeType || "audio/L16;codec=pcm;rate=24000",
      sample_rate: 24000,
      provider: "Gemini",
      model: MODEL
    }), { status: 200, headers: h });
  } catch {
    return new Response(JSON.stringify({ error: "invalid_gemini_audio" }), { status: 502, headers: h });
  }
};

export const config = { path: "/api/gemini-tts" };
