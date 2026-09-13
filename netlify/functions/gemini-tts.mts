const ALLOWED_ORIGINS = new Set([
  "https://claudio41cg-max.github.io",
  "https://meu-ingles-claudio.netlify.app"
]);

const PRIMARY_MODEL = "gemini-3.1-flash-tts-preview";
const FALLBACK_MODEL = "gemini-2.5-flash-preview-tts";

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
  try {
    return Netlify.env.get("GEMINI_API_KEY") || Netlify.env.get("GEMINI_API_kEY") || "";
  } catch {
    return "";
  }
}

function sampleRateFromMime(mime: string) {
  const m = String(mime || "").match(/rate=(\d+)/i);
  return m ? Number(m[1]) || 24000 : 24000;
}

function extractInteractionAudio(data: any) {
  const out = data?.output_audio || data?.outputAudio || data?.interaction?.output_audio || data?.interaction?.outputAudio;
  const audio = out?.data || out?.audio?.data || "";
  const mime = out?.mime_type || out?.mimeType || out?.audio?.mime_type || out?.audio?.mimeType || "audio/L16;codec=pcm;rate=24000";
  if (!audio) throw new Error("interaction_no_audio");
  return { audio, mime, sample_rate: sampleRateFromMime(mime) };
}

async function callInteractions(model: string, apiKey: string, instruction: string, voice: string) {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: instruction,
      response_format: { type: "audio" },
      generation_config: {
        speech_config: [{ voice }]
      }
    })
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${model}_interactions_${r.status}:${text.slice(0,180)}`);
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`${model}_interactions_invalid_json`); }
  return { ...extractInteractionAudio(data), model, protocol: "interactions" };
}

async function callGenerateContent25(apiKey: string, instruction: string, voice: string) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: instruction }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
        }
      }
    })
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${FALLBACK_MODEL}_generateContent_${r.status}:${text.slice(0,180)}`);
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`${FALLBACK_MODEL}_generateContent_invalid_json`); }
  const part = data?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData?.data);
  if (!part?.inlineData?.data) throw new Error(`${FALLBACK_MODEL}_generateContent_no_audio`);
  const mime = part.inlineData.mimeType || "audio/L16;codec=pcm;rate=24000";
  return {
    audio: part.inlineData.data,
    mime,
    sample_rate: sampleRateFromMime(mime),
    model: FALLBACK_MODEL,
    protocol: "generateContent"
  };
}

export default async (req: Request) => {
  const origin = req.headers.get("origin");
  const h = headers(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: ALLOWED_ORIGINS.has(origin || "") ? 204 : 403, headers: h });
  }

  const apiKey = getKey();

  if (req.method === "GET") {
    return new Response(JSON.stringify({
      ok: true,
      provider: "Gemini",
      models: [PRIMARY_MODEL, FALLBACK_MODEL],
      key_configured: !!apiKey,
      tts_api: "interactions-first"
    }), { status: 200, headers: h });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: h });
  }
  if (!ALLOWED_ORIGINS.has(origin || "")) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), { status: 403, headers: h });
  }
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "gemini_not_configured" }), { status: 503, headers: h });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: h }); }

  const text = String(body?.text || "").trim().slice(0, 2000);
  const lang = String(body?.lang || "pt-BR").toLowerCase().startsWith("en") ? "en-US" : "pt-BR";
  const voice = String(body?.voice || "Achird").slice(0, 40);
  const style = String(body?.style || "natural").slice(0, 320);

  if (!text) {
    return new Response(JSON.stringify({ error: "empty_text" }), { status: 400, headers: h });
  }

  const instruction = lang === "pt-BR"
    ? `Fale apenas em português brasileiro. Soe como uma pessoa conversando cara a cara, com ritmo natural, pequenas pausas e entonação espontânea. Não use voz de locutor, assistente virtual ou robô. ${style}\n\nDiga somente isto: ${text}`
    : `Speak only in natural American English for a complete beginner. Use clear pronunciation, warm human rhythm and small natural pauses. Do not sound like an announcer or robot. ${style}\n\nSay only this: ${text}`;

  const errors: string[] = [];

  try {
    const out = await callInteractions(PRIMARY_MODEL, apiKey, instruction, voice);
    return new Response(JSON.stringify({ ok: true, ...out, provider: "Gemini" }), { status: 200, headers: h });
  } catch (e) {
    errors.push(String(e));
  }

  try {
    const out = await callInteractions(FALLBACK_MODEL, apiKey, instruction, voice);
    return new Response(JSON.stringify({ ok: true, ...out, provider: "Gemini" }), { status: 200, headers: h });
  } catch (e) {
    errors.push(String(e));
  }

  try {
    const out = await callGenerateContent25(apiKey, instruction, voice);
    return new Response(JSON.stringify({ ok: true, ...out, provider: "Gemini" }), { status: 200, headers: h });
  } catch (e) {
    errors.push(String(e));
  }

  return new Response(JSON.stringify({
    error: "gemini_tts_error",
    details: errors.slice(-3)
  }), { status: 502, headers: h });
};

export const config = { path: "/api/gemini-tts" };
