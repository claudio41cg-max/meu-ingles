# Grok Voice no Meu Inglês

A versão v8 já contém o cliente do Grok Voice e o modo Hard progressivo.

## Arquitetura

1. O PWA continua público no GitHub Pages.
2. A chave `XAI_API_KEY` nunca entra no GitHub.
3. Uma função segura cria um token temporário em `POST https://api.x.ai/v1/realtime/client_secrets`.
4. O navegador recebe apenas esse token de curta duração.
5. O navegador conecta em `wss://api.x.ai/v1/realtime?model=grok-voice-latest` usando o protocolo `xai-client-secret.<TOKEN>`.
6. O Grok responde com voz PCM a 24 kHz e o mascote reage enquanto pensa e fala.

## Backend preparado

Arquivo: `netlify/functions/xai-session.mjs`

Variáveis de ambiente:

- `XAI_API_KEY` — segredo obrigatório. Nunca publicar no repositório.
- `ALLOWED_ORIGIN=https://claudio41cg-max.github.io`
- `XAI_MODEL=grok-voice-latest`
- `XAI_VOICE=eve`
- `XAI_SESSION_TTL=90`

O projeto Netlify já pode ser usado somente como backend. O app continua hospedado no GitHub Pages.

## Front-end preparado

Arquivo: `live-config.js`

Enquanto o backend não estiver realmente implantado e a chave não estiver configurada, mantenha:

`window.MEU_INGLES_XAI_ENABLED = false;`

Depois de testar o endpoint seguro, troque para `true`.

## Personalidades

- Tranquilo: correção paciente.
- Doideira: brincadeira e provocação moderada.
- Hard 18+: palavrões e irritação progressiva quando o mesmo erro se repete. O contador zera quando o aluno acerta.

O prompt do Grok também recebe essas regras para a conversa livre, de modo que a progressão não dependa apenas das frases pré-programadas do curso.
