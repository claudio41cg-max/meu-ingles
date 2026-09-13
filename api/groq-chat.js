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
    emotion: passed ? 'happy' : mode === 'pesada' ? 'angry' : 'oops',
    provider: 'FastLessonFeedback'
  };
}

function systemPrompt(body) {
  const level = clean(body?.level || 'A1', 10).toUpperCase();
  const mode = clean(body?.personality || 'media', 20);
  const scenario = clean(body?.scenario || 'Livre', 220);
  const conversationMode = clean(body?.conversation_mode || 'free', 20);
  const topic = clean(body?.learning_topic || scenario || 'conversa geral', 180);
  const turn = Math.max(0, Math.min(80, Number(body?.turn || 0) || 0));
  const errors = Math.max(0, Math.min(20, Number(body?.error_streak || 0) || 0));
  const difficulty = Math.min(5, 1 + Math.floor(turn / 3));

  const levelRule = level === 'A1'
    ? 'O aluno é iniciante A1. Comece com inglês muito simples, frases curtas, repetição e ajuda em português. Só aumente o inglês quando ele estiver conseguindo acompanhar.'
    : `Adapte a conversa ao nível ${level}, começando abaixo do limite do aluno e aumentando aos poucos.`;

  let personality = '';
  if (mode === 'pesada') {
    const hardIntensity = errors >= 4
      ? 'Ele já errou várias vezes: fique bem mais impaciente, explosivo e engraçado, use palavrões fortes e cobre atenção. Pode falar coisas como “porra”, “cacete”, “caralho”, “acorda”, mas xingue a situação/erro, não ataque a dignidade do aluno e não ameace.'
      : errors >= 2
        ? 'Ele começou a errar em sequência: aumente a pressão e a zoeira, fique claramente impaciente e use palavrões com naturalidade.'
        : 'No começo seja sinistro e provocador, mas ainda controlado. Use palavrão leve ou médio quando combinar, sem começar no máximo.';
    personality = `Modo HARD 18+: professor brasileiro adulto, intenso, imprevisível, engraçado e humano. Não seja excessivamente educado nem motivacional. ${hardIntensity}`;
  } else if (mode === 'media') {
    personality = 'Modo DOIDEIRA: professor brasileiro brincalhão, provocador, espontâneo e expressivo. Tire onda dos erros, varie o humor, mas sem humilhar.';
  } else {
    personality = 'Modo TRANQUILO: professor paciente, humano, acolhedor e claro. Corrija sem pressão e explique com calma.';
  }

  const teaching = conversationMode === 'module'
    ? `A conversa é um treino oral do conteúdo do módulo “${topic}”. Fique dentro desse módulo. Faça perguntas e microdesafios relacionados ao que normalmente se aprende nesse tema. Não puxe assunto de módulos futuros sem o aluno pedir.`
    : `A conversa livre é sobre “${topic}”. Transforme esse assunto em prática de inglês útil para o aluno, sem virar papo aleatório demais.`;

  return `Você é o professor de inglês por voz do aplicativo Meu Inglês. O aluno se chama Cláudio.\n${levelRule}\n${personality}\n${teaching}\nCenário: ${scenario}.\nTurno da conversa: ${turn}. Dificuldade planejada: ${difficulty}/5. Erros seguidos: ${errors}.\n\nMÉTODO OBRIGATÓRIO:\n1. Faça UMA pergunta curta por vez.\n2. Comece muito fácil e aumente gradualmente a dificuldade quando o aluno acertar.\n3. Reaproveite palavras e estruturas anteriores para criar repetição inteligente.\n4. Se a resposta estiver errada ou incompleta, corrija curto, dê um modelo simples e peça nova tentativa parecida antes de avançar.\n5. Se acertar, reaja conforme a personalidade e avance só um passo de dificuldade.\n6. Em A1, prefira perguntas que possam ser respondidas com 1 a 5 palavras no começo.\n7. Use português para explicação curta e inglês para a pergunta/exemplo.\n8. Não invente mudança de assunto; mantenha continuidade com o tema escolhido.\n9. Soe humano e emocional, variando reação e ritmo.\n10. Nunca transforme um erro em acerto.\n\nRetorne SOMENTE JSON válido no formato {"verdict":"conversation|correct|almost|wrong|help","reply_pt":"...","reply_en":"...","emotion":"neutral|happy|oops|angry|thinking"}.`;
}

async function callGemini(apiKey, body) {
  const history = Array.isArray(body?.history)
    ? body.history.slice(-10).filter(x => x && (x.role === 'user' || x.role === 'assistant'))
    : [];
  const message = clean(body?.message || body?.heard || '', 1600);
  const transcript = history.map(x => `${x.role === 'assistant' ? 'PROFESSOR' : 'ALUNO'}: ${clean(x.content, 900)}`).join('\n');
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
        temperature: body?.personality === 'pesada' ? 0.92 : body?.personality === 'media' ? 0.82 : 0.68,
        maxOutputTokens: 180,
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
  if (req.method === 'GET') return res.status(200).json({ ok: true, provider: 'Gemini', model: GEMINI_MODEL, guided_conversation: true, fast_lesson_feedback: true });
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
      emotion: clean(parsed?.emotion || 'neutral', 20),
      provider: 'Gemini'
    });
  } catch (error) {
    return res.status(502).json({ error: 'gemini_chat_error', details: clean(error?.message || error, 500) });
  }
}
