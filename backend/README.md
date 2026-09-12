# Backend da Conversa Viva

Esta pasta prepara a conexão da Conversa Viva com uma IA real sem expor a chave no GitHub Pages.

## Fluxo

1. O app envia somente a fala reconhecida, nível, personalidade, cenário e um pequeno histórico para um endpoint HTTPS.
2. O endpoint usa a chave secreta do provedor de IA no servidor.
3. A IA devolve JSON com `reply_pt` e `reply_en`.
4. O app fala a resposta em português e, quando houver, a frase em inglês.

## Variáveis secretas do servidor

- `AI_API_URL`: endpoint de chat/completions do provedor escolhido.
- `AI_API_KEY`: chave da API. Nunca deve ir para o front-end ou para o repositório público.
- `AI_MODEL`: modelo escolhido.

Depois de implantar `ai-worker-template.js` em um serviço seguro, coloque somente a URL pública desse endpoint em `live-config.js`, no campo `window.MEU_INGLES_AI_ENDPOINT`.

O front-end já funciona sem essa conexão usando respostas locais de demonstração. Quando o endpoint for preenchido, a mesma tela passa a usar a IA real automaticamente.
