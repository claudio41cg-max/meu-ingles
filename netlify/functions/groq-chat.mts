const APP_ORIGIN = "https://claudio41cg-max.github.io";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

function corsHeaders(origin: string | null) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": origin === APP_ORIGIN ? APP_ORIGIN : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function personalityPrompt(mode: string) {
  if (mode === "pesada") {
    return `Modo HARD 18+. Fale como um professor brasileiro muito zoeiro e impaciente, com palavrões quando combinar com a situação. Se o aluno repetir o mesmo erro várias vezes no histórico, aumente a irritação gradualmente: primeira vez brinca, segunda cobra mais, terceira fica bem puto, quarta ou mais pode soltar frases fortes e cômicas como "porra", "caralho", "cacete", "tá de sacanagem?". A zoeira deve ser sobre o erro ou a tentativa, nunca sobre raça, religião, orientação sexual, deficiência ou outra característica pessoal. Não faça ameaça nem humilhação cruel. Quando ele acertar, comemore de forma exagerada e zere o clima de irritação.`;
  }
  if (mode === "media") {
    return `Modo DOIDEIRA. Seja brincalhão, provocador e engraçado. Pode tirar onda do erro e usar gírias, mas sem humilhar. Se o mesmo erro se repetir, aumente a zoeira de leve. Quando acertar, comemore bastante.`;
  }
  return `Modo TRANQUILO. Seja paciente, acolhedor e direto. Corrija sem zoeira pesada e incentive o aluno.`;
}

function levelRule(level: string) {
  const rules: Record<string, string> = {
    A1: "Use inglês muito simples, frases curtas e explicações fáceis em português.",
    A2: "Use inglês básico do cotidiano, ainda com explicações claras em português.",
    B1: "Use inglês intermediário e incentive respostas completas.",
    B2: "Use inglês mais natural e conversacional, corrigindo nuances importantes.",
    C1: "Use inglês avançado, natural e idiomático.",
    C2: "Converse em nível de domínio, com nuances, expressões e correções finas."
  };
  return rules[level] || rules.A1;
}

export default async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    if (origin !== APP_ORIGIN) return new Response(null, { status: 403, headers });
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });
  }

  if (origin !== APP_ORIGIN) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), { status: 403, headers });
  }

  const apiKey = Netlify.env.get("GROQ_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "groq_not_configured" }), { status: 503, headers });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers });
  }

  const message = String(body?.message || "").trim().slice(0, 1200);
  const level = String(body?.level || "A1").toUpperCase();
  const personality = String(body?.personality || "leve");
  const scenario = String(body?.scenario || "Livre").slice(0, 80);
  const history = Array.isArray(body?.history) ? body.history.slice(-10) : [];

  if (!message) {
    return new Response(JSON.stringify({ error: "empty_message" }), { status: 400, headers });
  }

  const system = `Você é a professora de inglês do aplicativo Meu Inglês. O aluno se chama Cláudio. Seu objetivo é ensinar inglês de uso real, conversar e corrigir de forma curta, natural e divertida.

${personalityPrompt(personality)}
${levelRule(level)}
Situação atual: ${scenario}.

Regras de resposta:
1. Responda primeiro em português brasileiro, como uma pessoa de verdade falando com o aluno.
2. Se houver erro de inglês, explique a correção de forma curta e diga a forma certa.
3. Dê uma frase curta em inglês para ele responder, repetir ou continuar a conversa.
4. Não transforme a resposta em aula longa. Priorize ritmo de conversa por voz.
5. Observe o histórico para perceber erros repetidos e ajustar a reação.
6. Retorne SOMENTE JSON válido neste formato: {"reply_pt":"...","reply_en":"..."}.`;

  const messages = [
    { role: "system", content: system },
    ...history
      .filter((x: any) => x && (x.role === "user" || x.role === "assistant"))
      .map((x: any) => ({ role: x.role, content: String(x.content || "").slice(0, 1200) })),
    { role: "user", content: message }
  ];

  let upstream: Response;
  try {
    upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: personality === "pesada" ? 0.95 : 0.75,
        max_completion_tokens: 220,
        reasoning_effort: "low",
        response_format: { type: "json_object" }
      })
    });
  } catch {
    return new Response(JSON.stringify({ error: "groq_unreachable" }), { status: 502, headers });
  }

  if (!upstream.ok) {
    const status = upstream.status === 429 ? 429 : 502;
    return new Response(JSON.stringify({ error: upstream.status === 429 ? "groq_rate_limit" : "groq_error" }), { status, headers });
  }

  try {
    const data: any = await upstream.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    const replyPt = String(parsed.reply_pt || "Vamos continuar.").slice(0, 900);
    const replyEn = String(parsed.reply_en || "").slice(0, 500);
    return new Response(JSON.stringify({ reply_pt: replyPt, reply_en: replyEn }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "invalid_groq_response" }), { status: 502, headers });
  }
};

export const config = {
  path: "/api/groq-chat"
};
