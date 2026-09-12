const APP_ORIGIN = "https://claudio41cg-max.github.io";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

function cors(origin: string | null) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": origin === APP_ORIGIN ? APP_ORIGIN : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function cleanJson(text: string) {
  return JSON.parse(String(text || "").replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim());
}

function safeStrings(value: any): any {
  if (typeof value === "string") return value.replace(/'/g, "’");
  if (Array.isArray(value)) return value.map(safeStrings);
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = safeStrings(v);
    return out;
  }
  return value;
}

export default async (req: Request) => {
  const origin = req.headers.get("origin");
  const h = cors(origin);
  if (req.method === "OPTIONS") {
    if (origin !== APP_ORIGIN) return new Response(null, { status: 403, headers: h });
    return new Response(null, { status: 204, headers: h });
  }
  const apiKey = Netlify.env.get("GROQ_API_KEY");
  if (req.method === "GET") {
    if (origin && origin !== APP_ORIGIN) return new Response(JSON.stringify({ ok: false }), { status: 403, headers: h });
    return new Response(JSON.stringify({ ok: true, key_configured: !!apiKey, model: MODEL }), { status: 200, headers: h });
  }
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: h });
  if (origin !== APP_ORIGIN) return new Response(JSON.stringify({ error: "origin_not_allowed" }), { status: 403, headers: h });
  if (!apiKey) return new Response(JSON.stringify({ error: "groq_not_configured" }), { status: 503, headers: h });

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: h }); }

  const level = String(body?.level || "A1").toUpperCase().slice(0, 2);
  const moduleTitle = String(body?.module_title || "Fundamentos").slice(0, 120);
  const grammar = String(body?.grammar || "").slice(0, 300);
  const vocabulary = String(body?.vocabulary || "").slice(0, 400);
  const canDo = String(body?.can_do || "").slice(0, 300);
  const lessonType = String(body?.lesson_type || "Vocabulário e compreensão").slice(0, 100);
  const lessonNumber = Math.max(1, Math.min(8, Number(body?.lesson_number || 1) || 1));

  const system = `Você é um autor de curso de inglês para brasileiros. Crie UMA aula original, curta o suficiente para celular, mas pedagogicamente completa. Nunca copie material de cursos, livros ou sites. Use CEFR apenas como referência de dificuldade.\nNível: ${level}. Módulo: ${moduleTitle}. Aula ${lessonNumber}/8. Tipo: ${lessonType}.\nGramática do módulo: ${grammar}. Vocabulário: ${vocabulary}. Objetivo comunicativo: ${canDo}.\n\nA aula deve conter explicação simples em português, exemplos em inglês com tradução, vocabulário, uma atividade guiada, uma pergunta oral, uma pequena leitura quando fizer sentido e uma tarefa final. No A1/A2, use português mais frequente. Em B1/B2, aumente o inglês. Em C1/C2, priorize inglês natural e nuance.\nRetorne SOMENTE JSON válido com este formato: {"title":"...","goal_pt":"...","explanation_pt":"...","examples":[{"en":"...","pt":"..."}],"vocabulary":[{"en":"...","pt":"..."}],"practice_steps":["..."],"speaking_prompt_en":"...","speaking_help_pt":"...","model_answer_en":"...","mini_reading_en":"...","mini_reading_question_pt":"...","final_task_pt":"..."}. Tenha 3 a 5 exemplos, 5 a 8 palavras, 3 a 5 passos de prática. Não inclua markdown.`;

  try {
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Crie a aula ${lessonNumber} do módulo ${moduleTitle}.` }
        ],
        temperature: 0.72,
        max_completion_tokens: 1400,
        reasoning_effort: "medium",
        response_format: { type: "json_object" }
      })
    });
    if (!upstream.ok) {
      let detail = ""; try { detail = (await upstream.text()).slice(0, 300); } catch {}
      return new Response(JSON.stringify({ error: upstream.status === 429 ? "rate_limit" : "upstream_error", detail }), { status: upstream.status === 429 ? 429 : 502, headers: h });
    }
    const data: any = await upstream.json();
    const parsed = safeStrings(cleanJson(data?.choices?.[0]?.message?.content || "{}"));
    return new Response(JSON.stringify({ ...parsed, provider: "GroqCloud", model: MODEL }), { status: 200, headers: h });
  } catch {
    return new Response(JSON.stringify({ error: "course_generation_failed" }), { status: 502, headers: h });
  }
};

export const config = { path: "/api/course-lesson" };
