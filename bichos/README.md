# Bichos do Brejo

Protótipo local de um tabuleiro com três animais originais: Farrapo (coelho), Fusível (rato) e Bolota (sapo).

A câmera ortográfica mostra de cima um campo de 9 × 7 com cantos recortados, chão contínuo, vegetação vetorial e três obstáculos. O retrato e a vida ficam no canto superior esquerdo; a ordem dos turnos fica no topo; os botões de movimento, ataque e habilidade ficam na parte inferior.

A versão 0.4 tem combate por turnos contra **Rosnaldo, o Rei do Brejo**. Ele ocupa exatamente quatro casas em um quadrado de **2 × 2**. A ordem inicial é Fusível → Farrapo → Rosnaldo → Bolota e gira a cada turno. Cada aliado tem **um movimento de até três casas e um ataque básico**, com contadores independentes. Habilidades gastam apenas mana e podem ser repetidas enquanto houver mana e alcance, mesmo depois de mover e atacar. O turno termina em **Passar / E**. As quantidades de movimentos e ataques são configuráveis por personagem para futuras classes. Rosnaldo morde um alvo adjacente ou usa um rugido; sua vez acontece automaticamente. Há derrota, vitória e reinício.

## Abrir

Com Node.js instalado, dê dois cliques em **Iniciar jogo.bat**, ou execute `npm start` nesta pasta e abra http://127.0.0.1:4173.

Todas as dependências estão incluídas. O jogo funciona sem internet e não envia dados para serviços externos.

## Controles

- A primeira ficha da fila é quem pode agir. O retrato e os controles acompanham seu turno.
- Use **Mover / V** para mostrar as casas verdes e clique no destino. Boss, troncos, cogumelos e aliados bloqueiam o caminho.
- Use **Atacar / A** para mostrar o alcance em vermelho, ou a **habilidade / Q** para mostrar o alcance em azul. Clique no boss para confirmar. Selecionar a ação não gasta recursos. **Esc** cancela.
- Use **E** ou **Passar** para encerrar o turno mesmo com ações sobrando.
- Use **Espaço** para pausar ou retomar animações e ações automáticas.
- Mutações foram retiradas do combate. Ficam planejadas para eventos aleatórios após batalhas, com efeitos positivos e negativos, quando a progressão entre níveis for desenvolvida.
- Ajuste a velocidade entre 0,5×, 1× e 1,5×; use + e − para aproximar ou afastar.
- A tela de resultado permite **Recomeçar combate**, restaurando vida, posições, mutações e ordem inicial.

## Mana, especiais e sangramento

Cada bicho começa com **10 de mana** e recupera **3 no início do próprio turno**, até o máximo. A barra azul fica abaixo da vida. O ataque básico continua sem custo de mana, no botão ou na tecla **A**; a especial usa o botão azul ou **Q**. O básico usa o ataque do turno; a habilidade gasta só mana e não consome movimento ou ataque.

- **Farrapo — Metralhadora de cocô:** 8 de mana, alcance 4. Dispara 10 projéteis seguidos, cada um com 1 de dano e 25% de chance individual de crítico (2 de dano). O dano acontece em cada impacto. O coelho fica desesperado durante a rajada e aliviado por um breve período depois.
- **Fusível — Corte de sucata:** 5 de mana, alcance 3. Lança sucata cortante, causa 4 de dano imediato e sangramento de 3 de dano por 3 turnos do alvo. O rato fica com raiva ao atacar e volta ao neutro no fim da animação.
- **Bolota — Xixi ácido:** 6 de mana, alcance 3. Causa 12 de dano e tem expressão relaxada desde o início da habilidade.

Sangramento causa dano no início do turno de quem está sangrando, pode derrotar o boss antes que ele ataque e exibe dano/duração perto da vida dele. Reaplicar renova a duração sem acumular. Reiniciar restaura mana e remove sangramento e expressões. Pausa e velocidade controlam rajadas, efeitos e expressões.

## Arte e animação

Three.js 0.180.0 renderiza o tabuleiro e os personagens. Os aliados usam os desenhos SVG de `dist/characters.js`, convertidos em geometria vetorial articulada pelo SVGLoader. Rosnaldo usa quadros PNG transparentes, com pontos articulados para os efeitos.

Patas e braços são articulados individualmente na arena, e cabeça, olhos, boca, orelhas e mutações acompanham os mesmos movimentos. Os retratos preservam os desenhos originais. Farrapo salta com preparação e aterrissagem; Fusível alterna passadas e braços; Bolota se agacha e estende as pernas para saltar. As sombras diminuem durante os saltos.

Os ataques têm poses próprias de preparação, execução e recuperação: Farrapo recolhe e estende a pata no coice; Fusível levanta o braço e solta a sucata pela mão; Bolota infla o papo, abre a boca e cospe ácido com recuo. Rosnaldo avança e fecha a mandíbula na mordida, ou infla o peito e abre a boca e a juba no rugido. O dano acontece no contato, com breve pausa de impacto e reação articulada do alvo. Pausa, velocidade e reinício também controlam esses movimentos. Campanha e progressão entre combates ainda não estão implementadas.

Código principal: `dist/app.js`. Estilo e interface: `dist/style.css` e `dist/index.html`. Three.js e sua licença estão em `dist/vendor/`.

Os quatro bichos têm vistas de frente, costas e dos dois perfis. Eles viram em cada trecho do caminho, mantêm a última direção ao parar e miram no alvo antes de atacar. Os perfis preservam as orelhas, olhos, marcas e mutações de cada personagem. As direções seguem os eixos do tabuleiro. A seleção da vista está em `dist/facing.js`; os desenhos articulados estão em `dist/directional-art.js`.

O perfil de Rosnaldo segue a referência de leão quadrúpede. Seu rugido tem preparação agachada, expansão do peito, elevação da cabeça, mandíbula articulada, movimento secundário na juba e cauda, poeira nas patas e gotas de saliva. As quatro patas conservam o contato com o chão durante essa animação. O ciclo acompanha pausa, velocidade, impacto e reinício do combate.

O fluxo de arte passa pelas pranchas PNG e pela prévia quadro a quadro. Rosnaldo está integrado com feridas, sangue e podridão sem ossos expostos. O repouso atual é `art/rosnaldo/repouso-v2/` e o rugido é `art/rosnaldo/rugido-v5/`. Cada ação tem quatro direções e doze quadros por direção. As versões anteriores estão preservadas.

As demais ações do leão também já têm prancha própria, sempre com 4 direções × 12 quadros, 48 PNGs, GIFs, `comparacao.png`, visualizador e manifesto: `repouso-v1`, `mordida-v1`, `dano-v1`, `sangramento-v1` e `derrota-v1`. O recorte dessas pranchas mede a grade real da imagem antes de cortar, porque a geração não respeita terços e quartos exatos.

As reações e a queda usam os próprios PNGs; a derrota sustenta a última pose até reiniciar. Nas transições o PNG continua visível enquanto o repouso carrega. A prévia geral em [Rosnaldo · Animações](http://127.0.0.1:4173/art/rosnaldo/index.html) reúne as seis ações nas quatro direções, com pausa, velocidades e seleção de quadros. Usa os mesmos alinhamentos da cena. Caminhada, entrada e celebração continuam como propostas de arte futura.

O terreno, a vegetação, os obstáculos e a seleção de casas estão em `dist/habitat.js`.

Desenho e animação do boss: `dist/boss.js`. Ocupação de casas e busca de caminhos: `dist/grid.js`.

Regras de combate e iniciativa: `dist/combat.js`. Fila, controles e efeitos: `dist/battle.js`. Articulações, ciclos de movimento, poses dos ataques e reações: `dist/animation.js`.

Validação de sintaxe: `npm run check`.

Testes de ocupação, movimentação, turnos, custos, alcance, dano, IA, vitória, derrota, reinício, articulações, aterrissagem, direção e retorno à pose idle: `npm test`.

Verificação no navegador dos botões, alcance, recursos separados, habilidades repetidas, pausa, reinício e telas menores: `node .openai/verify-turn-resources.mjs`.
