const APP_ORIGIN = "https://claudio41cg-max.github.io";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

function corsHeaders(origin: string | null) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": origin === APP_ORIGIN ? APP_ORIGIN : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function personalityPrompt(mode: string, streak = 0) {
  if (mode === "pesada") {
    return `Modo HARD 18+. Você é um professor brasileiro muito engraçado, impaciente e espontâneo. Pode usar palavrões brasileiros quando combinarem com o momento. A intensidade depende da sequência de erros da MESMA habilidade: streak=${streak}. 0 ou 1: zoeira leve. 2: cobre mais. 3: fica claramente irritado e engraçado. 4 ou mais: hard de verdade, podendo usar "porra", "caralho", "cacete", "tá de sacanagem?", sempre sobre o erro de inglês, nunca atacando raça, religião, orientação sexual, deficiência, aparência ou outra característica pessoal. Não ameace e não faça humilhação cruel. Se acertar, comemore e zere o clima de irritação.`;
  }
  if (mode === "media") {
    return `Modo DOIDEIRA. Seja brasileiro, brincalhão, provocador e variado. Pode tirar onda do erro, usar gírias e aumentar a zoeira se o mesmo erro se repetir. Não humilhe. Quando acertar, comemore bastante.`;
  }
  return `Modo TRANQUILO. Seja paciente, caloroso e direto. Corrija com calma, sem palavrões e com incentivo realista.`;
}

function levelRule(level: string) {
  const rules: Record<string, string> = {
    A1: "Aluno iniciante. Use frases bem curtas, vocabulário simples e explique em português.",
    A2: "Aluno básico. Use inglês cotidiano e explicações claras em português.",
    B1: "Aluno intermediário. Incentive respostas completas e corrija os erros mais importantes.",
    B2: "Aluno intermediário alto. Use inglês natural, expressões comuns e corrija nuances.",
    C1: "Aluno avançado. Use inglês natural e idiomático, com correções finas.",
    C2: "Aluno de domínio. Trabalhe precisão, nuance, registro e naturalidade."
  };
  return rules[level] || rules.A1;
}

function safeJson(text: string) {
  const cleaned = String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned || "{}");
}

export default async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    if (origin !== APP_ORIGIN) return new Response(null, { status: 403, headers });
    return new Response(null, { status: 204, headers });
  }

  const apiKey = Netlify.env.get("GROQ_API_KEY");

  if (req.method === "GET") {
    if (origin && origin !== APP_ORIGIN) {
      return new Response(JSON.stringify({ ok: false, error: "origin_not_allowed" }), { status: 403, headers });
    }
    return new Response(JSON.stringify({
      ok: true,
      provider: "GroqCloud",
      model: MODEL,
      key_configured: !!apiKey
    }), { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });
  }

  if (origin !== APP_ORIGIN) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), { status: 403, headers });
  }

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "groq_not_configured" }), { status: 503, headers });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers });
  }

  const mode = String(body?.mode || "conversation");
  const message = String(body?.message || body?.heard || "").trim().slice(0, 1400);
  const level = String(body?.level || "A1").toUpperCase();
  const personality = String(body?.personality || "leve");
  const scenario = String(body?.scenario || "Livre").slice(0, 80);
  const streak = Math.max(0, Math.min(20, Number(body?.error_streak || 0) || 0));
  const history = Array.isArray(body?.history) ? body.history.slice(-10) : [];

  if (!message && mode !== "lesson_feedback") {
    return new Response(JSON.stringify({ error: "empty_message" }), { status: 400, headers });
  }

  let taskContext = "";
  if (mode === "lesson_feedback") {
    const target = String(body?.target || "").trim().slice(0, 500);
    const heard = String(body?.heard || "").trim().slice(0, 500);
    const score = Math.max(0, Math.min(100, Number(body?.score || 0) || 0));
    const passed = body?.passed === true;
    const lesson = String(body?.lesson || "").slice(0, 120);
    taskContext = `\nMODO DE TAREFA. Aula: ${lesson || "treino de fala"}. Frase esperada: "${target}". O reconhecimento ouviu: "${heard}". Compatibilidade textual calculada no aparelho: ${score}%. Resultado técnico: ${passed ? "passou" : "ainda não passou"}. Sequência de erros nesta mesma frase: ${streak}.\nVocê DEVE reagir a esses dados. Se não passou, NÃO diga "mandou bem", "é isso aí", "perfeito" nem qualquer elogio de acerto. Explique em português, de forma curta, o que precisa ser tentado e peça para repetir exatamente a frase esperada. Se passou, comemore de acordo com a personalidade e avance. Não finja avaliar sotaque ou fonética que você não recebeu em áudio; diga apenas o que o reconhecimento entendeu quando necessário.`;
  }

  const system = `Você é a professora de inglês do aplicativo Meu Inglês. O aluno se chama Cláudio. Sua função principal é ENSINAR inglês, não apenas conversar.
${levelRule(level)}
${personalityPrompt(personality, streak)}
Situação atual: ${scenario}.
${taskContext}

Regras obrigatórias:
1. Responda em português brasileiro quando estiver explicando, corrigindo ou brincando.
2. Use inglês para exemplos, frases-alvo e continuação do exercício.
3. Se o aluno disser "não sei", "I don't know", algo sem relação com a pergunta, ou demonstrar dúvida, NÃO comemore como se tivesse acertado. Dê uma pista simples, explique e ofereça uma resposta-modelo curta.
4. Nunca use uma resposta genérica que contradiga o que o aluno falou.
5. Varie as reações; evite repetir bordões em turnos consecutivos.
6. Mantenha a resposta curta o bastante para ser falada em voz alta, normalmente 1 a 3 frases.
7. Retorne SOMENTE JSON válido no formato {"verdict":"correct|almost|wrong|help|conversation","reply_pt":"...","reply_en":"..."}.
8. Em tarefa, reply_en deve conter a frase correta que o aluno deve repetir ou a próxima frase curta. Em conversa livre, reply_en pode ser a próxima pergunta em inglês.`;

  const messages = [
    { role: "system", content: system },
    ...history
      .filter((x: any) => x && (x.role === "user" || x.role === "assistant"))
      .map((x: any) => ({ role: x.role, content: String(x.content || "").slice(0, 1200) })),
    { role: "user", content: mode === "lesson_feedback" ? `Minha tentativa foi: ${message || body?.heard || ""}` : message }
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
        temperature: personality === "pesada" ? 0.9 : personality === "media" ? 0.82 : 0.68,
        max_completion_tokens: 320,
        reasoning_effort: "medium",
        response_format: { type: "json_object" }
      })
    });
  } catch {
    return new Response(JSON.stringify({ error: "groq_unreachable" }), { status: 502, headers });
  }

  if (!upstream.ok) {
    let detail = "";
    try { detail = (await upstream.text()).slice(0, 300); } catch {}
    const status = upstream.status === 429 ? 429 : 502;
    return new Response(JSON.stringify({
      error: upstream.status === 429 ? "groq_rate_limit" : "groq_error",
      upstream_status: upstream.status,
      detail
    }), { status, headers });
  }

  try {
    const data: any = await upstream.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    const parsed = safeJson(raw);
    return new Response(JSON.stringify({
      verdict: String(parsed.verdict || "conversation").slice(0, 20),
      reply_pt: String(parsed.reply_pt || "Vamos tentar de novo.").slice(0, 1000),
      reply_en: String(parsed.reply_en || "").slice(0, 500),
      provider: "GroqCloud",
      model: MODEL
    }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "invalid_groq_response" }), { status: 502, headers });
  }
};

export const config = {
  path: "/api/groq-chat"
};
