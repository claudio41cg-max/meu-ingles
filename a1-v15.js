(()=>{
'use strict';
const KEY='meuInglesStableV2';
const API=location.hostname.endsWith('github.io')?'https://meu-ingles-claudio.netlify.app':'';
const CHAT=API+'/api/groq-chat',TTS=API+'/api/gemini-tts';
const oldOpen=window.openStableLesson,oldModule=window.openStableModule;
let run=null,menu=false,ctx=null,src=null,autoSpeakTimer=null,wordSpeakChain=Promise.resolve();

const RAW=[
['','','','👋|hello|olá|Olá!','🙏|thank you|obrigado|Obrigado','✅|yes, please|sim, por favor|Sim, por favor','🙅|no, thank you|não, obrigado|Não, obrigado','👋|goodbye|adeus|Até logo'],
['🙂|My name is...|Meu nome é...|Meu nome é...','🔢|one, two, three, four, five|um, dois, três, quatro, cinco|Números de 1 a 10','🔟|eleven, twelve, thirteen, fourteen, fifteen|onze, doze, treze, quatorze, quinze|Números até 20','📱|My phone number is...|Meu telefone é...|Meu telefone','🎂|I am ... years old.|Eu tenho ... anos.|Minha idade','🏠|My address is...|Meu endereço é...|Meu endereço','🔤|How do you spell your name?|Como se soletra seu nome?|Soletrando meu nome','🪪|My name is... and my phone number is...|Meu nome é... e meu telefone é...|Revisão: meus dados pessoais'],
['👩|mother|mãe|Mãe','👨|father|pai|Pai','👦|brother|irmão|Irmão','👧|sister|irmã|Irmã','🧑‍🤝‍🧑|friend|amigo|Amigo','👨‍👩‍👧‍👦|family|família|Família','👉|this is|este é|Este é','🏠|this is my family.|esta é minha família.|Esta é minha família'],
['🌅|morning|manhã|Manhã','💼|work|trabalho|Trabalho','🍽️|eat|comer|Comer','🥤|drink|beber|Beber','🏠|home|casa|Casa','🌙|night|noite|Noite','😴|sleep|dormir|Dormir','📅|today|hoje|Hoje'],
['❤️|I like|eu gosto|Eu gosto','☕|I like coffee.|eu gosto de café.|Eu gosto de café','❓|do you like?|você gosta?|Você gosta?','👉|do you want?|você quer?|Você quer?','💼|do you work?|você trabalha?|Você trabalha?','📍|where?|onde?|Onde?','❔|what?|o quê?|O quê?','✅|yes|sim|Sim'],
['🏠|house|casa|Casa','🛏️|room|quarto|Quarto','🍳|kitchen|cozinha|Cozinha','🚿|bathroom|banheiro|Banheiro','🛣️|street|rua|Rua','🛒|market|mercado|Mercado','👇|here|aqui|Aqui','👉|there|ali|Ali'],
['🍞|bread|pão|Pão','🍚|rice|arroz|Arroz','🍗|chicken|frango|Frango','🐟|fish|peixe|Peixe','🧃|juice|suco|Suco','📋|menu|cardápio|Cardápio','🧾|bill|conta|Conta','😋|I am hungry.|estou com fome.|Estou com fome'],
['👉|this|isto|Isto','👈|that|aquilo|Aquilo','💲|how much?|quanto custa?|Quanto custa?','🏷️|cheap|barato|Barato','💸|expensive|caro|Caro','🤏|small|pequeno|Pequeno','🙌|big|grande|Grande','🛍️|buy|comprar|Comprar'],
['⬅️|left|esquerda|Esquerda','➡️|right|direita|Direita','⬆️|straight|em frente|Em frente','🚌|bus|ônibus|Ônibus','🚗|car|carro|Carro','🚉|station|estação|Estação','🛑|stop here.|pare aqui.|Pare aqui','📍|is it near?|é perto?|É perto?'],
['🎵|music|música|Música','🎬|movie|filme|Filme','🎮|game|jogo|Jogo','⚽|football|futebol|Futebol','🍳|cook|cozinhar|Cozinhar','🏊|swim|nadar|Nadar','💪|I can|eu consigo|Eu consigo','❓|can you swim?|você consegue nadar?|Você consegue nadar?'],
['🗓️|yesterday|ontem|Ontem','💼|worked|trabalhei|Trabalhei','🍽️|ate|comi|Comi','🥤|drank|bebi|Bebi','📺|watched|assisti|Assisti','🚶|went|fui|Fui','🏠|stayed|fiquei|Fiquei','🎉|weekend|fim de semana|Fim de semana'],
['👋|hello|olá|Olá de novo','🙂|my name is|meu nome é|Meu nome é...','💧|water, please.|água, por favor.|Água, por favor','🛒|where is the market?|onde fica o mercado?|Onde fica o mercado?','💲|how much?|quanto custa?|Quanto custa?','⬅️|turn left.|vire à esquerda.|Vire à esquerda','🙏|thank you|obrigado|Obrigado','👋|goodbye|adeus|Até logo']
];
const MT=['Hello!','Números e apresentação','Família e pessoas','Rotina diária','Perguntas e hábitos','Casa e cidade','Comida e restaurante','Compras e preços','Direções e transporte','Tempo livre e habilidades','Ontem e fim de semana','Projeto A1'];
const START=['Hello / Hi','Bom dia, boa tarde e boa noite','How are you?','Como responder','Thank you / And you?','Goodbye!','Desafio Hello!','Minha primeira conversa'];

function firstContactLesson(n){
 const L=[
  {title:'Hello / Hi',steps:[
   {t:'phrase',x:{e:'👋',en:'Hello!',pt:'Olá! · Ouça e repita em voz alta.'}},
   {t:'phrase',x:{e:'🙂',en:'Hi!',pt:'Oi! · Forma curta e informal.'}},
   {t:'choice',q:'“Hello!” significa:',ans:'Olá!',op:['Olá!','Obrigado.','Até logo.'],audio:'Hello!'},
   {t:'choice',q:'Qual figura combina com uma saudação?',ans:'👋 Hello!',op:['👋 Hello!','☕ Coffee','🚗 Car']},
   {t:'choice',q:'Qual expressão você ouviu?',ans:'Hello!',op:['Hello!','Goodbye!','Thank you.'],audio:'Hello!'},
   {t:'guided',q:'Uma pessoa disse “Hello!”. O que combina como resposta?',ans:'Hi!',op:['Hi!','Goodbye!','No, thank you.']},
   {t:'review',items:[{e:'👋',en:'Hello!',pt:'Olá!'},{e:'🙂',en:'Hi!',pt:'Oi!'}]}
  ]},
  {title:'Bom dia, boa tarde e boa noite',steps:[
   {t:'phrase',x:{e:'🌅',en:'Good morning!',pt:'Bom dia! · Ouça e repita.'}},
   {t:'phrase',x:{e:'☀️',en:'Good afternoon!',pt:'Boa tarde! · Ouça e repita.'}},
   {t:'phrase',x:{e:'🌙',en:'Good evening!',pt:'Boa noite! · Ouça e repita.'}},
   {t:'choice',q:'08:00 ☀️ — qual cumprimento combina?',ans:'Good morning!',op:['Good morning!','Good afternoon!','Good evening!'],audio:'Good morning!'},
   {t:'choice',q:'19:30 🌙 — qual cumprimento combina?',ans:'Good evening!',op:['Good morning!','Good afternoon!','Good evening!'],audio:'Good evening!'},
   {t:'choice',q:'Qual figura representa “Good morning”?',ans:'🌅 Good morning!',op:['🌅 Good morning!','🌙 Good evening!','🍽️ Food']},
   {t:'review',items:[{e:'🌅',en:'Good morning!',pt:'Bom dia!'},{e:'☀️',en:'Good afternoon!',pt:'Boa tarde!'},{e:'🌙',en:'Good evening!',pt:'Boa noite!'}]}
  ]},
  {title:'How are you?',steps:[
   {t:'phrase',x:{e:'💬',en:'How are you?',pt:'Como você está? · Ouça e repita.'}},
   {t:'choice',q:'“How are you?” significa:',ans:'Como você está?',op:['Como você está?','Qual é seu nome?','Onde fica?'],audio:'How are you?'},
   {t:'choice',q:'Qual resposta combina com “How are you?”?',ans:"🙂 I'm good.",op:["🙂 I'm good.",'👋 Goodbye!','🙏 Thank you.']},
   {t:'choice',q:'Qual pergunta você ouviu?',ans:'How are you?',op:['How are you?','What’s your name?','Goodbye!'],audio:'How are you?'},
   {t:'build',q:'Monte a pergunta em inglês:',pt:'Como você está?',target:'How are you?',tokens:['How','are','you?']},
   {t:'review',items:[{e:'💬',en:'How are you?',pt:'Como você está?'}]}
  ]},
  {title:'Como responder',steps:[
   {t:'phrase',x:{e:'🙂',en:"I'm good.",pt:'Estou bem. · Ouça e repita.'}},
   {t:'phrase',x:{e:'😊',en:"I'm fine.",pt:'Estou bem. · Outra resposta comum.'}},
   {t:'phrase',x:{e:'👌',en:"I'm okay.",pt:'Estou bem / estou legal.'}},
   {t:'guided',q:'How are you?',ans:"I'm good.",op:["I'm good.",'Goodbye!','My name is…']},
   {t:'choice',q:'Qual frase em inglês significa “Estou bem”?',ans:"🙂 I'm good.",op:["🙂 I'm good.",'👋 Goodbye!','🌅 Good morning!']},
   {t:'choice',q:'Qual resposta você ouviu?',ans:"I'm fine.",op:["I'm fine.","I'm okay.",'Goodbye!'],audio:"I'm fine."},
   {t:'review',items:[{e:'🙂',en:"I'm good.",pt:'Estou bem.'},{e:'😊',en:"I'm fine.",pt:'Estou bem.'},{e:'👌',en:"I'm okay.",pt:'Estou legal.'}]}
  ]},
  {title:'Thank you / And you?',steps:[
   {t:'phrase',x:{e:'🙏',en:'Thank you.',pt:'Obrigado. · Ouça e repita.'}},
   {t:'phrase',x:{e:'👉',en:'And you?',pt:'E você? · Use para devolver a pergunta.'}},
   {t:'phrase',x:{e:'🙂',en:"I'm fine, thank you. And you?",pt:'Estou bem, obrigado. E você?'}},
   {t:'choice',q:'“And you?” significa:',ans:'E você?',op:['E você?','Qual é seu nome?','Até logo.'],audio:'And you?'},
   {t:'choice',q:'Qual expressão em inglês combina com um agradecimento?',ans:'🙏 Thank you.',op:['🙏 Thank you.','🚗 Car','🏠 House']},
   {t:'build',q:'Monte a frase:',pt:'Obrigado. E você?',target:'Thank you. And you?',tokens:['Thank','you.','And','you?']},
   {t:'review',items:[{e:'🙏',en:'Thank you.',pt:'Obrigado.'},{e:'👉',en:'And you?',pt:'E você?'}]}
  ]},
  {title:'Goodbye!',steps:[
   {t:'phrase',x:{e:'👋',en:'Goodbye!',pt:'Adeus / até logo!'}},
   {t:'phrase',x:{e:'🙋',en:'Bye!',pt:'Tchau!'}},
   {t:'phrase',x:{e:'✨',en:'See you!',pt:'Até mais!'}},
   {t:'choice',q:'Você está indo embora. Qual expressão combina?',ans:'See you!',op:['Hello!','See you!','Good morning!'],audio:'See you!'},
   {t:'choice',q:'Qual expressão em inglês representa uma despedida?',ans:'👋 Goodbye!',op:['👋 Goodbye!','☕ Coffee','🏠 House']},
   {t:'guided',q:'A outra pessoa disse “Goodbye!”. Responda:',ans:'See you!',op:['See you!','How are you?','Thank you.']},
   {t:'review',items:[{e:'👋',en:'Goodbye!',pt:'Até logo!'},{e:'🙋',en:'Bye!',pt:'Tchau!'},{e:'✨',en:'See you!',pt:'Até mais!'}]}
  ]},
  {title:'Desafio Hello!',steps:[
   {t:'choice',q:'Escute e escolha.',ans:'Good evening!',op:['Good morning!','Good evening!','Goodbye!'],audio:'Good evening!'},
   {t:'choice',q:'How are you?',ans:'Como você está?',op:['Como você está?','Qual é seu nome?','Onde fica?']},
   {t:'guided',q:'How are you?',ans:"I'm fine.",op:["I'm fine.",'Goodbye!','Thank you.']},
   {t:'choice',q:'Qual expressão em inglês significa “Obrigado”?',ans:'🙏 Thank you.',op:['🙏 Thank you.','🌙 Good evening!','🚗 Car']},
   {t:'build',q:'Monte a resposta:',pt:'Estou bem, obrigado.',target:"I'm fine, thank you.",tokens:["I'm",'fine,','thank','you.']},
   {t:'review',items:[{e:'👋',en:'Hello!',pt:'Olá!'},{e:'💬',en:'How are you?',pt:'Como você está?'},{e:'🙏',en:'Thank you.',pt:'Obrigado.'},{e:'👋',en:'Goodbye!',pt:'Até logo!'}]}
  ]},
  {title:'Minha primeira conversa',steps:[
   {t:'phrase',x:{e:'✨',en:'Hello!',pt:'Missão final: cumprimente, diga como está e se despeça.'}},
   {t:'guided',q:'Hello!',ans:'Hi!',op:['Hi!','Goodbye!','No.']},
   {t:'guided',q:'How are you?',ans:"I'm good.",op:["I'm good.",'Hello!','Goodbye!']},
   {t:'guided',q:"I'm fine, thank you. And you?",ans:"I'm good.",op:["I'm good.",'Goodbye!','Good morning!']},
   {t:'guided',q:'Goodbye!',ans:'See you!',op:['See you!','How are you?','Thank you.']},
   {t:'choice',q:'Qual sequência representa uma conversa completa?',ans:"👋 Hello! → 🙂 I'm good. → 👋 See you!",op:["👋 Hello! → 🙂 I'm good. → 👋 See you!",'🍽️ Food → 🚗 Car → 🏠 House','🌅 Good morning! → 🙏 Thank you. → 👋 Hello!']},
   {t:'review',items:[{e:'👋',en:'Hello!',pt:'Olá!'},{e:'💬',en:'How are you?',pt:'Como você está?'},{e:'🙂',en:"I'm good.",pt:'Estou bem.'},{e:'👋',en:'See you!',pt:'Até mais!'}]}
  ]}
 ];
 return L[n]||L[0];
}
const MODULE_TWO_TITLES=[
 'Meu nome é…',
 'Qual é o seu nome?',
 'Prazer em conhecer você',
 'I am / I’m',
 'De onde você é?',
 'Como se soletra seu nome?',
 'Desafio: apresentação',
 'Minha apresentação completa'
];

function secondContactLesson(n){
 const L=[
  {title:MODULE_TWO_TITLES[0],steps:[
   {t:'choice',q:'Revisão rápida: alguém disse “Hello!”. Qual resposta combina?',ans:'Hi!',op:['Hi!','Goodbye!','Thank you.'],audio:'Hello!'},
   {t:'phrase',x:{e:'🙂',en:'My name is Alex.',pt:'Meu nome é Alex. · Ouça e repita.'}},
   {t:'phrase',x:{e:'👋',en:"I'm Alex.",pt:'Eu sou Alex. · Forma curta e natural.'}},
   {t:'choice',q:'“My name is…” significa:',ans:'Meu nome é…',op:['Meu nome é…','Como você está?','Até logo.'],audio:'My name is Alex.'},
   {t:'build',q:'Monte a frase:',pt:'Meu nome é Alex.',target:'My name is Alex.',tokens:['My','name','is','Alex.']},
   {t:'guided',q:'Hello! My name is Anna. E você?',ans:'My name is Alex.',op:['My name is Alex.','Goodbye!','I am fine.']},
   {t:'guided',q:'How are you?',ans:"I'm good.",op:["I'm good.",'My name is Alex.','See you!']},
   {t:'review',items:[{e:'👋',en:'Hello!',pt:'Olá!'},{e:'🙂',en:'My name is Alex.',pt:'Meu nome é Alex.'},{e:'💬',en:'How are you?',pt:'Como você está?'}]}
  ]},
  {title:MODULE_TWO_TITLES[1],steps:[
   {t:'choice',q:'Revisando: “My name is Alex.” significa:',ans:'Meu nome é Alex.',op:['Meu nome é Alex.','Estou bem.','Até logo.'],audio:'My name is Alex.'},
   {t:'phrase',x:{e:'❓',en:"What's your name?",pt:'Qual é o seu nome?'}},
   {t:'choice',q:'Qual pergunta você ouviu?',ans:"What's your name?",op:["What's your name?",'How are you?','Where are you?'],audio:"What's your name?"},
   {t:'choice',q:'“What’s your name?” significa:',ans:'Qual é o seu nome?',op:['Qual é o seu nome?','Como você está?','De onde você é?']},
   {t:'build',q:'Monte a pergunta:',pt:'Qual é o seu nome?',target:"What's your name?",tokens:["What's",'your','name?']},
   {t:'guided',q:"What's your name?",ans:'My name is Alex.',op:['My name is Alex.','Good morning!','See you!']},
   {t:'guided',q:'Hello! What’s your name?',ans:'My name is Alex.',op:['My name is Alex.',"I'm fine.",'Goodbye!']},
   {t:'review',items:[{e:'❓',en:"What's your name?",pt:'Qual é o seu nome?'},{e:'🙂',en:'My name is Alex.',pt:'Meu nome é Alex.'},{e:'👋',en:'Hello!',pt:'Olá!'}]}
  ]},
  {title:MODULE_TWO_TITLES[2],steps:[
   {t:'guided',q:"What's your name?",ans:'My name is Alex.',op:['My name is Alex.',"I'm okay.",'Goodbye!']},
   {t:'phrase',x:{e:'🤝',en:'Nice to meet you.',pt:'Prazer em conhecer você.'}},
   {t:'phrase',x:{e:'😊',en:'Nice to meet you too.',pt:'Prazer em conhecer você também.'}},
   {t:'choice',q:'Qual resposta combina com “Nice to meet you”?',ans:'Nice to meet you too.',op:['Nice to meet you too.','Goodbye!','My name is…'],audio:'Nice to meet you.'},
   {t:'guided',q:'Hello! My name is Anna. Nice to meet you.',ans:'Nice to meet you too.',op:['Nice to meet you too.','How are you?','Good evening!']},
   {t:'choice',q:'Revisão antiga: “And you?” significa:',ans:'E você?',op:['E você?','Qual é seu nome?','Até logo.'],audio:'And you?'},
   {t:'build',q:'Monte a frase:',pt:'Prazer em conhecer você.',target:'Nice to meet you.',tokens:['Nice','to','meet','you.']},
   {t:'review',items:[{e:'🤝',en:'Nice to meet you.',pt:'Prazer em conhecer você.'},{e:'❓',en:"What's your name?",pt:'Qual é o seu nome?'},{e:'👉',en:'And you?',pt:'E você?'}]}
  ]},
  {title:MODULE_TWO_TITLES[3],steps:[
   {t:'guided',q:'Nice to meet you.',ans:'Nice to meet you too.',op:['Nice to meet you too.','See you!','Thank you.']},
   {t:'phrase',x:{e:'🗣️',en:'I am Alex.',pt:'Eu sou Alex.'}},
   {t:'phrase',x:{e:'⚡',en:"I'm Alex.",pt:'Eu sou Alex. · Forma contraída.'}},
   {t:'choice',q:'Qual forma curta significa “I am”?',ans:"I'm",op:["I'm",'My','You']},
   {t:'choice',q:'Qual frase você ouviu?',ans:"I'm Alex.",op:["I'm Alex.",'My name Anna.','You are Alex.'],audio:"I'm Alex."},
   {t:'build',q:'Monte a forma curta:',pt:'Eu sou Alex.',target:"I'm Alex.",tokens:["I'm",'Alex.']},
   {t:'choice',q:'Lembra da aula anterior? Qual frase significa “Meu nome é Alex”?',ans:'My name is Alex.',op:['My name is Alex.',"I'm fine.",'Nice to meet you.']},
   {t:'review',items:[{e:'🗣️',en:'I am Alex.',pt:'Eu sou Alex.'},{e:'⚡',en:"I'm Alex.",pt:'Eu sou Alex.'},{e:'🙂',en:'My name is Alex.',pt:'Meu nome é Alex.'}]}
  ]},
  {title:MODULE_TWO_TITLES[4],steps:[
   {t:'choice',q:'Revisão: qual pergunta pede o nome?',ans:"What's your name?",op:["What's your name?",'How are you?','Where are you from?'],audio:"What's your name?"},
   {t:'phrase',x:{e:'🌎',en:'Where are you from?',pt:'De onde você é?'}},
   {t:'phrase',x:{e:'🇧🇷',en:"I'm from Brazil.",pt:'Eu sou do Brasil.'}},
   {t:'choice',q:'“Where are you from?” significa:',ans:'De onde você é?',op:['De onde você é?','Qual é seu nome?','Como você está?'],audio:'Where are you from?'},
   {t:'guided',q:'Where are you from?',ans:"I'm from Brazil.",op:["I'm from Brazil.",'My name is Brazil.','Goodbye!']},
   {t:'build',q:'Monte a resposta:',pt:'Eu sou do Brasil.',target:"I'm from Brazil.",tokens:["I'm",'from','Brazil.']},
   {t:'guided',q:'Hello! What’s your name?',ans:'My name is Alex.',op:['My name is Alex.',"I'm from Brazil.",'See you!']},
   {t:'review',items:[{e:'🌎',en:'Where are you from?',pt:'De onde você é?'},{e:'🇧🇷',en:"I'm from Brazil.",pt:'Eu sou do Brasil.'},{e:'👋',en:'Hello!',pt:'Olá!'}]}
  ]},
  {title:MODULE_TWO_TITLES[5],steps:[
   {t:'guided',q:'Where are you from?',ans:"I'm from Brazil.",op:["I'm from Brazil.",'Nice to meet you.','Goodbye!']},
   {t:'phrase',x:{e:'🔤',en:'How do you spell your name?',pt:'Como se soletra seu nome?'}},
   {t:'phrase',x:{e:'🔡',en:'A-L-E-X.',pt:'A-L-E-X.'}},
   {t:'choice',q:'Qual pergunta pede para soletrar?',ans:'How do you spell your name?',op:['How do you spell your name?',"What's your name?",'How are you?'],audio:'How do you spell your name?'},
   {t:'guided',q:'How do you spell your name?',ans:'A-L-E-X.',op:['A-L-E-X.','Brazil.','Nice to meet you.']},
   {t:'choice',q:'Revisão do primeiro módulo: qual expressão encerra uma conversa?',ans:'See you!',op:['See you!','How are you?','Hello!'],audio:'See you!'},
   {t:'build',q:'Monte a pergunta:',pt:'Como se soletra seu nome?',target:'How do you spell your name?',tokens:['How','do','you','spell','your','name?']},
   {t:'review',items:[{e:'🔤',en:'How do you spell your name?',pt:'Como se soletra seu nome?'},{e:'❓',en:"What's your name?",pt:'Qual é o seu nome?'},{e:'✨',en:'See you!',pt:'Até mais!'}]}
  ]},
  {title:MODULE_TWO_TITLES[6],steps:[
   {t:'choice',q:'Começando pelo que você já sabe: escolha a saudação correta.',ans:'Hello!',op:['Hello!','Goodbye!','Thank you.'],audio:'Hello!'},
   {t:'guided',q:"What's your name?",ans:'My name is Alex.',op:['My name is Alex.',"I'm from Brazil.",'See you!']},
   {t:'guided',q:'Where are you from?',ans:"I'm from Brazil.",op:["I'm from Brazil.",'Nice to meet you.','Good morning!']},
   {t:'guided',q:'Nice to meet you.',ans:'Nice to meet you too.',op:['Nice to meet you too.',"I'm fine.",'Goodbye!']},
   {t:'choice',q:'How are you?',ans:"I'm fine.",op:["I'm fine.",'My name is Alex.',"I'm from Brazil."],audio:'How are you?'},
   {t:'build',q:'Monte a frase:',pt:'Prazer em conhecer você.',target:'Nice to meet you.',tokens:['Nice','to','meet','you.']},
   {t:'choice',q:'Você está indo embora. O que diz?',ans:'See you!',op:['See you!','What’s your name?','Nice to meet you.']},
   {t:'review',items:[{e:'👋',en:'Hello!',pt:'Olá!'},{e:'🙂',en:'My name is Alex.',pt:'Meu nome é Alex.'},{e:'🇧🇷',en:"I'm from Brazil.",pt:'Eu sou do Brasil.'},{e:'👋',en:'See you!',pt:'Até mais!'}]}
  ]},
  {title:MODULE_TWO_TITLES[7],steps:[
   {t:'phrase',x:{e:'✨',en:'Hello! My name is Alex.',pt:'Olá! Meu nome é Alex. · Missão final do módulo.'}},
   {t:'guided',q:'Hello! How are you?',ans:"I'm good.",op:["I'm good.",'My name is Alex.','Goodbye!']},
   {t:'guided',q:"What's your name?",ans:'My name is Alex.',op:['My name is Alex.',"I'm from Brazil.",'Thank you.']},
   {t:'guided',q:'Where are you from?',ans:"I'm from Brazil.",op:["I'm from Brazil.",'My name is Brazil.','Goodbye!']},
   {t:'guided',q:'Nice to meet you.',ans:'Nice to meet you too.',op:['Nice to meet you too.','Goodbye!','How are you?']},
   {t:'guided',q:'How do you spell your name?',ans:'A-L-E-X.',op:['A-L-E-X.','Brazil.','See you!']},
   {t:'build',q:'Monte sua apresentação:',pt:'Olá! Meu nome é Alex.',target:'Hello! My name is Alex.',tokens:['Hello!','My','name','is','Alex.']},
   {t:'guided',q:'Goodbye!',ans:'See you!',op:['See you!','How are you?','Thank you.']},
   {t:'review',items:[{e:'👋',en:'Hello!',pt:'Olá!'},{e:'💬',en:'How are you?',pt:'Como você está?'},{e:'🙂',en:'My name is Alex.',pt:'Meu nome é Alex.'},{e:'🇧🇷',en:"I'm from Brazil.",pt:'Eu sou do Brasil.'},{e:'🤝',en:'Nice to meet you.',pt:'Prazer em conhecer você.'},{e:'👋',en:'See you!',pt:'Até mais!'}]}
  ]}
 ];
 return L[n]||L[0];
}

const BASE=[['☕','coffee','café'],['💧','water','água'],['🥛','milk','leite'],['🙏','please','por favor'],['👉','I want','eu quero']];

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const enc=s=>encodeURIComponent(String(s??'')).replace(/'/g,'%27');
const sh=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const state=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
function progress(m,n){
  try{return window.getStableLessonProgress?.('A1',m,n)??(done(m,n)?100:0)}catch{return done(m,n)?100:0}
}
function saveProgress(m,n,p){try{window.setStableLessonProgress?.('A1',m,n,p)}catch{}}

function item(m,n){const x=RAW[m]?.[n];if(!x)return null;const [e,en,pt,title]=x.split('|');return{e,en,pt,title}}
function known(m,n){const a=BASE.map(([e,en,pt])=>({e,en,pt}));for(let M=0;M<=m;M++)for(let N=0;N<8;N++){if(M===m&&N>n)break;const x=item(M,N);if(x)a.push(x)}const seen=new Set();return a.filter(x=>{const k=x.en.toLowerCase();if(seen.has(k))return false;seen.add(k);return true})}
const M2_DISTRACTORS=[
 [{en:'My phone number is...',pt:'Meu telefone é...'},{en:'My address is...',pt:'Meu endereço é...'}],
 [{en:'six, seven, eight, nine, ten',pt:'seis, sete, oito, nove, dez'},{en:'eleven, twelve, thirteen, fourteen, fifteen',pt:'onze, doze, treze, quatorze, quinze'}],
 [{en:'sixteen, seventeen, eighteen, nineteen, twenty',pt:'dezesseis, dezessete, dezoito, dezenove, vinte'},{en:'one, two, three, four, five',pt:'um, dois, três, quatro, cinco'}],
 [{en:'My address is...',pt:'Meu endereço é...'},{en:'I am ... years old.',pt:'Eu tenho ... anos.'}],
 [{en:'My phone number is...',pt:'Meu telefone é...'},{en:'My address is...',pt:'Meu endereço é...'}],
 [{en:'My phone number is...',pt:'Meu telefone é...'},{en:'I am ... years old.',pt:'Eu tenho ... anos.'}],
 [{en:'What is your phone number?',pt:'Qual é o seu telefone?'},{en:'How old are you?',pt:'Quantos anos você tem?'}],
 [{en:'My address is... and I am ... years old.',pt:'Meu endereço é... e eu tenho ... anos.'},{en:'My name is... and my address is...',pt:'Meu nome é... e meu endereço é...'}]
];
function options(cur,m,n){
 if(m===1){const extras=M2_DISTRACTORS[n]||[];return [cur,...extras.map(x=>({e:'',en:x.en,pt:x.pt}))]}
 const a=[cur,...known(m,n).reverse().filter(x=>x.en.toLowerCase()!==cur.en.toLowerCase())];return a.slice(0,3)
}
function teacher(){const m=state().teacher||'media';return m==='pesada'?['Hard 18+','Algenib']:m==='media'?['Doideira','Puck']:['Tranquilo','Achird']}
function style(){const m=state().teacher||'media';return m==='pesada'?'Voz brasileira humana, adulta, rouca, expressiva e irônica. Fale como pessoa real, nunca como robô.':m==='media'?'Voz brasileira humana, divertida, brincalhona e espontânea. Entonação de conversa real, nunca de locução.':'Voz brasileira humana, amigável, calma e natural. Ritmo de conversa real, sem cadência de robô.'}
function status(t=''){const e=$('#a15Voice');if(e)e.textContent=t}
function bytes(b){const x=atob(b),u=new Uint8Array(x.length);for(let i=0;i<x.length;i++)u[i]=x.charCodeAt(i);return u}
async function pcm(b,rate=24000){const u=bytes(b),a=new Float32Array(u.length/2),v=new DataView(u.buffer,u.byteOffset,u.byteLength);for(let i=0;i<a.length;i++)a[i]=Math.max(-1,Math.min(1,v.getInt16(i*2,true)/32768));ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')await ctx.resume();if(src)try{src.stop()}catch{}const bf=ctx.createBuffer(1,a.length,rate);bf.copyToChannel(a,0);src=ctx.createBufferSource();src.buffer=bf;src.connect(ctx.destination);await new Promise(r=>{src.onended=()=>{src=null;r()};src.start()})}
async function speak(text,lang='en-US',isTeacher=false){
 status('');
 if(autoSpeakTimer){clearTimeout(autoSpeakTimer);autoSpeakTimer=null}
 try{window.stopGeminiTTS?.()}catch{}
 try{window.speechSynthesis?.cancel?.()}catch{}
 const [,teacherVoice]=teacher();
 const voice=isTeacher?teacherVoice:'Achird';
 if(window.geminiSpeak){
  try{
   const ok=await window.geminiSpeak(text,lang,voice);
   if(ok)return true;
  }catch{}
 }
 try{
  const r=await fetch(TTS,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   text,lang,voice,
   style:isTeacher?style():'Natural American English for a complete beginner. Clear, warm, human pronunciation. Say it once at a comfortable pace.'
  })});
  const d=await r.json();
  if(!r.ok||!d.audio)throw new Error(d?.message||d?.error||('HTTP '+r.status));
  await pcm(d.audio,d.sample_rate||24000);
  return true
 }catch(e){
  status('⚠️ A voz Gemini não carregou. Toque em ouvir para tentar de novo.');
  return false
 }
}
function speakBuildToken(text){
 const word=String(text||'').trim();
 if(!word)return;
 wordSpeakChain=wordSpeakChain.catch(()=>{}).then(()=>speak(word,'en-US',false));
}
function quickReaction(ok){
 const mode=state().teacher||'media';
 const lines={
  leve:{ok:['Muito bem!','Isso mesmo!','Perfeito, acertou!','Ótimo, pode continuar.'],bad:['Quase. Tenta outra vez.','Ainda não. Olha com calma.','Por pouco. Vamos de novo.']},
  media:{ok:['Boa! Mandou bem 😄','Aí sim! Acertou.','Boa, essa entrou na cabeça!','Perfeito! Bora pra próxima.'],bad:['Ih, escapou 😂 tenta de novo.','Quase, meu amigo.','Por pouco! Olha a certa e tenta outra.']},
  pesada:{ok:['Aí, porra! Agora sim 😄','Boa! Acertou bonito.','Agora sim, cacete. Mandou bem!','Isso! Sem enrolar, acertou.'],bad:['Porra, quase 😂 tenta de novo.','Aí não, cacete 😂 olha a certa.','Quase. Presta atenção e manda outra.']}
 };
 const arr=(ok?lines[mode]?.ok:lines[mode]?.bad)||(ok?lines.media.ok:lines.media.bad);
 return arr[Math.floor(Math.random()*arr.length)];
}
function react(ok,heard,target){
 const txt=quickReaction(ok);
 const b=$('#a15Feedback');
 if(b){
   b.className='b14Feedback '+(ok?'good':'bad');
   b.innerHTML='<b>'+esc(txt)+'</b>';
 }
 /* Aulas fixas: uma única reação. O texto mostrado é exatamente o texto falado.
    Não chama IA extra para não sobrescrever a mensagem nem gastar tokens sem necessidade. */
 speak(txt,'pt-BR',true);
}

function numberLesson(){
 const oneToFive={e:'🔢',en:'one, two, three, four, five',pt:'um, dois, três, quatro, cinco'};
 const sixToTen={e:'🔟',en:'six, seven, eight, nine, ten',pt:'seis, sete, oito, nove, dez'};
 const haveTwo={e:'👥',en:'I have two brothers.',pt:'Eu tenho dois irmãos.'};
 const haveEight={e:'📚',en:'I have eight books.',pt:'Eu tenho oito livros.'};
 const mixed={e:'🙂',en:'My name is Ana. I have three books.',pt:'Meu nome é Ana. Eu tenho três livros.'};
 return {title:'Números de 1 a 10',steps:[
  {t:'phrase',x:oneToFive},
  {t:'phrase',x:sixToTen},
  {t:'choice',q:'Qual é "sete" em inglês?',ans:'seven',op:sh(['seven','four','ten'])},
  {t:'choice',q:'Qual número você ouviu?',ans:'eight',op:sh(['three','eight','six']),audio:'eight'},
  {t:'phrase',x:haveTwo},
  {t:'choice',q:'Como dizer "Eu tenho oito livros." em inglês?',ans:haveEight.en,op:sh([haveEight.en,'I have five books.','I have two brothers.']),audio:haveEight.en},
  {t:'build',q:'Monte em inglês:',pt:'Eu tenho três livros.',target:'I have three books.',tokens:sh(['I','have','three','books.'])},
  {t:'choice',q:'Misturando com a aula anterior, escolha a frase correta:',ans:mixed.en,op:sh([mixed.en,'My name is Ana. I have seven phone.','I am Ana. I have three name.'])},
  {t:'guided',q:'Escolha a frase que fala de quantidade:',ans:'I have five friends.',op:sh(['My name is Ana.','I have five friends.','Thank you.'])},
  {t:'review',items:[oneToFive,sixToTen,haveTwo,haveEight,mixed]}
 ]};
}


/* A1 · Módulo 3: Família e pessoas.
   Segue a progressão do currículo mestre sem modificar os módulos anteriores. */
const FAMILY_LESSON_TITLES=[
 'Minha família: mother e father',
 'Irmãos e irmãs: brother e sister',
 'This is my...: apresentando pessoas',
 'Amigos e pessoas importantes',
 'Who is this?: perguntando sobre pessoas',
 'My family: construindo frases',
 'Revisão: família e apresentações',
 'Missão final: apresente sua família'
];
function familyLesson(n){
 const p=(e,en,pt)=>({t:'phrase',x:{e,en,pt}});
 const c=(q,ans,alternatives,audio)=>({t:'choice',q,ans,op:sh([ans,...alternatives]),...(audio?{audio}:{})});
 const g=(q,ans,alternatives)=>({t:'guided',q,ans,op:sh([ans,...alternatives])});
 const b=(pt,target)=>({t:'build',q:'Monte a frase em inglês:',pt,target,tokens:sh(target.split(/\s+/))});
 const rev=(...items)=>({t:'review',items:items.map(([e,en,pt])=>({e,en,pt}))});
 const L=[
  {title:FAMILY_LESSON_TITLES[0],steps:[
   g('Revisão: Hello! My name is Anna. Como responder?', 'Hello! My name is Alex.', ['Goodbye!','I am fine, thank you.']),
   p('👨‍👩‍👧','This is my family.','Esta é minha família.'),
   p('👩','This is my mother.','Esta é minha mãe.'),
   p('👨','This is my father.','Este é meu pai.'),
   c('O que significa “mother”?','mãe',['pai','irmã'],'mother'),
   c('O que você ouviu?','father',['mother','family'],'father'),
   b('Esta é minha mãe.','This is my mother.'),
   rev(['👨‍👩‍👧','This is my family.','Esta é minha família.'],['👩','mother','mãe'],['👨','father','pai'])
  ]},
  {title:FAMILY_LESSON_TITLES[1],steps:[
   c('Revisando: qual palavra significa “pai”?','father',['mother','brother'],'father'),
   p('👦','This is my brother.','Este é meu irmão.'),
   p('👧','This is my sister.','Esta é minha irmã.'),
   c('Qual palavra significa “irmã”?','sister',['brother','mother'],'sister'),
   c('Qual frase você ouviu?','This is my brother.',['This is my sister.','This is my father.'],'This is my brother.'),
   b('Esta é minha irmã.','This is my sister.'),
   g('This is my brother. Qual frase fala da sua irmã?','This is my sister.',['This is my mother.','This is my father.']),
   rev(['👦','brother','irmão'],['👧','sister','irmã'],['👩','mother','mãe'])
  ]},
  {title:FAMILY_LESSON_TITLES[2],steps:[
   c('Revisão: “This is my sister.” significa:','Esta é minha irmã.',['Este é meu irmão.','Esta é minha mãe.'],'This is my sister.'),
   p('👉','This is my...','Este é meu... / Esta é minha...'),
   p('👨','This is my father.','Este é meu pai.'),
   p('👧','This is my sister.','Esta é minha irmã.'),
   c('Qual expressão usamos para apresentar uma pessoa?','This is my...',['Where are you from?','How old are you?'],'This is my father.'),
   b('Este é meu pai.','This is my father.'),
   g('Hello, Anna! This is my sister. Como apresentar sua mãe?','This is my mother.',['This is my brother.','This is my father.']),
   rev(['👉','This is my...','Este é meu / Esta é minha'],['👨','father','pai'],['👧','sister','irmã'])
  ]},
  {title:FAMILY_LESSON_TITLES[3],steps:[
   g('This is my father. Como apresentar sua irmã?','This is my sister.',['This is my mother.','This is my brother.']),
   p('🧑‍🤝‍🧑','This is my friend.','Este é meu amigo / Esta é minha amiga.'),
   p('🙂','My friend is Alex.','Meu amigo se chama Alex.'),
   c('O que significa “friend”?','amigo ou amiga',['irmão ou irmã','pai ou mãe'],'friend'),
   c('Qual frase você ouviu?','This is my friend.',['This is my father.','This is my brother.'],'This is my friend.'),
   b('Este é meu amigo.','This is my friend.'),
   c('Qual frase apresenta uma pessoa pelo nome?','My friend is Alex.',['My father is a friend.','My sister is a father.']),
   rev(['🧑‍🤝‍🧑','friend','amigo / amiga'],['🙂','My friend is Alex.','Meu amigo se chama Alex.'],['👨','father','pai'])
  ]},
  {title:FAMILY_LESSON_TITLES[4],steps:[
   c('Revisão: “This is my friend.” significa:','Este é meu amigo.',['Este é meu pai.','Este é meu irmão.'],'This is my friend.'),
   p('❓','Who is this?','Quem é esta pessoa?'),
   p('👩','This is my mother.','Esta é minha mãe.'),
   c('Qual pergunta você ouviu?','Who is this?',['What is your name?','Where are you from?'],'Who is this?'),
   g('Who is this? 👧 (sister)','This is my sister.',['This is my mother.','This is my father.']),
   b('Quem é esta pessoa?','Who is this?'),
   g('Who is this? 👨 (father)','This is my father.',['This is my brother.','This is my friend.']),
   rev(['❓','Who is this?','Quem é esta pessoa?'],['👧','This is my sister.','Esta é minha irmã.'],['👨','This is my father.','Este é meu pai.'])
  ]},
  {title:FAMILY_LESSON_TITLES[5],steps:[
   g('Who is this? 👩 (mother)','This is my mother.',['This is my sister.','This is my friend.']),
   p('👨‍👩‍👧','My family is important to me.','Minha família é importante para mim.'),
   p('👦','I have a brother.','Eu tenho um irmão.'),
   c('“I have a brother.” significa:','Eu tenho um irmão.',['Eu tenho uma irmã.','Este é meu irmão.'],'I have a brother.'),
   b('Eu tenho um irmão.','I have a brother.'),
   c('Como dizer “Esta é minha família” em inglês?','This is my family.',['This is my friend.','This is my sister.']),
   g('Who is this? 👦 (brother)','This is my brother.',['This is my father.','This is my friend.']),
   rev(['👦','I have a brother.','Eu tenho um irmão.'],['👨‍👩‍👧','This is my family.','Esta é minha família.'],['❓','Who is this?','Quem é esta pessoa?'])
  ]},
  {title:FAMILY_LESSON_TITLES[6],steps:[
   c('Qual cumprimento usamos ao conhecer alguém?','Nice to meet you.',['Goodbye.','See you later.'],'Nice to meet you.'),
   c('O que você ouviu?','This is my sister.',['This is my brother.','This is my mother.'],'This is my sister.'),
   c('Qual palavra significa “amigo”?','friend',['father','brother'],'friend'),
   b('Esta é minha família.','This is my family.'),
   g('Who is this? 👨 (father)','This is my father.',['This is my friend.','This is my brother.']),
   c('De volta ao Módulo 2: qual pergunta pede o nome?',"What's your name?",['Who is this?','How are you?'],"What's your name?"),
   b('Eu tenho um irmão.','I have a brother.'),
   rev(['🤝','Nice to meet you.','Prazer em conhecer você.'],['👨‍👩‍👧','This is my family.','Esta é minha família.'],['👦','I have a brother.','Eu tenho um irmão.'])
  ]},
  {title:FAMILY_LESSON_TITLES[7],steps:[
   p('✨','Hello! This is my family.','Missão: apresente pessoas da sua família em inglês.'),
   g('Hello! What is your name?','My name is Alex.',['I am from Brazil.','This is my father.']),
   g('Who is this? 👩 (mother)','This is my mother.',['This is my sister.','This is my friend.']),
   g('Who is this? 👦 (brother)','This is my brother.',['This is my father.','This is my friend.']),
   b('Este é meu amigo.','This is my friend.'),
   c('Qual sequência forma uma apresentação coerente?','Hello! → This is my mother. → Nice to meet you.',['Goodbye! → Who is this? → Hello!','Nice to meet you. → Goodbye! → Who is this?']),
   b('Esta é minha família.','This is my family.'),
   rev(['👨‍👩‍👧','This is my family.','Esta é minha família.'],['👩','This is my mother.','Esta é minha mãe.'],['👦','This is my brother.','Este é meu irmão.'],['🧑‍🤝‍🧑','This is my friend.','Este é meu amigo.'])
  ]}
 ];
 return L[n]||L[0];
}

function dailyRoutineLesson(n){
 const titles=[
  'Minha manhã: I wake up','Café da manhã e horários','Eu trabalho e estudo','Almoço e tarde','Voltando para casa','Minha noite: I go to bed','Revisão: meu dia em inglês','Missão final: minha rotina'
 ];
 const ph=(e,en,pt)=>({t:'phrase',x:{e,en,pt}});
 const ch=(q,ans,other,audio)=>({t:'choice',q,ans,op:sh([ans,...other]),...(audio?{audio}:{})});
 const gd=(q,ans,other)=>({t:'guided',q,ans,op:sh([ans,...other])});
 const bu=(pt,target)=>({t:'build',q:'Monte a frase em inglês:',pt,target,tokens:sh(target.split(/\s+/))});
 const re=(...items)=>({t:'review',items:items.map(([e,en,pt])=>({e,en,pt}))});
 const L=[
  {title:titles[0],steps:[
   gd('Hello! How are you?', "I'm fine, thank you.",['My name is Anna.','This is my brother.']),
   ph('🌅','I wake up in the morning.','Eu acordo de manhã.'),
   ph('⏰','I wake up at seven.','Eu acordo às sete.'),
   ch('O que significa “I wake up”?','Eu acordo.',['Eu durmo.','Eu trabalho.'],'I wake up'),
   ch('Qual frase você ouviu?','I wake up at seven.',['I go to bed at seven.','I work at seven.'],'I wake up at seven.'),
   bu('Eu acordo às sete.','I wake up at seven.'),
   gd('What time do you wake up? (às sete)','I wake up at seven.',['I go to bed at seven.','I eat lunch at seven.']),
   re(['🌅','morning','manhã'],['⏰','I wake up at seven.','Eu acordo às sete.'],['👋','Good morning!','Bom dia!'])
  ]},
  {title:titles[1],steps:[
   ch('Revisão: “I wake up at seven.” significa:','Eu acordo às sete.',['Eu durmo às sete.','Eu almoço às sete.'],'I wake up at seven.'),
   ph('☕','I have breakfast at eight.','Eu tomo café da manhã às oito.'),
   ph('🥛','I drink milk in the morning.','Eu bebo leite de manhã.'),
   ch('O que significa “breakfast”?','café da manhã',['almoço','jantar'],'breakfast'),
   ch('Qual frase você ouviu?','I have breakfast at eight.',['I have dinner at eight.','I wake up at eight.'],'I have breakfast at eight.'),
   bu('Eu tomo café da manhã às oito.','I have breakfast at eight.'),
   gd('What do you have in the morning? (leite)','I drink milk.',['I drink dinner.','I sleep milk.']),
   re(['☕','breakfast','café da manhã'],['🥛','I drink milk.','Eu bebo leite.'],['⏰','at eight','às oito'])
  ]},
  {title:titles[2],steps:[
   ch('Lembrando a manhã: qual frase fala do café da manhã?','I have breakfast at eight.',['I go to bed at eight.','I get home at eight.'],'I have breakfast at eight.'),
   ph('💼','I work in the morning.','Eu trabalho de manhã.'),
   ph('📚','I study English every day.','Eu estudo inglês todos os dias.'),
   ch('“I study English” significa:','Eu estudo inglês.',['Eu trabalho em inglês.','Eu durmo cedo.'],'I study English'),
   ch('Qual frase você ouviu?','I work in the morning.',['I study in the morning.','I sleep in the morning.'],'I work in the morning.'),
   bu('Eu estudo inglês todos os dias.','I study English every day.'),
   gd('What do you study? (inglês)','I study English.',['I work English.','I sleep English.']),
   re(['💼','I work.','Eu trabalho.'],['📚','I study English.','Eu estudo inglês.'],['🌅','in the morning','de manhã'])
  ]},
  {title:titles[3],steps:[
   gd('What do you study? (inglês)','I study English.',['I work at home.','I have breakfast.']),
   ph('🍽️','I have lunch at noon.','Eu almoço ao meio-dia.'),
   ph('☀️','I work in the afternoon.','Eu trabalho à tarde.'),
   ch('O que significa “lunch”?','almoço',['café da manhã','jantar'],'lunch'),
   ch('Qual frase você ouviu?','I work in the afternoon.',['I work in the morning.','I sleep in the afternoon.'],'I work in the afternoon.'),
   bu('Eu almoço ao meio-dia.','I have lunch at noon.'),
   gd('What do you do at noon? (almoço)','I have lunch at noon.',['I go to bed at noon.','I wake up at noon.']),
   re(['🍽️','I have lunch.','Eu almoço.'],['☀️','afternoon','tarde'],['📚','I study English.','Eu estudo inglês.'])
  ]},
  {title:titles[4],steps:[
   ch('Revisão: “I have lunch at noon.” significa:','Eu almoço ao meio-dia.',['Eu tomo café às oito.','Eu janto às nove.'],'I have lunch at noon.'),
   ph('🏠','I get home at six.','Eu chego em casa às seis.'),
   ph('🚶','I go home after work.','Eu vou para casa depois do trabalho.'),
   ch('O que significa “after work”?','depois do trabalho',['antes da escola','durante o almoço'],'after work'),
   ch('Qual frase você ouviu?','I get home at six.',['I wake up at six.','I go to bed at six.'],'I get home at six.'),
   bu('Eu chego em casa às seis.','I get home at six.'),
   gd('What do you do after work? (vou para casa)','I go home.',['I have breakfast.','I wake up.']),
   re(['🏠','I get home.','Eu chego em casa.'],['💼','after work','depois do trabalho'],['🍽️','I have lunch.','Eu almoço.'])
  ]},
  {title:titles[5],steps:[
   gd('What do you do after work? (vou para casa)','I go home.',['I wake up.','I have breakfast.']),
   ph('🌙','I have dinner at seven.','Eu janto às sete.'),
   ph('😴','I go to bed at ten.','Eu vou dormir às dez.'),
   ch('O que significa “I go to bed”?','Eu vou dormir.',['Eu acordo.','Eu trabalho.'],'I go to bed'),
   ch('Qual frase você ouviu?','I have dinner at seven.',['I have lunch at seven.','I have breakfast at seven.'],'I have dinner at seven.'),
   bu('Eu vou dormir às dez.','I go to bed at ten.'),
   gd('What time do you go to bed? (às dez)','I go to bed at ten.',['I wake up at ten.','I have lunch at ten.']),
   re(['🌙','dinner','jantar'],['😴','I go to bed.','Eu vou dormir.'],['🏠','I get home.','Eu chego em casa.'])
  ]},
  {title:titles[6],steps:[
   ch('Qual frase significa “Eu acordo às sete”?','I wake up at seven.',['I go to bed at seven.','I have dinner at seven.'],'I wake up at seven.'),
   ch('Qual palavra significa “almoço”?','lunch',['breakfast','dinner'],'lunch'),
   ch('Qual frase você ouviu?','I get home at six.',['I wake up at six.','I go to bed at six.'],'I get home at six.'),
   bu('Eu trabalho de manhã.','I work in the morning.'),
   gd('Who is this? 👩 (mother)','This is my mother.',['This is my father.','This is my sister.']),
   ch('Qual expressão é usada para despedida?','Goodbye!',['Good morning!','How are you?'],'Goodbye!'),
   bu('Eu vou dormir às dez.','I go to bed at ten.'),
   re(['🌅','I wake up.','Eu acordo.'],['🍽️','I have lunch.','Eu almoço.'],['😴','I go to bed.','Eu vou dormir.'])
  ]},
  {title:titles[7],steps:[
   ph('✨','This is my daily routine.','Esta é minha rotina diária.'),
   gd('Good morning! How are you?', "I'm fine, thank you.",['I go to bed at ten.','This is my brother.']),
   gd('What time do you wake up? (às sete)','I wake up at seven.',['I get home at seven.','I go to bed at seven.']),
   gd('What do you do in the morning? (trabalho)','I work in the morning.',['I have dinner at seven.','I go to bed at ten.']),
   bu('Eu almoço ao meio-dia.','I have lunch at noon.'),
   gd('What time do you get home? (às seis)','I get home at six.',['I wake up at six.','I go to bed at six.']),
   bu('Eu vou dormir às dez.','I go to bed at ten.'),
   re(['🌅','I wake up at seven.','Eu acordo às sete.'],['🍽️','I have lunch at noon.','Eu almoço ao meio-dia.'],['🏠','I get home at six.','Eu chego em casa às seis.'],['😴','I go to bed at ten.','Eu vou dormir às dez.'])
  ]}
 ];
 return L[n]||L[0];
}

const HABITS_TITLES=["I like: falando do que gosto","Do you like...?: fazendo perguntas","Yes, I do / No, I don’t","Do you want...?: fazendo pedidos","Where e What: perguntas úteis","Hábitos: What do you do?","Revisão: gostos e hábitos","Missão final: uma conversa sobre mim"];
const HABITS_CONTENT=[[["g","Good morning! How are you?","I'm fine, thank you.",["My name is Alex.","This is my father."]],["p","❤️","I like music.","Eu gosto de música."],["p","☕","I like coffee.","Eu gosto de café."],["c","O que significa “I like”?","Eu gosto de",["Eu preciso de","Eu não gosto de"],"I like"],["c","Qual frase você ouviu?","I like music.",["I like movies.","I like coffee."],"I like music."],["b","Eu gosto de café.","I like coffee."],["g","What do you like? (música)","I like music.",["I like sleep.","I am music."]],["r",[["❤️","I like","eu gosto de"],["☕","coffee","café"],["🎵","music","música"]]]],[["c","Lembrando: “I like coffee.” significa:","Eu gosto de café.",["Eu quero café.","Eu faço café."],"I like coffee."],["p","❓","Do you like music?","Você gosta de música?"],["p","🎬","Do you like movies?","Você gosta de filmes?"],["c","O que significa “Do you like...?”","Você gosta de...?",["Você tem...?","Você está...?"],"Do you like"],["c","Qual pergunta você ouviu?","Do you like music?",["Do you like movies?","Do you want music?"],"Do you like music?"],["b","Você gosta de música?","Do you like music?"],["g","Do you like movies? (sim)","Yes, I do.",["No, I am.","Yes, I like."]],["r",[["❓","Do you like...?","Você gosta de...?"],["🎵","music","música"],["🎬","movies","filmes"]]]],[["c","Revisão: qual frase é uma pergunta sobre gostos?","Do you like music?",["I like music.","This is my music."],"Do you like music?"],["p","✅","Yes, I do.","Sim, eu gosto."],["p","🙅","No, I don’t.","Não, eu não gosto."],["c","Como responder afirmativamente a “Do you like music?”","Yes, I do.",["Yes, I am.","Yes, I can."],"Yes, I do."],["c","Qual resposta você ouviu?","No, I don’t.",["Yes, I do.","No, I am not."],"No, I don’t."],["b","Não, eu não gosto.","No, I don’t."],["g","Do you like coffee? (não)","No, I don’t.",["Yes, I do.","No, I like coffee."]],["r",[["✅","Yes, I do.","Sim, eu gosto."],["🙅","No, I don’t.","Não, eu não gosto."],["❓","Do you like...?","Você gosta de...?"]]]],[["g","Do you like coffee? (sim)","Yes, I do.",["No, I don’t.","Yes, I am."]],["p","🥛","Do you want water?","Você quer água?"],["p","☕","I want coffee, please.","Eu quero café, por favor."],["c","O que significa “Do you want...?”","Você quer...?",["Você gosta de...?","Você conhece...?"],"Do you want"],["c","Qual frase você ouviu?","I want coffee, please.",["I like coffee, please.","I want water, please."],"I want coffee, please."],["b","Você quer água?","Do you want water?"],["g","Do you want coffee? (sim)","Yes, please.",["No, I am.","I am coffee."]],["r",[["🥛","Do you want water?","Você quer água?"],["☕","I want coffee, please.","Quero café, por favor."],["🙏","please","por favor"]]]],[["c","Lembrando: qual pergunta significa “Você quer água?”","Do you want water?",["Do you like water?","Where is the water?"],"Do you want water?"],["p","📍","Where is the market?","Onde fica o mercado?"],["p","❔","What is this?","O que é isto?"],["c","Qual palavra pergunta por um lugar?","Where",["What","Who"],"Where"],["c","Qual pergunta você ouviu?","What is this?",["Where is this?","Who is this?"],"What is this?"],["b","Onde fica o mercado?","Where is the market?"],["g","What is this? ☕ (coffee)","It is coffee.",["It is a market.","It is my brother."]],["r",[["📍","Where","onde"],["❔","What","o quê / qual"],["🛒","market","mercado"]]]],[["g","Where is the market? (pergunta sobre local)","Where",["What","When"]],["p","💼","What do you do in the morning?","O que você faz de manhã?"],["p","📚","I study English every day.","Eu estudo inglês todos os dias."],["c","Qual frase fala de um hábito diário?","I study English every day.",["I studied English yesterday.","I will study tomorrow."],"I study English every day."],["c","Qual pergunta você ouviu?","What do you do in the morning?",["Where do you work?","Do you like music?"],"What do you do in the morning?"],["b","Eu estudo inglês todos os dias.","I study English every day."],["g","What do you do in the morning? (trabalho)","I work in the morning.",["I go to bed at ten.","I have dinner at seven."]],["r",[["💼","I work in the morning.","Eu trabalho de manhã."],["📚","I study English.","Eu estudo inglês."],["📅","every day","todos os dias"]]]],[["c","Como perguntar se alguém gosta de música?","Do you like music?",["Do you want music?","Where is music?"],"Do you like music?"],["c","Qual resposta negativa combina com “Do you like coffee?”","No, I don’t.",["No, I am not.","No, you are."],"No, I don’t."],["c","Qual pergunta você ouviu?","Where is the market?",["What is the market?","Who is the market?"],"Where is the market?"],["b","Eu gosto de música.","I like music."],["g","Revisão da família: Who is this? 👩","This is my mother.",["This is my father.","This is my brother."]],["c","Qual pergunta é sobre hábitos?","What do you do in the morning?",["Who is your sister?","Where is my coffee?"],"What do you do in the morning?"],["b","Você gosta de filmes?","Do you like movies?"],["r",[["❤️","I like music.","Eu gosto de música."],["❓","Do you like movies?","Você gosta de filmes?"],["📍","Where is the market?","Onde fica o mercado?"]]]],[["p","✨","Let’s talk about you!","Vamos conversar sobre você!"],["g","Hello! What’s your name?","My name is Alex.",["I like coffee.","I work in the morning."]],["g","Do you like music? (sim)","Yes, I do.",["No, I don’t.","Yes, I am."]],["g","What do you like? (café)","I like coffee.",["I want music.","I go home."]],["b","Você gosta de filmes?","Do you like movies?"],["g","What do you do in the morning? (trabalho)","I work in the morning.",["I have dinner at seven.","I go to bed at ten."]],["b","Eu estudo inglês todos os dias.","I study English every day."],["r",[["❓","Do you like...?","Você gosta de...?"],["✅","Yes, I do.","Sim, eu gosto."],["❤️","I like coffee.","Eu gosto de café."],["📚","I study English.","Eu estudo inglês."]]]]];
function questionsHabitsLesson(n){
 const lines=HABITS_CONTENT[n]||HABITS_CONTENT[0];
 const steps=lines.map(s=>{if(s[0]==='p')return {t:'phrase',x:{e:s[1],en:s[2],pt:s[3]}};
 if(s[0]==='c')return {t:'choice',q:s[1],ans:s[2],op:sh([s[2],...s[3]]),audio:s[4]};
 if(s[0]==='g')return {t:'guided',q:s[1],ans:s[2],op:sh([s[2],...s[3]])};
 if(s[0]==='b')return {t:'build',q:'Monte a frase em inglês:',pt:s[1],target:s[2],tokens:sh(s[2].split(/\s+/))};
 return {t:'review',items:s[1].map(x=>({e:x[0],en:x[1],pt:x[2]}))};
 });
 return {title:HABITS_TITLES[n]||HABITS_TITLES[0],steps};
}

function lesson(m,n){if(m===0)return firstContactLesson(n);if(m===1)return secondContactLesson(n);if(m===2)return familyLesson(n);if(m===3)return dailyRoutineLesson(n);if(m===4)return questionsHabitsLesson(n);const cur=item(m,n),k=known(m,n),op=options(cur,m,n),prev=k.filter(x=>x.en.toLowerCase()!==cur.en.toLowerCase()).slice(-1)[0]||{e:'☕',en:'coffee',pt:'café'};const words=cur.en.trim().split(/\s+/),review=(m===1?[cur,...(M2_DISTRACTORS[n]||[]).map(x=>({e:'🔁',en:x.en,pt:x.pt}))]:[cur,prev,...k.slice(-4).reverse()]).filter((x,i,a)=>a.findIndex(y=>y.en.toLowerCase()===x.en.toLowerCase())===i).slice(0,3);const steps=[
 {t:words.length>1?'phrase':'learn',x:cur},
 {t:'choice',q:`${cur.en} significa:`,ans:cur.pt,op:sh(op.map(x=>x.pt)),audio:cur.en},
 {t:'choice',q:'Qual você ouviu?',ans:cur.en,op:sh(op.map(x=>x.en)),audio:cur.en},
 {t:'choice',q:`Qual é "${cur.pt}" em inglês?`,ans:cur.en,op:sh(op.map(x=>x.en))},
 m===1?{t:'choice',q:'Vamos fixar esta mesma ideia:',ans:cur.en,op:sh(op.map(x=>x.en)),audio:cur.en}:{t:prev.en.split(/\s+/).length>1?'phrase':'learn',x:prev},
 {t:'choice',q:'Ouça de novo e escolha:',ans:cur.en,op:sh(op.map(x=>x.en)),audio:cur.en},
 words.length>1&&words.length<=5?{t:'build',q:'Monte em inglês:',pt:cur.pt,target:cur.en,tokens:sh(words)}:{t:'choice',q:`Só para fixar: ${cur.en}`,ans:cur.pt,op:sh(op.map(x=>x.pt)),audio:cur.en},
 {t:'choice',q:`Lembra de "${cur.pt}"?`,ans:cur.en,op:sh(op.map(x=>x.en))},
 {t:'guided',q:'Escolha o inglês que você acabou de aprender:',ans:cur.en,op:sh(op.map(x=>x.en))},
 {t:'review',items:review}
];return{title:cur.title,steps}}

function top(){const [label]=teacher();return `<div class="b14Teacher"><button onclick="a15Menu()">Professor: ${label} ▾</button></div>${menu?`<div class="b14TeacherMenu"><button onclick="a15Teacher('leve')">🙂 Tranquilo</button><button onclick="a15Teacher('media')">🤪 Doideira</button><button onclick="a15Teacher('pesada')">🔥 Hard 18+</button></div>`:''}`}
window.a15Menu=()=>{menu=!menu;render()};
window.a15Teacher=m=>{window.setStableTeacher?.(m);menu=false;render()};
function shell(inner){
 const p=Math.round((run.i+1)/run.lesson.steps.length*100);
 if(run.m===0){
   document.querySelector('#course')?.classList.add('first-contacts-lesson-active');
   const screenTitle=document.querySelector('#course > .top h2');
   if(screenTitle)screenTitle.textContent='Tela inicial';
 }
 return `<div class="beginner14 ${run.m===0?'firstContactsLessonScreen':''} ${run.m===1?'moduleTwoLessonScreen':run.m===2?'familyLessonScreen':run.m===3?'routineLessonScreen':run.m===4?'habitsLessonScreen':''}"><div class="b14Top"><button class="b14Back" onclick="openStableModule('A1',${run.m})">‹</button><div class="b14Progress"><span style="width:${p}%"></span></div></div>${run.m===0?'':top()}<div class="b14Card"><div class="b14Eyebrow">${run.m<=1?'PRÉ-A1':'A1'} · ${run.i+1} de ${run.lesson.steps.length}</div>${inner}<div id="a15Voice" class="b14VoiceWarn"></div></div><div class="lessonStepNav" aria-label="Navegação entre etapas"><button type="button" onclick="a15Jump(-1)" aria-label="Voltar uma etapa" ${run.i<=0?'disabled':''}>‹</button><button type="button" onclick="a15Jump(1)" aria-label="Avançar uma etapa" ${run.i>=run.lesson.steps.length-1?'disabled':''}>›</button></div></div>`;
}
const prevButton=()=>'';
const next=()=>`<div class="b14Footer"><button class="b14Next" onclick="a15Next()">Continuar</button>${prevButton()}</div>`;
window.a15Next=()=>{if(++run.i>=run.lesson.steps.length)return finish();saveProgress(run.m,run.n,Math.round(run.i/run.lesson.steps.length*100));run.built=[];run.checked=false;run.used=[];render()};
window.a15Prev=()=>{if(!run||run.i<=0)return;window.a15Jump(-1)};
window.a15Jump=delta=>{if(!run)return;const d=Number(delta)||0,ni=Math.max(0,Math.min(run.lesson.steps.length-1,run.i+d));if(ni===run.i)return;run.i=ni;if(d>0)saveProgress(run.m,run.n,Math.round(run.i/run.lesson.steps.length*100));run.built=[];run.checked=false;run.ok=false;run.used=[];render(false)};
function looksPortugueseText(text){
 const t=String(text||'').toLowerCase();
 if(/[áàâãéêíóôõúç]/.test(t))return true;
 return /\b(ola|olá|obrigado|obrigada|estou|meu|minha|voce|você|como|onde|ate|até|sim|nao|não|prazer|bom dia|boa tarde|boa noite|tchau|casa|carro|cafe|café|comida|transporte|agradecimento)\b/.test(t);
}
function cleanOptionAudio(text){
 return String(text||'')
   .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,' ')
   .replace(/^[\s→•·-]+|[\s→•·-]+$/g,'')
   .replace(/\s+/g,' ')
   .trim();
}
function optionShouldSpeak(step,value){
 if(step?.t==='guided')return true;
 if(step?.t!=='choice')return false;
 return !looksPortugueseText(step?.ans||'') && !looksPortugueseText(value);
}
async function speakChosenOption(step,value){
 if(!optionShouldSpeak(step,value))return;
 const txt=cleanOptionAudio(value);
 if(txt)await speak(txt,'en-US',false);
}

function guidedAudioText(q){
 const text=String(q||'').trim();
 if(!text)return'';
 if(/^Escolha\b/i.test(text))return'';
 const quoted=[...text.matchAll(/[“\"]([^”\"]+)[”\"]/g)].map(m=>m[1]).filter(Boolean);
 if(quoted.length)return quoted[0];
 return text
   .replace(/\s+E você\?$/i,'')
   .replace(/\s+e você\?$/i,'')
   .trim();
}
window.a15Speak=e=>speak(decodeURIComponent(e));
function render(preserveScroll=false){const keepY=preserveScroll?window.scrollY:null;const s=run.lesson.steps[run.i];let h='';if(s.t==='learn'||s.t==='phrase'){h=`<div class="b14Emoji">${s.x.e||'💬'}</div><div class="b14Word">${esc(s.x.en)}</div><div class="b14Translation">${esc(s.x.pt)}</div><button class="b14Listen" onclick="a15Speak('${enc(s.x.en)}')">🔊 Ouvir</button>${next()}`}
else if(s.t==='choice'){h=`<h2>${esc(s.q)}</h2>${s.audio?`<button class="b14Listen" onclick="a15Speak('${enc(s.audio)}')">🔊 Ouvir</button>`:''}<div class="b14Choices">${s.op.map(o=>`<button class="b14Choice" data-a15="${enc(o)}" onclick="a15Answer('${enc(o)}')">${esc(o)}</button>`).join('')}</div><div id="a15Feedback"></div>`}
else if(s.t==='guided'){const ga=guidedAudioText(s.q);h=`<h2>${esc(s.q)}</h2>${ga?`<button class="b14Listen" onclick="a15Speak('${enc(ga)}')">🔊 Ouvir</button>`:''}<div class="b14Conversation">${s.op.map(o=>`<button data-a15="${enc(o)}" onclick="a15Answer('${enc(o)}')">${esc(o)}</button>`).join('')}</div><div id="a15Feedback"></div>`}
else if(s.t==='build'){const exp=s.target.split(/\s+/),ans=run.built.map((x,i)=>`<span class="b14Token ${run.checked?(x===exp[i]?'correct':'wrong'):''}">${esc(x)}</span>`).join('');h=`<h2>${esc(s.q)}</h2><div class="b14Translation" style="font-size:28px;color:#fff;font-weight:850">${esc(s.pt)}</div><div class="b14Answer">${ans||'<span style="color:#8198aa">Toque nas palavras</span>'}</div><div class="b14Bank">${s.tokens.map((x,i)=>`<button onclick="a15Pick(${i})" ${run.used?.includes(i)?'disabled class="used"':''}>${esc(x)}</button>`).join('')}</div><div class="b14Actions"><button class="b14Clear" onclick="a15Clear()">Limpar</button><button class="b14Check" onclick="a15Check()">Verificar</button></div>${run.checked&&!run.ok?`<div class="b14CorrectOrder">Correto: ${esc(s.target)}</div>`:''}<div id="a15Feedback"></div>${run.checked&&run.ok?next():run.checked&&!run.ok?`<div class="b14Footer"><button class="b14Next blue" onclick="a15Clear()">Tentar de novo</button>${prevButton()}</div>`:''}`}
else{h=`<h2>Você já conhece isso</h2><div class="b14Review">${s.items.map(x=>`<button class="b14Mini" onclick="a15Speak('${enc(x.en)}')"><span>${x.e||'🔁'}</span><b>${esc(x.en)}</b><small>${esc(x.pt)}</small></button>`).join('')}</div><div class="b14Footer"><button class="b14Next" onclick="a15Finish()">Concluir aula · +30 XP</button></div>`}
$('#courseBody').innerHTML=shell(h);if(keepY===null)window.scrollTo(0,0);else requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,keepY)));if(autoSpeakTimer){clearTimeout(autoSpeakTimer);autoSpeakTimer=null}if((s.t==='learn'||s.t==='phrase')&&s.x)autoSpeakTimer=setTimeout(()=>{autoSpeakTimer=null;speak(s.x.en)},250);if(s.t==='choice'&&s.audio)autoSpeakTimer=setTimeout(()=>{autoSpeakTimer=null;speak(s.audio)},250);if(s.t==='guided'){const ga=guidedAudioText(s.q);if(ga)autoSpeakTimer=setTimeout(()=>{autoSpeakTimer=null;speak(ga)},250)}}
window.a15Answer=async e=>{
 const s=run.lesson.steps[run.i],v=decodeURIComponent(e),ok=v===s.ans;
 document.querySelectorAll('[data-a15]').forEach(b=>{
   const x=decodeURIComponent(b.dataset.a15);
   if(x===v)b.classList.add(ok?'correct':'wrong');
   if(!ok&&x===s.ans)b.classList.add('correct');
   b.disabled=true;
 });
 const f=$('#a15Feedback');
 if(f)f.insertAdjacentHTML('afterend',ok?next():`<div class="b14Footer"><button class="b14Next blue" onclick="a15Retry()">Tentar de novo</button>${prevButton()}</div>`);
 await speakChosenOption(s,v);
 react(ok,v,s.ans);
};
window.a15Retry=()=>render(true);
window.a15Pick=i=>{if(run.checked)return;run.used=run.used||[];if(run.used.includes(i))return;const token=run.lesson.steps[run.i].tokens[i];run.used.push(i);run.built.push(token);render(true);speakBuildToken(token)};
window.a15Clear=()=>{run.built=[];run.used=[];run.checked=false;run.ok=false;render(true)};
window.a15Check=async()=>{
 const s=run.lesson.steps[run.i],v=run.built.join(' ');
 run.checked=true;
 run.ok=v===s.target;
 render(true);
 if(run.ok){
   const txt=quickReaction(true);
   const b=$('#a15Feedback');
   if(b){
     b.className='b14Feedback good';
     b.innerHTML='<b>'+esc(txt)+'</b><br><span>🔊 '+esc(s.target)+'</span>';
   }
   await speak(s.target,'en-US',false);
 }else{
   react(false,v,s.target);
 }
};

function start(m,n){if(m===1&&!unlocked(m,n))return;const l=lesson(m,n),pct=progress(m,n),i=done(m,n)?0:Math.min(l.steps.length-1,Math.floor(pct/100*l.steps.length));run={m,n,i,lesson:l,built:[],used:[],checked:false,ok:false};render()}
function finish(){const s=state();s.done=s.done&&typeof s.done==='object'?s.done:{};s.progress=s.progress&&typeof s.progress==='object'?s.progress:{};const k=`A1-${run.m}-${run.n}`;s.progress[k]=100;if(!s.done[k]){s.done[k]=true;s.xp=(Number(s.xp)||0)+30}s.level='A1';save(s);sessionStorage.setItem('a15back',String(run.m));location.reload()}
window.a15Finish=finish;
function title(m,n){if(m===0&&START[n])return START[n];if(m===1&&MODULE_TWO_TITLES[n])return MODULE_TWO_TITLES[n];if(m===2&&FAMILY_LESSON_TITLES[n])return FAMILY_LESSON_TITLES[n];if(m===3)return ['Minha manhã: I wake up','Café da manhã e horários','Eu trabalho e estudo','Almoço e tarde','Voltando para casa','Minha noite: I go to bed','Revisão: meu dia em inglês','Missão final: minha rotina'][n]||'Rotina diária';if(m===4)return HABITS_TITLES[n]||'Perguntas e hábitos';return item(m,n)?.title||`Lição ${n+1}`}
function done(m,n){return !!state().done?.[`A1-${m}-${n}`]}
function unlocked(m,n){return n===0||done(m,n-1)||progress(m,n)>0}
const FIRST_CONTACTS_ART=['👋','🌅','💬','🙂','🙏','👋','🎮','✨'];
function firstContactsCards(){
 return Array.from({length:8},(_,n)=>{
  const isDone=done(0,n);
  const icon=FIRST_CONTACTS_ART[n]||'✨';
  return `<div class="firstContactsLessonCard ${isDone?'done':''}" role="button" tabindex="0"
    onclick="openStableLesson('A1',0,${n})"
    onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openStableLesson('A1',0,${n})}">
    <div class="firstContactsLessonCopy">
      <div class="firstContactsLessonNumber">AULA ${n+1}</div>
      <h4>${esc(title(0,n))}</h4>
      <div class="firstContactsLessonStatus">${isDone?'Concluída · toque para revisar':progress(0,n)>0?`Em andamento · ${progress(0,n)}%`:'Toque para começar'}</div>
      <div class="lessonCardProgressV118"><span style="width:${progress(0,n)}%"></span></div>
    </div>
    <div class="firstContactsLessonArt" aria-hidden="true">
      <span class="firstContactsArtGlow"></span>
      <span class="firstContactsArtIcon">${icon}</span>
    </div>
  </div>`;
 }).join('');
}
const MODULE_TWO_ART=['🙂','❓','🤝','🗣️','🌎','🔤','🎯','✨'];
function moduleTwoCards(m=1){
 const icons=m===2?['👨‍👩‍👧','👧','👉','🧑‍🤝‍🧑','❓','💬','🎯','✨']:m===3?['🌅','☕','💼','🍽️','🏠','🌙','🎯','✨']:m===4?['❤️','❓','✅','🥛','📍','📚','🎯','✨']:MODULE_TWO_ART;
 return Array.from({length:8},(_,n)=>{
  const pct=progress(m,n),isDone=done(m,n),isUnlocked=m===2||m===3||m===4?true:unlocked(m,n);
  const icon=icons[n]||'🔤';
  const statusText=isDone?'Concluída · toque para revisar':!isUnlocked?'🔒 Conclua a aula anterior':pct>0?`Em andamento · ${pct}%`:'Toque para começar';
  return `<div class="moduleTwoLessonCard ${m===2?'familyLessonCard':m===3?'routineLessonCard':m===4?'habitsLessonCard':''} ${isDone?'done':''} ${!isUnlocked?'locked':''}" role="button" tabindex="${isUnlocked?0:-1}"
    ${isUnlocked?`onclick="openStableLesson('A1',${m},${n})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openStableLesson('A1',${m},${n})}"`:''}>
    <div class="moduleTwoLessonCopy">
      <div class="moduleTwoLessonNumber">AULA ${n+1}</div>
      <h4>${esc(title(m,n))}</h4>
      <div class="moduleTwoLessonStatus">${statusText}</div>
      <div class="lessonCardProgressV118"><span style="width:${pct}%"></span></div>
    </div>
    <div class="moduleTwoLessonArt" aria-hidden="true"><span class="moduleTwoArtGlow"></span><span class="moduleTwoArtIcon">${!isUnlocked?'🔒':icon}</span></div>
  </div>`;
 }).join('');
}
function moduleView(m){
 m=Number(m)||0;
 document.querySelector('#course')?.classList.remove('first-contacts-lesson-active');
 const screenTitle=document.querySelector('#course > .top h2');
 if(screenTitle)screenTitle.textContent='Curso de Inglês';
 if(m===0){
   $('#courseBody').innerHTML=`<div class="firstContactsView">
     <div class="firstContactsHead">
       <button class="back firstContactsBack" onclick="renderStableCourse()">‹</button>
       <div>
         <div class="firstContactsEyebrow">PRÉ-A1 · MÓDULO 1</div>
         <h2>Hello!</h2>
         <p>Sua primeira conversa em inglês · 8 aulas progressivas</p>
       </div>
     </div>
     <div class="firstContactsLessons">${firstContactsCards()}</div>
   </div>`;
   window.scrollTo(0,0);
   return;
 }
 if(m===1||m===2||m===3||m===4){
   $('#courseBody').innerHTML=`<div class="moduleTwoView ${m===2?'familyModuleView':m===3?'routineModuleView':m===4?'habitsModuleView':''}">
     <div class="moduleTwoHead">
       <button class="back moduleTwoBack" onclick="renderStableCourse()">‹</button>
       <div>
         <div class="moduleTwoEyebrow">${m===2?'A1 · MÓDULO 3':m===3?'A1 · MÓDULO 4':m===4?'A1 · MÓDULO 5':'PRÉ-A1 · MÓDULO 2'}</div>
         <h2>${m===2?'Família e pessoas':m===3?'Rotina diária':m===4?'Perguntas e hábitos':'Meu nome é…'}</h2>
         <p>${m===2?'Aprenda a apresentar familiares e amigos':m===3?'Fale sobre o seu dia, horários e hábitos':m===4?'Faça perguntas e fale dos seus gostos':'Apresente-se e conheça alguém'} · 8 aulas progressivas</p>
       </div>
     </div>
     <div class="moduleTwoLessons">${moduleTwoCards(m)}</div>
   </div>`;
   window.scrollTo(0,0);
   return;
 }
 const cards=Array.from({length:8},(_,n)=>{const pct=progress(m,n),isDone=done(m,n);return `<div class="lessonCard ${isDone?'done':''}"><span class="lessonIcon">${isDone?'✅':(item(m,n)?.e||'💬')}</span><h4>${n+1}. ${esc(title(m,n))}</h4><p>${isDone?'Concluída':pct>0?`Em andamento · ${pct}%`:'Não iniciada'}</p><div class="lessonCardProgressV118"><span style="width:${pct}%"></span></div><button class="btn primary" style="margin-top:10px" onclick="openStableLesson('A1',${m},${n})">${isDone?'Revisar':pct>0?'Continuar':'Começar'}</button></div>`}).join('');
 $('#courseBody').innerHTML=`<div class="top"><button class="back" onclick="renderStableCourse()">‹</button><div><h2 style="margin:0">${m+1}. ${esc(MT[m])}</h2><div class="muted">A1 · poucas palavras, muita repetição</div></div></div><div class="lessonGrid">${cards}</div>`;
 window.scrollTo(0,0);
}
window.openStableModule=(l,m)=>l==='A1'?moduleView(m):oldModule?.(l,m);
window.openStableLesson=(l,m,n)=>{m=Number(m);n=Number(n);if(l==='A1')return start(m,n);return oldOpen?.(l,m,n)};
const back=sessionStorage.getItem('a15back');if(back!==null){sessionStorage.removeItem('a15back');setTimeout(()=>{window.stableShow?.('course');moduleView(Number(back)||0)},250)}
})();
