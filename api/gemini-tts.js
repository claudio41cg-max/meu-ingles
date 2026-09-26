export default async function handler(req, res) {
  const allowedOrigins = new Set([
    'https://claudio41cg-max.github.io',
    'https://meu-ingles-claudio.netlify.app'
  ]);
  const origin = req.headers.origin || '';
  const allowOrigin = allowedOrigins.has(origin) ? origin : 'null';

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return res.status(503).json({ error: 'gemini_not_configured' });

  const DEFAULT_MODEL = 'gemini-2.5-flash-preview-tts';
  const supportedModels = new Set(['gemini-2.5-flash-preview-tts','gemini-3.8-flash-lite-tts']);
  const supportedVoices = new Set([
    'Zephyr','Puck','Charon','Kore','Fenrir','Leda','Orus','Aoede','Callirrhoe','Autonoe',
    'Enceladus','Iapetus','Umbriel','Algieba','Despina','Erinome','Algenib','Rasalgethi',
    'Laomedeia','Achernar','Alnilam','Schedar','Gacrux','Pulcherrima','Achird',
    'Zubenelgenubi','Vindemiatrix','Sadachbia','Sadaltager','Sulafat'
  ]);

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const sampleRateFromMime = (mime = '') => {
    const m = String(mime).match(/rate=(\d+)/i);
    return m ? Number(m[1]) || 24000 : 24000;
  };

  const retrySecondsFrom = raw => {
    const s = String(raw || '');
    const m1 = s.match(/retryDelay[\\\"']?\s*[:=]\s*[\\\"']?(\d+(?:\.\d+)?)s/i);
    const m2 = s.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
    const n = Number((m1 || m2)?.[1] || 0);
    return Number.isFinite(n) && n > 0 ? Math.ceil(n) : 15;
  };

  async function generate(text, voice, lang, style, model = DEFAULT_MODEL) {
    const instruction = lang === 'pt-BR'
      ? `Fale apenas em português brasileiro. Soe como uma pessoa conversando cara a cara, com ritmo natural, pequenas pausas e entonação espontânea. Não use voz de locutor, assistente virtual ou robô. ${style}\n\nDiga somente isto: ${text}`
      : `Speak only in natural American English for a complete beginner. Use clear pronunciation, warm human rhythm and small natural pauses. Do not sound like an announcer, screen reader or robot. ${style}\n\nSay only this: ${text}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: instruction }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            languageCode: lang,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice }
            }
          }
        }
      })
    });

    const raw = await response.text();
    if (!response.ok) {
      const err = new Error(`${model}_${response.status}:${raw.slice(0, 500)}`);
      err.statusCode = response.status;
      if (response.status === 429) err.retryAfter = retrySecondsFrom(raw);
      throw err;
    }

    let data;
    try { data = JSON.parse(raw); } catch { throw new Error('invalid_gemini_json'); }
    const part = data?.candidates?.[0]?.content?.parts?.find(p => p?.inlineData?.data);
    if (!part?.inlineData?.data) throw new Error('gemini_no_audio');

    const mime = part.inlineData.mimeType || 'audio/L16;codec=pcm;rate=24000';
    return {
      audio: part.inlineData.data,
      mime,
      sample_rate: sampleRateFromMime(mime),
      model,
      protocol: 'generateContent',
      provider: 'Gemini',
      voice,
      usageMetadata: data?.usageMetadata || null
    };
  }

  if (req.method === 'GET') {
    if (req.query?.diagnostic !== '1') {
      return res.status(200).json({
        ok: true,
        provider: 'Gemini',
        model: DEFAULT_MODEL,
        key_configured: true,
        tts_api: 'generateContent',
        default_voice: 'Puck'
      });
    }

    try {
      const diagModel = supportedModels.has(String(req.query?.model||'')) ? String(req.query.model) : DEFAULT_MODEL;
      const out = await generate('Hello, this is a Gemini voice test.', 'Puck', 'en-US', 'Natural and conversational.', diagModel);
      return res.status(200).json({
        ok: true,
        diagnostic: true,
        provider: out.provider,
        model: out.model,
        protocol: out.protocol,
        voice: out.voice,
        sample_rate: out.sample_rate,
        audio_received: !!out.audio
      });
    } catch (error) {
      if (Number(error?.statusCode) === 429) {
        const retryAfter = Number(error?.retryAfter) || 15;
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({
          ok: false,
          diagnostic: true,
          error: 'gemini_rate_limited',
          retry_after_seconds: retryAfter,
          message: `Limite gratuito temporário do Gemini TTS. Tente novamente em ${retryAfter} segundos.`
        });
      }
      return res.status(502).json({
        ok: false,
        diagnostic: true,
        error: 'gemini_tts_diagnostic_failed',
        details: String(error?.message || error).slice(0, 1000)
      });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!allowedOrigins.has(origin)) return res.status(403).json({ error: 'origin_not_allowed' });

  const body = req.body || {};
  const text = String(body.text || '').trim().slice(0, 2000);
  if (!text) return res.status(400).json({ error: 'empty_text' });

  const lang = String(body.lang || 'pt-BR').toLowerCase().startsWith('en') ? 'en-US' : 'pt-BR';
  const requestedVoice = String(body.voice || 'Puck').trim();
  const voice = supportedVoices.has(requestedVoice) ? requestedVoice : 'Puck';
  const style = String(body.style || 'natural').slice(0, 320);
  const requestedModel = String(body.model || DEFAULT_MODEL).trim();
  const model = supportedModels.has(requestedModel) ? requestedModel : DEFAULT_MODEL;

  try {
    const out = await generate(text, voice, lang, style, model);
    return res.status(200).json({ ok: true, ...out });
  } catch (error) {
    if (Number(error?.statusCode) === 429) {
      const retryAfter = Number(error?.retryAfter) || 15;
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'gemini_rate_limited',
        retry_after_seconds: retryAfter,
        message: `Limite temporário do Gemini TTS. Tente novamente em ${retryAfter} segundos.`
      });
    }

    // Falhas 5xx/transitórias do Gemini: tenta novamente com instrução curta
    // e vozes conhecidas antes de devolver erro ao aluno.
    const fallbackVoices = [...new Set([voice, 'Aoede', 'Puck'])];
    const retryErrors = [String(error?.message || error)];
    for (const fallbackVoice of fallbackVoices) {
      try {
        await sleep(450);
        const out = await generate(
          text,
          fallbackVoice,
          lang,
          lang === 'en-US'
            ? 'Clear, natural American English pronunciation. Say only the requested text.'
            : 'Português brasileiro natural e claro. Diga somente o texto solicitado.',
          model
        );
        return res.status(200).json({
          ok: true,
          ...out,
          recovered: true,
          requested_voice: voice
        });
      } catch (retryError) {
        if (Number(retryError?.statusCode) === 429) {
          const retryAfter = Number(retryError?.retryAfter) || 15;
          res.setHeader('Retry-After', String(retryAfter));
          return res.status(429).json({
            error: 'gemini_rate_limited',
            retry_after_seconds: retryAfter,
            message: `Limite temporário do Gemini TTS. Tente novamente em ${retryAfter} segundos.`
          });
        }
        retryErrors.push(String(retryError?.message || retryError));
      }
    }

    return res.status(502).json({
      error: 'gemini_tts_error',
      message: 'Falha temporária ao gerar o áudio. Toque em Ouvir novamente.',
      details: retryErrors.slice(-4).join(' | ').slice(0, 1600)
    });
  }
}
