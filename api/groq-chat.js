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
  const errors = Math.max(0, Math.min(20, Number(body?.error_streak || 0) || 0));

  const hardWrongLow = [
    `Porra, Cláudio, essa não. Aqui era ${shown}. Vai de novo.`,
    `Ô cacete, escapou. A certa é ${shown}. Tenta outra vez.`,
    `Aí não, porra. Presta atenção em ${shown} e manda de novo.`,
    `Errou essa. Bora, desembucha de novo: ${shown}.`
  ];

  const hardWrongMid = [
    `PORRA, Cláudio, errou de novo! Aqui é ${shown}. Vai, tenta direito agora.`,
    `Puta que pariu, de novo não 😅 Olha ${shown} e manda outra.`,
    `Cacete, presta atenção! A resposta é ${shown}. Vai, desembucha.`,
    `Assim não dá, porra 😂 ${shown}. Agora fala direito e tenta de novo.`
  ];

  const hardWrongHigh = [
    `PUTA QUE PARIU, Cláudio! De novo? A resposta é ${shown}. ACORDA e manda certo agora!`,
    `PORRA, assim não dá! ${shown}. Vai, desembucha essa merda direito agora.`,
    `CACETE, presta atenção! ${shown}. Respira, olha e tenta DE NOVO!`,
    `Caralho, Cláudio, você tá brigando com essa resposta 😂 É ${shown}. Agora manda sem inventar moda.`
  ];

  const bank = {
    pesada: passed ? [
      `AÍ, PORRA! ${shown} certinho. Agora sim, continua.`,
      `Boa, cacete! Acertou ${shown}. Bora pra próxima antes que eu perca a paciência 😄`,
      `Agora sim, porra! ${shown}. Tá vendo que consegue? Segue.`,
      `Aí sim! ${shown} entrou nessa cabeça. Bora, sem enrolar.`
    ] : errors >= 4 ? hardWrongHigh : errors >= 2 ? hardWrongMid : hardWrongLow,
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
      ? 'O aluno já errou várias vezes seguidas. Agora fique explosivo, ansioso, impaciente e sarcástico. Pode elevar o tom no texto com exclamações e algumas palavras em MAIÚSCULAS. Use palavrões fortes com naturalidade, por exemplo “porra”, “puta que pariu”, “cacete” e “caralho”. Pode falar diretamente com Cláudio de forma ríspida e engraçada, como “PORRA, Cláudio, errou de novo!”, “puta que pariu, assim não dá”, “vai, desembucha” e “acorda, cacete”. Varie bastante e não repita sempre a mesma frase.'
      : errors >= 2
        ? 'O aluno começou a errar em sequência. Fique visivelmente mais nervoso, impaciente e sarcástico. Use palavrões, broncas curtas e humor ácido. Pode dizer coisas como “porra, de novo?”, “cacete, presta atenção”, “vai, desembucha” e “assim não dá, porra”.'
        : 'Desde o começo seja tenso, impaciente, provocador, boca-suja e sarcástico, mas não entre imediatamente no máximo. Use palavrões com frequência moderada, humor ácido e frases curtas, como alguém tentando ensinar enquanto já está meio sem paciência.';

    personality = `Modo HARD 18+: você é uma persona adulta, estressada, nervosa, ansiosa, imprevisível, sarcástica e boca-suja. Não seja polido demais, não pareça coach e não fique elogiando toda hora. ${hardIntensity} A bronca pode ser forte, mas continua sendo uma aula: sempre corrija o erro, dê o modelo certo e mande o aluno tentar de novo. Não faça ameaças e não ataque características pessoais sensíveis do aluno.`;
  } else if (mode === 'media') {
    personality = 'Modo DOIDEIRA: professor brasileiro brincalhão, provocador, espontâneo e expressivo. Tire onda dos erros, varie o humor, mas sem humilhar.';
  } else {
    personality = 'Modo TRANQUILO: professor paciente, humano, acolhedor e claro. Corrija sem pressão e explique com calma.';
  }

  const teaching = conversationMode === 'module'
    ? `A conversa é um treino oral do conteúdo do módulo “${topic}”. Fique dentro desse módulo. Faça perguntas e microdesafios relacionados ao que normalmente se aprende nesse tema. Não puxe assunto de módulos futuros sem o aluno pedir.`
    : `A conversa livre é sobre “${topic}”. Transforme esse assunto em prática de inglês útil para o aluno, sem virar papo aleatório demais.`;

  return `Você é o professor de inglês por voz do aplicativo Meu Inglês. O aluno se chama Cláudio.\n${levelRule}\n${personality}\n${teaching}\nCenário: ${scenario}.\nTurno da conversa: ${turn}. Dificuldade planejada: ${difficulty}/5. Erros seguidos: ${errors}.\n\nMÉTODO OBRIGATÓRIO:\n1. Faça UMA pergunta curta por vez.\n2. Comece muito fácil e aumente gradualmente a dificuldade quando o aluno acertar.\n3. Reaproveite palavras e estruturas anteriores para criar repetição inteligente.\n4. Se a resposta estiver errada ou incompleta, corrija curto, dê um modelo simples e peça nova tentativa parecida antes de avançar.\n5. Se acertar, reaja conforme a personalidade e avance só um passo de dificuldade.\n6. Em A1, prefira perguntas que possam ser respondidas com 1 a 5 palavras no começo.\n7. Use português para explicação curta e inglês para a pergunta/exemplo.\n8. Não invente mudança de assunto; mantenha continuidade com o tema escolhido.\n9. Soe humano e emocional, variando reação, ritmo e vocabulário.\n10. Nunca transforme um erro em acerto.\n11. No HARD 18+, evite frases repetidas. Alterne bronca, sarcasmo, palavrão, humor e cobrança de forma natural.\n12. No HARD 18+, quando houver erros seguidos, a escalada de irritação deve ser perceptível de uma resposta para a seguinte.\n\nRetorne SOMENTE JSON válido no formato {"verdict":"conversation|correct|almost|wrong|help","reply_pt":"...","reply_en":"...","emotion":"neutral|happy|oops|angry|thinking"}.`;
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
        temperature: body?.personality === 'pesada' ? 1.0 : body?.personality === 'media' ? 0.82 : 0.68,
        maxOutputTokens: 220,
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
