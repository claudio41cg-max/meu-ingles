// Template de backend seguro para a Conversa Viva.
// Compatível com provedores que aceitam o formato OpenAI-compatible chat/completions.
// NÃO coloque chaves no GitHub. Configure as variáveis no serviço onde este arquivo for implantado:
// AI_API_URL, AI_API_KEY e AI_MODEL.

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Use POST', { status: 405, headers: cors });

    try {
      const body = await request.json();
      const message = String(body.message || '').slice(0, 1500);
      const level = String(body.level || 'A1');
      const personality = String(body.personality || 'media');
      const scenario = String(body.scenario || 'Livre');
      const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

      if (!message) return json({ error: 'Mensagem vazia' }, 400, cors);
      if (!env.AI_API_URL || !env.AI_API_KEY || !env.AI_MODEL) {
        return json({ error: 'Backend ainda não configurado' }, 503, cors);
      }

      const style = personality === 'pesada'
        ? 'Modo Hard 18+: use humor adulto, gírias e palavrões ocasionais de forma brincalhona. Nunca humilhe, ameace ou ataque características pessoais do aluno.'
        : personality === 'media'
          ? 'Modo Doideira: seja brincalhão, provocador e engraçado, mas sem palavrões pesados.'
          : 'Modo Tranquilo: seja paciente, acolhedor, natural e use humor leve.';

      const system = `Você é a professora de inglês do aplicativo Meu Inglês, voltado para um brasileiro chamado Cláudio. Nível atual: ${level}. Cenário: ${scenario}. ${style}\n\nRegras:\n1. Responda primeiro em português do Brasil com uma reação curta, natural e divertida.\n2. Depois forneça uma única frase em inglês adequada ao nível do aluno para continuar a conversa.\n3. Não transforme tudo em aula de gramática. Priorize conversa viva.\n4. Se o aluno errar inglês, corrija de forma breve e útil.\n5. Retorne APENAS JSON válido neste formato: {"reply_pt":"...","reply_en":"..."}`;

      const messages = [
        { role: 'system', content: system },
        ...history.filter(x => x && (x.role === 'user' || x.role === 'assistant')).map(x => ({ role: x.role, content: String(x.content || '').slice(0, 1000) })),
        { role: 'user', content: message }
      ];

      const upstream = await fetch(env.AI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: env.AI_MODEL, messages, temperature: 0.8 })
      });

      if (!upstream.ok) {
        const txt = await upstream.text();
        return json({ error: 'Falha no provedor de IA', detail: txt.slice(0, 300) }, 502, cors);
      }

      const data = await upstream.json();
      const raw = data?.choices?.[0]?.message?.content || '';
      const clean = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      let parsed;
      try { parsed = JSON.parse(clean); }
      catch { parsed = { reply_pt: clean || 'Vamos continuar.', reply_en: '' }; }

      return json({
        reply_pt: String(parsed.reply_pt || 'Vamos continuar.').slice(0, 600),
        reply_en: String(parsed.reply_en || '').slice(0, 400)
      }, 200, cors);
    } catch (err) {
      return json({ error: 'Erro interno', detail: String(err.message || err).slice(0, 200) }, 500, cors);
    }
  }
};

function json(value, status, cors) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
  });
}
