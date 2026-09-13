const ALLOWED_ORIGINS = new Set([
  'https://claudio41cg-max.github.io',
  'https://meu-ingles-livid.vercel.app'
]);

const GEMINI_MODEL = 'gemini-2.5-flash';

function cors(req, res) {
  const origin = req.headers.origin || '';
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'null';
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  return origin;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function lessonFeedback(body) {
  const passed = body?.passed === true;
  const mode = clean(body?.personality || 'media', 20);
  const target = clean(body?.target || '', 120);
  const shown = target ? `“${target}”` : 'essa';

  const bank = {
    pesada: passed ? [
      `Aí, porra! ${shown} certinho. Bora pra próxima.`,
      `Boa, cacete! Acertou ${shown}. Continua.`,
      `Agora sim, porra 😄 ${shown}. Segue o jogo.`,
      `Aí sim! ${shown} entrou na cabeça. Bora, sem enrolar.`
    ] : [
      `Porra, Cláudio 😅 aqui era ${shown}. Olha e tenta de novo.`,
      `Aí não, cacete 😂 a certa é ${shown}. Manda outra.`,
      `Quase, porra. Presta atenção em ${shown} e tenta de novo.`,
      `Errou essa, hein 😅 ${shown}. Vai de novo.`
    ],
    media: passed ? [
      `Boa! Acertou ${shown}. Bora pra próxima.`,
      `Aí sim 😄 ${shown} certinho. Continua.`,
      `Mandou bem! ${shown}. Próxima.`
    ] : [
      `Quase 😄 aqui era ${shown}. Tenta de novo.`,
      `Ih, escapou. A certa é ${shown}. Vai outra.`,
      `Ainda não. Olha ${shown} e tenta novamente.`
    ],
    leve: passed ? [
      `Muito bem. ${shown} está correto. Continue.`,
      `Isso mesmo: ${shown}. Vamos para a próxima.`,
      `Perfeito. Você acertou ${shown}. Continue.`
    ] : [
      `Ainda não. A resposta é ${shown}. Tente novamente.`,
      `Quase. Observe ${shown} e tente outra vez.`,
      `Vamos de novo. Aqui a resposta é ${shown}.`
    ]
  };

  const key = mode === 'pesada' ? 'pesada' : mode === 'leve' ? 'leve' : 'media';
  return {
    verdict: passed ? 'correct' : 'wrong',
    reply_pt: pick(bank[key]),
    reply_en: '',
    provider: 'FastLessonFeedback'
  };
}

function systemPrompt(body) {
  const level = clean(body?.level || 'A1', 10).toUpperCase();
  const mode = clean(body?.personality || 'media', 20);
  const scenario = clean(body?.scenario || 'Livre', 120);

  const levelRule = level === 'A1'
    ? 'O aluno é iniciante A1. Use inglês muito simples e explique em português quando necessário.'
    : `Adapte a conversa ao nível ${level}.`;

  const personality = mode === 'pesada'
    ? 'Modo HARD 18+: seja brasileiro, adulto, impaciente, engraçado e espontâneo. Use palavrões naturalmente quando couber. Não seja excessivamente educado, formal ou motivacional. Nunca humilhe de forma cruel, nunca ameace e nunca ataque características pessoais.'
    : mode === 'media'
      ? 'Modo DOIDEIRA: seja brincalhão, provocador, informal e variado, sem humilhar.'
      : 'Modo TRANQUILO: seja paciente, claro, curto e sem palavrões.';

  return `Você é o professor de inglês do aplicativo Meu Inglês. O aluno se chama Cláudio. ${levelRule}\n${personality}\nCenário atual: ${scenario}.\nResponda ao que o aluno realmente disse, sem inventar que ele acertou. Mantenha continuidade com a conversa. Seja curto. Use português para explicar e inglês apenas quando fizer sentido. Retorne SOMENTE JSON válido no formato {"verdict":"conversation|correct|almost|wrong|help","reply_pt":"...","reply_en":"..."}.`;
}

async function callGemini(apiKey, body) {
  const history = Array.isArray(body?.history)
    ? body.history.slice(-8).filter(x => x && (x.role === 'user' || x.role === 'assistant'))
    : [];
  const message = clean(body?.message || body?.heard || '', 1600);
  const transcript = history.map(x => `${x.role === 'assistant' ? 'PROFESSOR' : 'ALUNO'}: ${clean(x.content, 800)}`).join('\n');
  const prompt = `${systemPrompt(body)}\n\nCONVERSA RECENTE:\n${transcript}\nALUNO: ${message}\n\nResponda agora somente com o JSON exigido.`;

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: body?.personality === 'pesada' ? 0.9 : 0.72,
        maxOutputTokens: 140,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  });

  const raw = await r.text();
  if (!r.ok) throw new Error(`gemini_${r.status}:${raw.slice(0, 220)}`);
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error('invalid_gemini_json'); }
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p?.text || '').join('').trim() || '{}';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned || '{}');
}

export default async function handler(req, res) {
  const origin = cors(req, res);
  if (req.method === 'OPTIONS') return res.status(ALLOWED_ORIGINS.has(origin) ? 204 : 403).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true, provider: 'Gemini', model: GEMINI_MODEL, fast_lesson_feedback: true });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!ALLOWED_ORIGINS.has(origin)) return res.status(403).json({ error: 'origin_not_allowed' });

  const body = req.body || {};
  const message = clean(body?.message || body?.heard || '', 1600);
  if (!message) return res.status(400).json({ error: 'empty_message' });

  if (clean(body?.mode, 40) === 'lesson_feedback') {
    return res.status(200).json(lessonFeedback(body));
  }

  const apiKey = clean(process.env.GEMINI_API_KEY || '', 300);
  if (!apiKey) return res.status(503).json({ error: 'gemini_not_configured' });

  try {
    const parsed = await callGemini(apiKey, body);
    return res.status(200).json({
      verdict: clean(parsed?.verdict || 'conversation', 20),
      reply_pt: clean(parsed?.reply_pt || 'Vamos continuar.', 1000),
      reply_en: clean(parsed?.reply_en || '', 500),
      provider: 'Gemini'
    });
  } catch (error) {
    return res.status(502).json({ error: 'gemini_chat_error', details: clean(error?.message || error, 500) });
  }
}
