# Bichos do Brejo — contexto do projeto e direção de animação

## Atualização — repouso inquieto do Esquilo Histérico em 05/11/2026

- O repouso agora usa 32 quadros PNG novos, oito por direção, com viradas de cabeça, troca de apoio, piscada breve e balanço da cauda. A casa e a direção lógica ficam fixas durante as olhadas. Costas continuam sem rosto.
- A fila altera apenas o ritmo visual. O repouso roda a 1×, a 1,22× quando o esquilo é o próximo e a 1,42× enquanto ele aguarda para agir no próprio turno. Dano, derrota, caminhada e Nozada têm prioridade sobre o repouso.
- Pranchas, quadros, manifesto, GIF e visualizador em `bichos/art/esquilo/idle-v2/`. As durações são compartilhadas em `dist/squirrel-idle-frames.js`.

## Atualização — Nozada acidental em 05/11/2026

- O Esquilo Histérico se atrapalha com a noz e a solta sem querer. Ela acerta o aliado, causa os 3 de dano existentes no contato e rebate para uma casa adjacente. O esquilo se encolhe, corre atrás da noz e a recolhe.
- Com a noz na mão, o esquilo olha para o aliado vivo mais próximo, dá um pulo de susto com olhos projetados e foge. Para a 3 casas do aliado mais próximo quando há caminho, ou na casa alcançável mais afastada dentro desse alcance. Terreno, troncos e bichos vivos bloqueiam o trajeto. Costas continuam sem rosto.
- A sequência usa os PNGs completos existentes e um efeito temporário dos olhos. As duas prévias do combate ficam em `bichos/art/esquilo/nozada-v2/`. O visualizador `png-v1/` conserva o arremesso histórico.

## Atualização — objetos interativos e Graxinin em 02/11/2026

- O usuário pediu elementos do cenário usados como ações bônus e escolheu **objetos como mecânica principal de Graxinin**. Implementados quatro pedras e dois troncos nos dois encontros, sem progressão ou aquisição de mutações.
- Cada aliado recebe **1 interação bônus por turno**, independente de movimento, ataque e mana. **Interagir / B** seleciona objetos na mesma casa ou adjacentes; selecionar e cancelar não gasta. Pedras não bloqueiam movimento; troncos parados bloqueiam aliados, inimigos e invocações. Cada objeto do chão é consumido uma vez por combate, restaurado ao reiniciar ou trocar encontro.
- **Pedrada bônus**, para Farrapo e Fusível: 4 de dano, alcance 3 a partir do bicho. Escolher pedra próxima e depois inimigo; dano no contato, em 68% de 1,12 s. Não consome ataque nem mana.
- **Tronco rolante**, para qualquer aliado: precisa estar em casa adjacente e rola no sentido oposto ao bicho, até 4 casas, causando 8 de dano uma única vez por inimigo, inclusive contra a ocupação 2 × 2 de Rosnaldo. Trajetória dourada antes de confirmar. Para antes de terreno bloqueado, bordas, aliados vivos ou outro tronco; não causa dano amigo. Cada contato é aplicado ao chegar à casa correspondente. O tronco desaparece ao encerrar o uso.
- **Graxinin** começa com uma lata carregada, capacidade de 1 objeto. Seu básico agora é **Arremessar objeto**, 8 de dano e alcance 4, gastando 1 ataque e consumindo o objeto na mão. Depois pode **recolher uma pedra** próxima usando o bônus (0,85 s, coleta em 65%) e guardá-la entre turnos. Recolher não concede outro ataque; permite atacar no mesmo turno se ainda houver ataque disponível. Sem objeto, o básico fica indisponível. A pedra aparece na mão e a lata antiga deixa de ser desenhada quando consumida. Garrafada mantém mana, dano, alcance e sangramento anteriores.
- Arte completa em PNG em `bichos/art/cenario/interativos-v1/`, com originais, recortes transparentes, manifesto e prompts da geração integrada. São objetos estáticos movidos pela cena, não um rig em camadas ou novas animações de personagem. Prévia do rolamento capturada do jogo: `index.html`, com pausa, velocidades e seleção de quadros; GIF `tronco-em-combate.gif`.
- Regras em `dist/environment.js` e `combat.js`; desenhos em `environment-art.js`; seleção, animação e contato em `battle.js`. `tests/environment.test.mjs` cobre consumo, limites, caminhos, múltiplos alvos, ocupação grande, vitória e reinício. Verificador `.openai/verify-environment.mjs` cobre cliques reais, cancelamento, pausa, velocidades 0,5×/1×/1,5×, objeto carregado, reinício durante rolamento, troca de encontro e três larguras de tela. Relatório em `.openai/environment-review/report.json`. Gerador da prévia: `.openai/build-environment-preview.mjs`.

## Decisão atual — manter sprites completos em PNG em 02/11/2026

- Após avaliar o teste do Farrapo em camadas, o usuário descartou a abordagem por exigir muito trabalho para pouco retorno. **Manter sprites completos em PNG, com animação quadro a quadro, sem retomar vector art como direção de produção.**
- O estudo de mutações por partes descrito abaixo foi encerrado e fica preservado apenas como histórico. Não continuar a separação em peças nem integrar esse rig ao jogo.
- A solução visual das mutações ficou em aberto; esta decisão não determina remover seus efeitos de regras nem aprova uma alternativa visual. Aquisição e progressão continuam fora do escopo atual.
- Esta decisão preserva o Farrapo que já está em PNG e não solicita uma conversão imediata dos demais personagens existentes.

## Estudo encerrado — mutações por parte em PNG em 02/11/2026

- O usuário definiu que mutações ocupam partes independentes (cabeça, braços, pernas, cauda, tronco e pelagem), uma opção por parte, com combinações entre partes. Pediu testar o Farrapo inteiro em camadas PNG sobrepostas. Isso não autoriza reintroduzir compra de mutações no combate nem implementar progressão.
- Estudo em `bichos/art/farrapo/mutacoes-camadas-v1/index.html`, preservando o Farrapo atual. São 72 recortes PNG: 28 peças normais, 28 peças de mutação e 16 cabeças de expressão; quatro vistas, membros independentes e pelagem aplicada às peças. Pranchas originais e prompts preservados na pasta.
- A prévia compara os quadros completos atuais, a montagem normal e a combinação selecionada. Inclui sete ações, pausa, velocidade, tempo exato, camadas separadas e inspeção individual. Trata-se de **PNGs articulados de estudo**, não de separação exata dos 96 quadros nem integração final ao jogo. Ações complexas ainda precisam de desenhos próprios das partes para preservar o acabamento.
- A recomendação feita durante o estudo, de usar PNGs em camadas por pose, foi **descartada pelo usuário** na decisão acima. Preservar os quadros completos atuais.
- Gerador de recortes: `bichos/.openai/build-rabbit-layers.mjs`; montagem e movimentos em `mutacoes-camadas-v1/rig.js`. Mutações de exemplo são apenas estudos visuais e não definem atributos ou nomes finais do jogo.

## Atualização — leõezinhos invocados por Rosnaldo em 02/11/2026

- O usuário aprovou o estudo do filhote e pediu implementar. Rosnaldo agora usa **Invocar leõezinhos** no primeiro turno, no lugar do ataque. Surgem até dois nas casas adjacentes livres de sua ocupação; sem espaço, mantém o ataque normal. Não há invocação enquanto algum filhote estiver vivo. Uma nova invocação exige intervalo mínimo de três turnos de Rosnaldo desde a anterior. Rosnaldo continua imóvel.
- Cada **Leãozinho** (`lion-cub`) ocupa uma casa: **10 HP**, iniciativa **7**, movimento de até **3 casas**, **Mordidinha** de **3 de dano**, alcance **1**. Contorna terreno e atores, move e ataca no próprio turno, passa se não alcançar ninguém. Entra na ordem de iniciativa antes de Graxinin, sem trocar o turno de Rosnaldo durante a invocação. Vitória exige derrotar também os filhotes; reiniciar remove os invocados e seus elementos visuais.
- Arte PNG em `bichos/art/leaozinho/png-v1/`: duas pranchas originais, 36 quadros transparentes (9 desenhos × 4 vistas), GIFs, manifesto e visualizador com pausa, velocidade e inspeção. Referência do usuário em `art/leaozinho/referencia-do-usuario.png`; estudo aprovado preservado em `concept-v1/`. Costas sem rosto, perfis com um olho, derrota segurando o último desenho. Prompts em `png-v1/prompts.md`.
- `dist/lion-cub.js` fornece carregamento compartilhado e criação dos filhotes; `lion-cub-frames.js` compartilha sequências e tempos entre jogo, GIFs e prévia. Mordida dura 0,85 s, contato e dano em 56% (0,476 s). Invocação usa a animação PNG de rugido de Rosnaldo e cria os filhotes no impacto, com aparição de 0,45 s; não causa dano junto da invocação.
- Gerador: `.openai/build-lion-cub-preview.mjs`. Verificador: `.openai/verify-lion-cub.mjs`; capturas e relatório em `.openai/lion-cub-review/`. Regras em `tests/lion-cub.test.mjs`. Acesso direto: `http://127.0.0.1:4173/?encontro=rosnaldo`.
- Correção de carregamento encontrada durante a integração: `rabbit-png.js` respeita `posesPerView` do manifesto instalado de Farrapo. Quando as poses extras de alívio 24–26 ainda não foram exportadas, reaproveita o desenho 15; mantém o tempo de alívio e evita que PNGs ausentes impeçam o jogo de iniciar. Exportar novos quadros e atualizar o manifesto para ativar as poses extras.

## Correção — carregamento dos ataques de Rosnaldo em 02/11/2026

- Rosnaldo prepara as seis ações e quatro direções antes de iniciar o jogo. Os 288 quadros permanecem em memória; não restaurar o descarte após apenas três pares de ação/direção, que provocava recargas entre turnos e podia remover um conjunto preparado antes da exibição.
- `createBoss` recebe o renderizador para enviar as texturas à GPU durante a preparação. Não deixar o primeiro envio de cada PNG para o meio da mordida/rugido.
- `.openai/verify-boss-attacks.mjs` testa o renderizador real do leão em servidor isolado, sem depender das artes de outros personagens: 96 quadros de ataque visíveis, sem novas requisições durante as ações, três velocidades, pausa e contato no quadro 7. Relatório em `.openai/boss-attacks-review/report.json`.

## Atualização — Zebra inimiga em PNG em 02/11/2026

- Zebra criada a partir da referência do usuário, preservada em `bichos/art/zebra/referencia-do-usuario.png`. Arte nativa em PNG, com 36 quadros transparentes (9 desenhos × 4 vistas), repouso, caminhada, coice, dano, sangramento e derrota. Costas sem rosto; derrota mantém o último quadro.
- Primeira configuração: **18 HP**, iniciativa **8**, movimento de até **3 casas**, ocupa **1 casa**; **Coice**, **5 de dano**, alcance **1**. Não possui especial adicional. A IA contorna terreno e personagens, caminha e só ataca se alcançar um aliado adjacente; caso contrário, passa.
- O encontro inicial agora tem **dois esquilos e uma zebra**, seguido pelo confronto existente de Rosnaldo. Os três esquilos anteriores continuam disponíveis em `/?encontro=esquilos`; `/?encontro=rosnaldo` segue funcionando. Sem nova campanha, recompensas ou progressão.
- O coice usa as patas traseiras; a zebra vira a garupa para o alvo. Preparação, extensão e recuperação duram **1,05 s**, com dano no contato em **56%**. `bichos/dist/zebra-png-frames.js` compartilha sequências e tempos entre jogo e visualizador; `zebra.js` desenha o plano PNG e os pontos de efeitos.
- Prévia em `bichos/art/zebra/png-v1/index.html`, com pausa, velocidades, inspeção dos nove desenhos e quatro vistas. GIFs: `zebraKick.gif` e `animacoes-quatro-direcoes.gif`. Pranchas originais e prompts preservados na mesma pasta.
- Gerador: `bichos/.openai/build-zebra-preview.mjs`. Testes: `bichos/tests/zebra.test.mjs`. Verificador de navegador: `bichos/.openai/verify-zebra.mjs`, com capturas e relatório em `.openai/zebra-review/`; aceita `ZEBRA_REVIEW_URL` para uma instância local alternativa. `verify-zebra-preview.mjs` verifica a arte separadamente. Na entrega, a prévia e o combate isolado passaram; a execução normal encontrou quadros 24–26 de Farrapo ainda ausentes em uma alteração paralela. `--baseline-rabbit` usa os 24 desenhos anteriores somente nas respostas ao navegador de teste, sem editar Farrapo, e grava `verificacao-isolada.json`. Repetir sem esse argumento após concluir esses PNGs. Preservar alterações paralelas de leõezinhos nos arquivos compartilhados.

## Atualização — Farrapo integrado em PNG em 02/11/2026

- **Alívio ao final da rajada:** a prévia e os GIFs seguram a pose relaxada (desenho 16, índice 15) por 1,8 s depois dos 2,3 s da ação, antes de repetir. O jogo usa o mesmo `RABBIT_RELIEF_HOLD` para o alívio no personagem e nos retratos. Não voltar imediatamente à preparação no visualizador nem deixar o alívio visível por apenas um quadro.

- O usuário aprovou a nova prancha e pediu implementar Farrapo como um todo. **Farrapo agora é PNG no jogo**, com 96 quadros transparentes (24 desenhos por direção), repouso, saltos, coice, rajada, dano e derrota; sangramento reaproveita a reação a dano. As referências vetoriais anteriores permanecem preservadas como histórico, mas não desenham mais o personagem ou seu retrato.
- `bichos/dist/rabbit-png.js` carrega os quadros antes de iniciar o jogo e desenha um único plano PNG, com pontos próprios de efeitos. `rabbit-png-frames.js` compartilha a seleção de desenhos e tempos com o visualizador. Retratos usam os mesmos PNGs, incluindo esforço e alívio, sem redesenho vetorial.
- `bichos/art/farrapo/png-v1/index.html` mostra as ações nas quatro vistas com pausa, velocidades e inspeção dos 24 desenhos. GIFs: `animacoes-quatro-direcoes.gif` e `rajada-quatro-direcoes.gif`. Pranchas de origem e revisões estão preservadas; o quadro traseiro de contração usa `contracao-costas.png` para evitar o colapso repetido da orelha.
- Rajada continua com dez contrações sincronizadas, olhos continuamente fechados durante esforço, boca e dois incisivos preservados, alívio posterior. `barrageFlush` e `barragePulse` continuam compartilhadas; a vermelhidão é aplicada sobre o próprio PNG da cabeça, incluindo costas e retratos. Dano, mana, alcance, saltos, turnos e demais personagens mantêm as regras existentes.
- Movimento de PNG não significa movimento inimigo: em `battle.js`, apenas os atores que não estão na lista de aliados passam pelo controlador de caminhada dos inimigos. Isso impede processar os saltos do Farrapo duas vezes.
- Gerador: `bichos/.openai/build-rabbit-png.mjs`. Verificação no navegador: `bichos/.openai/verify-rabbit-png.mjs` (use `--quick` para pular a exportação dos GIFs); relatório em `png-v1/verificacao.json`. As menções anteriores a Farrapo inteiramente vetorial descrevem a versão histórica.

## Atualização — Esquilo Histérico móvel em 02/11/2026

- Pedido do usuário: implementar o esquilo da referência como inimigo fraco para encontros antes de Rosnaldo. O usuário confirmou explicitamente que **ele se move no tabuleiro**.
- O jogo começa em um encontro com três esquilos. Cada um ocupa **1 casa**, tem **12 HP**, iniciativa **9**, movimento de até **3 casas**, e **Nozada**, **3 de dano** com alcance **3**. Cada um procura um caminho livre para entrar em alcance, contornando terreno e personagens; move e ataca no próprio turno. Se não houver caminho ou alvo, passa. Rosnaldo continua imóvel e ocupa 2 × 2.
- Nozada tem preparação, soltura em 50% e impacto/dano em 78% de 0,95 s. Projétil nasce na pata e segue ao alvo. Surto de Nozes aparece na concept, mas **não foi implementado** nesta primeira versão.
- Arte PNG nativa em `bichos/art/esquilo/png-v1/`: duas pranchas originais, 36 quadros transparentes (9 poses × 4 vistas), GIFs e visualizador com ação, pausa, velocidade e seleção de quadros. Referência original preservada em `bichos/art/esquilo/referencia-do-usuario.png`; prompts registrados em `png-v1/prompts.md`. Costas não mostram rosto. Derrota mantém o último quadro até reiniciar.
- `bichos/dist/squirrel.js` desenha os quadros e define pontos de emissão; `encounters.js` centraliza atributos e posições. `combat.js` suporta múltiplos inimigos, alvos explícitos, ocupação individual e movimento inimigo. A rajada para ao derrotar seu alvo sem transferir tiros; sangramento mantém eventos de mortes mesmo ao pular para o próximo inimigo vivo.
- Após derrotar os três, **Enfrentar Rosnaldo** abre o confronto existente e restaura vida e mana dos aliados. Reiniciar repete apenas o encontro atual. Acesso direto a Rosnaldo: `http://127.0.0.1:4173/?encontro=rosnaldo`. Não há campanha persistente, recompensas ou aquisição de mutações.
- Gerador: `bichos/.openai/build-squirrel-preview.mjs`. Verificação do fluxo: `bichos/.openai/verify-squirrel.mjs`; resultados e capturas em `.openai/squirrel-review/`. Testes das regras em `bichos/tests/squirrel.test.mjs`. Verificadores históricos de Rosnaldo agora usam o acesso direto ao encontro dele.

## Atualização — nova etapa de arte em PNG em 02/11/2026

- O usuário decidiu trabalhar os próximos personagens sem vector art por enquanto e escolheu **Farrapo** para começar. Esta decisão substitui a exigência anterior de manter o personagem necessariamente vetorial nesta nova etapa.
- Produzir desenhos e animações diretamente em PNG, preservando identidade, postura e proporções dos estudos aprovados em `bichos/art/farrapo/postura-original-v1/`. As laterais continuam em perfil completo, com apenas um olho visível; frente mantém a boca característica e os dois incisivos; costas não mostram rosto.
- A etapa começou pelas quatro vistas paradas em `bichos/art/farrapo/png-v1/`, depois aprovadas para a implementação completa registrada acima.
- Preservar as versões anteriores e a implementação atual durante o estudo. Esta decisão não autoriza trocar todos os personagens de uma vez nem alterar regras de combate.

## Atualização — expressão da rajada de Farrapo em 02/11/2026

- A preparação usa desespero; ao começar a rajada, manter a expressão de esforço, olhos espremidos e rosto vermelho de forma contínua até o alívio. **Não abrir e fechar os olhos a cada tiro:** o usuário rejeitou essa alternância porque parecia piscar sem parar. Suspender também a piscada de repouso durante o esforço. As dez contrações continuam apenas no corpo e na leve baixada de cabeça, sincronizadas às emissões; preservar os apoios e evitar tremor contínuo.
- **Vermelhidão gradual:** a cor aumenta suavemente durante os primeiros 35% da ação, permanece no esforço e desaparece gradualmente nos últimos 24%. Não alternar cores por tiro. `barrageFlush` define a curva usada no jogo e nas prévias; cabeça e pálpebras recebem o mesmo tom, incluindo retratos.
- A parte de trás da cabeça também avermelha pela mesma curva na vista de costas; manter o desenho traseiro, sem olhos ou boca.
- **Correção do usuário:** na vista frontal, manter exatamente a boca padrão e os dois incisivos originais, inclusive durante esforço e alívio. Não acrescentar sorriso ou uma fileira de dentes junto dos dentões de coelho.
- No alívio, desenhar apenas os traços dos olhos fechados sobre a cabeça original. Não usar preenchimento retangular para esconder o olho: esse retângulo ultrapassava a silhueta dos perfis no último quadro.
- Continua inteiramente vetorial no jogo. `bichos/dist/expressions.js` repinta os paths originais da cabeça. `barragePulse` e `barrageEmotion` em `bichos/dist/animation.js` compartilham o tempo das contrações; `bichos/dist/battle.js` atualiza a expressão durante a ação.
- Prévia atual: `bichos/art/farrapo/rajada-v2/index.html`, 70 PNGs por direção, GIFs e comparação antes/depois. `rosto-animado.gif` destaca perfil e frente. Gerador: `bichos/.openai/build-rabbit-barrage-preview.mjs`. Verificação: `bichos/.openai/verify-rabbit-face.mjs`; resultado em `rajada-v2/verificacao.json`. Prévia anterior em `vetor-aprovado-v1/` preservada.

## Atualização — recursos do combate em 02/11/2026

- Por padrão, cada aliado tem **1 movimento e 1 ataque básico por turno**, em contadores separados. Um movimento percorre até 3 casas; não pode ser convertido em ataque, nem o contrário. Quantidades configuráveis por personagem em `movesPerTurn` e `attacksPerTurn`, para futuras classes com dois movimentos ou dois ataques; nenhuma classe nova foi criada.
- Habilidades gastam **somente mana** e podem ser repetidas enquanto houver mana e alvo ao alcance. Também funcionam depois de gastar movimento e ataque. O jogador encerra o turno em **Passar / E**.
- **Mover / V**, **Atacar / A** e **habilidade / Q** selecionam a ação e mostram o alcance no tabuleiro (verde, vermelho e azul). Clicar no destino/alvo confirma; **Esc** cancela. Selecionar não gasta recursos. Ataque fora de alcance ainda permite visualizar a área.
- **Mutações foram retiradas do combate:** sem painel, compra ou atalho M. A ideia futura é obter mutações positivas e negativas por eventos aleatórios após batalhas, quando houver múltiplos níveis; não implementar essa progressão agora. Desenhos e suporte passivo históricos permanecem preservados, sem aquisição disponível.
- Verificação do fluxo atual: `bichos/.openai/verify-turn-resources.mjs`.

## Atualização — finalização de Rosnaldo em 01/11/2026

- O repouso cartunesco `bichos/art/rosnaldo/repouso-v2/` foi completado: quatro pranchas, 48 quadros PNG, GIFs e visualizador; ciclo de 1,92 s, 160 ms por quadro. Os dois perfis existentes foram preservados; frente e costas foram geradas com os perfis v2 e as respectivas vistas de `rugido-v5` como referências.
- O jogo usa `repouso-v2` e `rugido-v5`; mordida, dano, sangramento e derrota continuam nas versões v1 existentes. O material v2 histórico abaixo permanece preservado como origem, mas não é a versão atual de rugido no jogo.
- `bichos/art/rosnaldo/index.html` reúne as seis ações nas quatro direções, com pausa, seleção de quadros e velocidades. A derrota segura o último quadro. A página usa os mesmos alinhamentos do jogo.
- Ao encerrar um ataque e trocar de vista, manter o PNG visível enquanto o repouso carrega, sem revelar o esqueleto vetorial antigo. As pastas de quadros vêm de `boss-png-layout.js`, sem um segundo mapa divergente em `boss.js`.
- As ações futuras abaixo continuam apenas propostas; não acrescentar caminhada à IA ou outras mecânicas por causa desta finalização.

Este arquivo registra o contexto do projeto e as decisões do usuário para dar continuidade ao trabalho. A raiz deste workspace contém a pasta `bichos/`, que é a raiz executável do jogo. Os caminhos abaixo são relativos a este arquivo, salvo indicação contrária.

## 1. Prioridades e decisões do usuário

- O objetivo é um jogo tático com personagens expressivos, grotescos e bem animados, com cuidado de desenho e acabamento.
- Todos os personagens precisam olhar para direita, esquerda, cima e baixo, acompanhando o caminho e o alvo. Não deixar o rosto sempre voltado para a câmera.
- Ataques, repouso, movimento e reações precisam funcionar nas quatro vistas. Manter partes do rosto, membros, marcas e mutações presas à anatomia durante toda a ação.
- O usuário rejeitou perfis genéricos e simplificados que perderam a personalidade dos desenhos originais. Preservar identidade, proporções, silhueta, expressão e acabamento.
- **Correção mais recente de Farrapo:** preservar a identidade, postura e proporções da concept enviada pelo usuário em `bichos/art/farrapo/tres-quartos-v1/referencia-do-usuario.png`. O usuário rejeitou o redesenho em `bichos/art/farrapo/perfil-v2/` e observou que até o perfil completo da concept mantém melhor a identidade. Pedido atual: gerar **dois estudos parados**, um de cabeça e corpo em **três quartos**, com os dois olhos visíveis (pose central da referência), e um em **perfil completo** (pose da direita). Manter cabeça redonda, focinho curto, corpo baixo e pequeno e orelhas assimétricas. Mostrar as imagens antes de animar ou integrar; aguardar o retorno visual para essas etapas.
- **Ajuste de postura posterior:** o usuário pediu manter **exatamente a postura do Farrapo atual do jogo**, sem adotar automaticamente a postura mais baixa de coelho da concept e sem inventar um bípede novo. Usar `bichos/dist/assets/rabbit.svg` (rasterizado como `bichos/art/farrapo/tres-quartos-v1/postura-original-do-jogo.png`) como referência principal de tronco, apoio e proporções. A concept fornece aparência, rosto e acabamento. Os estudos `estudo-corpo-baixo.png` nas pastas de três quartos/perfil registram a tentativa anterior, ainda sem a correção de postura.
- **Estudos aprovados e escolha final:** o usuário aprovou `bichos/art/farrapo/postura-original-v1/tres-quartos-aprovado.png` e `perfil-aprovado.png`, reafirmando que Farrapo é **vector art**, e escolheu **perfil completo, mostrando só um olho**, como vista lateral principal no jogo. Estes PNGs são guias de desenho; o personagem no jogo deve preservar formas vetoriais nativas e articulação, sem substituir Farrapo por um plano PNG. O estudo de três quartos fica preservado como alternativa de arte.
- **Integração dos perfis aprovados:** `bichos/dist/rabbit-approved-art.js` desenha o perfil completo e o estudo de três quartos com paths e elipses; `rabbit-profile.js` seleciona perfil completo para as laterais. As proporções do tronco e membros vêm do desenho frontal original. `bichos/art/farrapo/vetor-aprovado-v1/` contém SVGs, PNGs, GIFs e visualizador dos vetores articulados; os PNGs são apenas prévias. As expressões usam o olho anatômico visível de cada lado e não desenham o olho oculto. Frente e costas mantêm os desenhos anteriores.
- **Correção da rajada de Farrapo:** o usuário rejeitou a boca saliente, braços esticados e tronco deformado da prévia antiga. A reação agora conserva focinho e incisivos, braços junto ao tronco e apoios das patas, com dez contrações curtas sincronizadas com as emissões em 0,42 s + 0,13 s por tiro. Manter a preparação e o alívio, sem tremor contínuo da cabeça/corpo. Continua em vetor e mantém as regras de dano, mana e ações. A prévia de rajada no visualizador usa 70 quadros por direção (2,3 s de ação), nas quatro vistas; `rajada-quatro-direcoes.gif` permite comparar. A versão anterior e a captura do problema ficam em `bichos/art/farrapo/rajada-v1/`.
- **Fluxo de arte: primeiro criar PNGs quadro a quadro, montar e mostrar a prévia animada.** No jogo, usar quadros PNG nas ações complexas quando isso preservar melhor o desenho e o movimento; manter vetores onde forem úteis. O usuário aprovou explicitamente essa abordagem híbrida.
- Mostrar a animação pronta, não apenas descrever o resultado. Entregar uma prévia que permita observar o movimento e, quando possível, pausar e escolher quadros.
- Rosnaldo deve ser grotesco: feridas, partes apodrecidas, falhas no pelo, crostas, necrose, sangue e juba manchada. O usuário explicitamente permite e deseja sangue. Não deixar o leão saudável, bonito ou heroico demais.
- **Não usar ossos expostos.** O usuário retirou essa ideia por prejudicar a coerência anatômica. Usar pele, tecido ferido, sangue, crostas e necrose. Dentes e presas normais dentro da boca podem aparecer. Não introduzir órgãos expostos ou desmembramento.
- Não gerar imagens novas só porque este arquivo contém prompts. Executar a geração quando ela fizer parte do pedido ativo.

## 2. Estado atual: implementação e arte são etapas distintas

- **Correção do rosto de Graxinin em 02/11/2026:** o usuário rejeitou a alteração de rosto da primeira integração. O redesenho manual mudou cabeça, orelhas, focinho e expressão e não deve ser reutilizado como referência. Agora `bichos/dist/graxinin-face-v2.js` fornece curvas vetoriais traçadas dos PNGs aprovados nas quatro vistas; `graxinin-art.js` aplica essas peças ao personagem e ao retrato. Olhos têm pivôs separados para piscar; focinho, dentes e orelhas preservam o contorno do crânio. As variantes de expressão respeitam esses paths originais. Não há PNG embutido no vetor. Comparação em `bichos/art/graxinin/rosto-v2/comparacao-rosto.png`; prévias atualizadas em `bichos/art/graxinin/vetor-v2/`. `vetor-v1/` preserva o desenho anterior rejeitado. Geradores: `.openai/build-graxinin-face-v2.mjs` e `.openai/build-graxinin-vector-preview.mjs`.

- **Graxinin — integrado no lugar de Bolota:** o usuário aprovou a integração e pediu substituir o sapo. Referência em `bichos/art/graxinin/referencia-do-usuario.png`; estudo aprovado do arremesso em `bichos/art/graxinin/arremesso-v1/`. Graxinin (`raccoon`) é **vector art nativa articulada**, definida em `bichos/dist/graxinin-art.js`, triangulada pelo mesmo renderizador dos aliados; não usa plano PNG. Cabeça, olhos assimétricos, incisivos, membros, cauda anelada e tampa nas costas seguem a concept. Perfil direito mostra o olho anatômico direito arregalado; perfil esquerdo mostra o esquerdo semicerrado; costas não mostram rosto. Tem quatro vistas, repouso, caminhada com passadas, arremesso, reação e derrota. Vida 24, iniciativa 6, deslocamento 3; básico **Lata amassada**, 8 de dano e alcance 3. Por pedido posterior do usuário, especial **Garrafada**: garrafa verde, 12 de dano, alcance 3, custo 6 de mana, sangramento de 3 por 3 turnos do alvo (renova sem empilhar). Lata e garrafa saem da mão, soltura em 50% e impacto em 76% de uma ação de 1,2 s. A tampa é visual e não concede defesa extra. `bichos/art/graxinin/vetor-v1/` contém SVGs nativos, visualizador e GIFs derivados do mesmo rig; os PNGs/GIFs são somente prévias. Não voltar ao sapo nem usar PNG no personagem sem novo pedido.

- O jogo local funciona em Three.js. Aliados e cenário usam geometria vetorial derivada de SVG; Rosnaldo usa quadros PNG transparentes em um plano da cena, com pivôs leves para direção e origem de efeitos. Retratos e controles usam HTML/SVG, exceto o retrato do boss na fila, que usa PNG.
- Foram implementadas vistas direcionais, viradas por trecho do caminho, orientação para o alvo e adaptações dos ataques. Há animações de movimento dos aliados, ataques básicos e especiais, reações e derrota.
- Rosnaldo usa 12 quadros PNG por direção no repouso, mordida, rugido, dano, sangramento e derrota. A cena troca a textura de um único plano; os efeitos de poeira, saliva e ondas continuam separados.
- Os quadros PNG grotescos estão integrados ao jogo por uma abordagem híbrida. A conversão vetorial anterior em `dist/boss-art.js` não participa mais da renderização.
- A referência PNG atual é `bichos/art/rosnaldo/rugido-v2/`. `rugido-v1/` é a versão anterior, limpa demais; não é a referência visual final de Rosnaldo.
- As ações `repouso-v1`, `mordida-v1`, `dano-v1`, `sangramento-v1` e `derrota-v1` têm 4 direções × 12 quadros. Cada pasta contém `quadros/`, GIFs por direção, `quatro-direcoes.gif`, `comparacao.png`, `index.html` e `manifest.json`. O jogo carrega os quadros da pasta `art/` pelo servidor local.
- Reações e queda usam os respectivos PNGs; a última pose de derrota permanece visível até reiniciar. A estrutura antiga de juntas ainda calcula sockets e serve de fallback, mas não desenha Rosnaldo.
- Tentativas de reproduzir a podridão como camadas soltas de ferida foram descartadas: viraram adesivos sobre o desenho. A reprodução precisa vir da própria prancha PNG, não de manchas acrescentadas por cima.
- `rugido-v2/prompts.md` guarda os prompts históricos. A seção histórica de primeira construção contém uma menção antiga a osso exposto, já revogada. Não reutilizar essa menção; as regras atuais deste arquivo prevalecem.
- Caminhada, giro dedicado, entrada e celebração de Rosnaldo nos prompts abaixo são preparação de arte para expansão futura, não mecânicas já existentes. Atualmente a IA do boss ataca, mas não caminha pelo tabuleiro.
- Campanha e progressão entre combates ainda não estão implementadas. Não inventar lore, fases, habilidades ou sistemas como se já existissem.

## 3. Contexto do jogo

Nome: **Bichos do Brejo**. Protótipo local de combate tático por turnos, com humor estranho e animais originais. Câmera ortográfica elevada sobre uma clareira de brejo. Tabuleiro de 9 × 7 com cantos recortados, vegetação, troncos e cogumelos que bloqueiam casas. Cada casa mede 1,23 unidades de mundo.

### Personagens e combate

| Personagem | Identidade e atuação | Vida | Iniciativa | Ataque básico | Especial |
| --- | --- | --- | --- | --- | --- |
| Farrapo (`rabbit`) | Coelho nervoso, pelagem creme gasta, uma orelha alta e outra caída/rasgada, olhos assimétricos, dentes e marcas características. Locomoção por saltos. | 18 | 10 | Coice: 10 de dano, alcance 1. | Metralhadora de cocô: 8 de mana, alcance 4, 10 projéteis de 1 de dano; cada projétil tem 25% de chance de crítico de 2 de dano. |
| Fusível (`rat`) | Rato cinza, desconfiado, olhos semicerrados, focinho comprido, cauda rosada, orelhas e dente característicos. Passadas alternadas. | 14 | 12 | Sucata: 7 de dano, alcance 3. | Corte de sucata: 5 de mana, alcance 3, 4 de dano imediato e sangramento de 3 por 3 turnos do alvo. |
| Graxinin (`raccoon`) | Guaxinim cinza gasto, olhos assimétricos, máscara escura, cauda anelada, lata no peito e tampa nas costas. Caminha com passadas alternadas. Substituiu Bolota. | 24 | 6 | Lata amassada: 8 de dano, alcance 3. | Garrafada: 6 de mana, alcance 3, 12 de dano e sangramento de 3 por 3 turnos. |
| Rosnaldo (`rosnaldo`) | Rei do Brejo; leão grotesco, quadrúpede, juba malva e pelagem creme apodrecida. Ocupa exatamente 2 × 2 casas. | 120 | 8 | Mordida: 8 de dano em um alvo adjacente. | Rugido: 3 de dano nos aliados até distância 3; sem alvos próximos, rugido distante de 4 no aliado mais próximo. Não usa o sistema de mana dos aliados. |

- Ordem inicial: Fusível → Farrapo → Rosnaldo → Graxinin. Mortos saem da fila; a ordem gira a cada turno.
- Cada aliado tem, por padrão, 1 movimento de até 3 casas e 1 ataque básico por turno, independentes. Habilidades custam apenas mana, sem limite de utilizações além da mana disponível. O turno termina ao passar manualmente.
- Aliados começam com 10 de mana e recuperam 3 no início do próprio turno, até o máximo de 10. Ataques básicos não gastam mana.
- Mutações não podem ser adquiridas durante o combate. Suporte passivo antigo e arte estão preservados para trabalho futuro; mutações positivas/negativas por eventos pós-batalha ainda não foram implementadas.
- Na rajada de Farrapo, o bônus do chifre entra uma única vez, no primeiro projétil. Cada impacto aplica seu próprio dano e pode encerrar a rajada ao derrotar o boss.
- Sangramento acontece no início do turno do alvo. Reaplicar renova a duração sem empilhar. Pode derrotar Rosnaldo antes da ação dele.
- Distância e alcance consideram a casa ocupada do boss mais próxima, não apenas seu centro visual. As quatro casas dele bloqueiam caminhos.
- Dano deve coincidir com contato/impacto, não com o início da preparação. Manter pausa, velocidades 0,5×/1×/1,5×, breve pausa de impacto e reinício coerentes com todos os quadros e efeitos.
- Farrapo fica desesperado durante a rajada e aliviado depois; Fusível fica com raiva ao atacar e volta ao neutro; Bolota usa expressão relaxada na especial.
- Vitória e derrota encerram ações. Reiniciar restaura posições, vida, mana, mutações, expressões, sangramento e fila inicial.

### Controles e interface

Use Mover/V, Atacar/A ou habilidade/Q para selecionar e mostrar o alcance; clique em uma casa válida ou no boss para confirmar. Esc cancela a seleção; E passa o turno; Espaço pausa. Zoom e velocidade estão nos controles da tela. Retrato, vida e mana ficam no alto à esquerda; fila de iniciativa no topo; botões de movimento, ataque e habilidade na parte inferior. Manter a interface em português e evitar detalhes de implementação nos textos de jogo.

### Direções

| Nome no material | Chave no código | Eixo do tabuleiro | Desenho |
| --- | --- | --- | --- |
| Direita | `right` | +X | Perfil completo; focinho para a direita. |
| Esquerda | `left` | −X | Perfil completo; focinho para a esquerda. |
| Frente / baixo | `down` | +Z | Personagem olhando para a parte de baixo do campo. |
| Costas / cima | `up` | −Z | Personagem olhando para longe; sem rosto visível através da cabeça/juba. |

As direções seguem os eixos do tabuleiro, independentemente de zoom e inclinação da câmera. Para alvos diagonais, o código escolhe o eixo dominante e mantém o eixo anterior em empates compatíveis. Ao parar, conservar a última direção. Reação a dano não deve girar automaticamente o personagem para a câmera.

## 4. Arquivos e execução

| Caminho | Responsabilidade |
| --- | --- |
| `bichos/package.json`, `server.mjs`, `Iniciar jogo.bat` | Comandos e servidor local. |
| `bichos/dist/app.js` | Cena, câmera, renderização vetorial, criação dos aliados e ciclo de animação. |
| `bichos/dist/characters.js` | Identidade, desenhos SVG originais, partes articuladas, retratos e mutações. |
| `bichos/dist/boss.js`, `boss-png-layout.js` | Quatro casas, plano PNG de Rosnaldo, cache de quadros e alinhamento por ação e direção. |
| `bichos/dist/directional-art.js` | Desenhos vetoriais de perfil/costas dos aliados e pivôs leves de Rosnaldo. |
| `bichos/dist/facing.js` | Bancos de vistas, direção, troca de desenho e orientação para o alvo. |
| `bichos/dist/animation.js` | Articulações, repouso, locomoção, poses-chave, ataques, reações e pontos de saída. |
| `bichos/dist/expressions.js` | Expressões de rosto e aplicação por vista. |
| `bichos/dist/combat.js` | Regras, iniciativa, custos, dano, mana, sangramento e IA. |
| `bichos/dist/battle.js` | Controles, ações em andamento, impactos, projéteis, efeitos e reinício. |
| `bichos/dist/grid.js`, `habitat.js` | Ocupação, busca de caminhos, terreno, cenário e casas. |
| `bichos/dist/index.html`, `style.css` | Interface. |
| `bichos/dist/vendor/` | Three.js 0.180.0, SVGLoader e licenças locais. |
| `bichos/tests/` | Testes de regras, grade, articulações, direções e contato das patas. |
| `bichos/.openai/` | Ferramentas locais de montagem de prévias, alinhamento PNG e verificação. Conferir dependências/caminhos antes de reutilizar. |

O código editável atual está em `dist/`; não presumir uma pasta `src/` ou um processo de compilação inexistente. O jogo não precisa de serviços externos para funcionar. Usar o diretório `bichos/` para executar:

```text
npm start       # http://127.0.0.1:4173
npm run check   # sintaxe
npm test        # testes
```

Após mudanças funcionais, verificar os caminhos afetados no jogo. Após mudanças só de documentação/prompts, revisar conteúdo e referências; não é necessário abrir o jogo ou gerar arte.

## 5. Referências e organização dos arquivos de arte

Material atual: `bichos/art/rosnaldo/rugido-v2/`.

- `direita.png`, `esquerda.png`, `frente.png`, `costas.png`: pranchas transparentes de 1448 × 1086, com 4 colunas × 3 linhas. Cada célula mede 362 × 362.
- `quadros/`: 48 PNGs individuais, nomeados por direção e número de 01 a 12.
- `quatro-direcoes.gif`: comparação animada simultânea das quatro vistas.
- `*-animado.gif`: animação individual de cada vista.
- `index.html`: visualizador com reprodução, pausa, velocidade e seleção de quadros.
- `manifest.json`: tamanho, quantidade de quadros, duração, versão e estado de integração.
- `prompts.md`: registro dos pedidos usados na geração; observar a correção final de retirar ossos expostos.

As ações novas (`repouso-v1`, `mordida-v1`, `dano-v1`, `sangramento-v1`, `derrota-v1`) vêm da geração integrada com 1536 × 1024 e grade irregular: o corte mede as calhas transparentes da própria prancha em vez de dividir em terços e quartos, e cada quadro sai em célula quadrada. Ferramenta: `.openai/build-action-preview.mjs`; importação das pranchas: `.openai/import-rosnaldo-sheets.mjs`. Conferir bordas dos quadros antes de aceitar uma prancha nova.

Criar novas ações em `bichos/art/rosnaldo/<acao>-v<N>/`. Exemplos: `repouso-v1`, `mordida-v1`, `dano-v1`, `derrota-v1`. Não sobrescrever versões anteriores sem necessidade. Usar as pranchas grotescas v2 como referência de identidade, mesmo quando a nova ação não for rugido. Preservar a arte de origem; cortar células e montar prévias em arquivos derivados.

## 6. Processo de criação e critérios de qualidade

1. Ler a tarefa e identificar ação, personagem e vistas necessárias. Consultar a referência PNG atual e os desenhos do personagem.
2. Gerar primeiro uma prancha de referência da ação, usando a ferramenta integrada de imagens. Usar imagens fornecidas como referências explícitas de identidade, estilo e movimento.
3. Para Rosnaldo, começar pelo perfil direito e usá-lo junto das referências atuais para construir as outras vistas. Não fabricar os perfis por simples rotação de um desenho frontal.
4. Criar uma prancha por direção, normalmente com 12 quadros em 4 × 3. Fundo realmente transparente, corpo inteiro, escala e câmera fixas, margens suficientes para o maior movimento. Não basta renomear um arquivo sem transparência.
5. Preservar um mapa anatômico de feridas: orelha danificada, olho doente, lesões, manchas e falhas no pelo não podem trocar de lado entre quadros. Lado anatômico não é lado da tela. Conferir isso entre perfis e vistas frontal/traseira; não presumir que espelhar resolve assimetrias.
6. Extrair quadros sem amputar juba, cauda, patas ou gotas aderidas ao desenho. Verificar limites das células antes de automatizar o recorte.
7. Montar prévia e observar em movimento, em tamanho de jogo e ampliada. Corrigir membros extras, junções soltas, deriva de volume, mudança de feridas e pés deslizando.
8. Mostrar PNGs e prévia animada ao usuário. Integrar os próprios quadros PNG nas ações complexas ou reproduzir vetores quando isso oferecer qualidade equivalente, incorporando o retorno recebido.
9. Quando a ação for vetorial, separar torso, cabeça, mandíbula, olhos, orelhas, juba traseira, rufa frontal, cauda e quatro membros com pivôs coerentes. Quando for PNG, manter escala, chão e mapa anatômico consistentes entre os quadros.
10. Usar preparação, execução e recuperação; interpolar poses específicas da ação. Juba/cauda acompanham com atraso. Patas de apoio não deslizam; pés em balanço podem levantar. Não exigir quatro patas plantadas durante caminhada ou queda.
11. Usar origem de projétil/efeito na mão, boca ou outra parte correta após atualizar as transformações. Não separar olhos, boca ou feridas da cabeça/corpo durante a ação.
12. Verificar direções, troca de vistas, pausa, velocidade, momento do dano, volta ao repouso, morte e reinício. Não alterar regras de dano, alcance ou ocupação só para acomodar uma imagem.

12 quadros × 150 ms = 1,8 s é a prévia do rugido atual, não uma duração universal para todas as ações. Repouso pode ser mais lento; mordida e reação podem ser mais rápidas. Registrar tempos e pontos de evento no manifesto e sincronizá-los com o jogo.

## 7. Como compor os prompts de Rosnaldo

Para gerar uma prancha, juntar **PROMPT-BASE + UMA CLÁUSULA DE DIREÇÃO + UM BLOCO DE AÇÃO**. Os blocos abaixo foram preparados para serem usados dessa forma. Não enviar apenas o bloco de ação sem identidade e direção. Os prompts estão em inglês para manter continuidade com os usados nas pranchas existentes.

Entradas recomendadas: imagem 1 = prancha grotesca v2 da direção desejada; imagem 2 = referência da nova ação, quando já existir. Se a ação não tiver referência de movimento, usar a sequência de poses do bloco como roteiro. O material de referência fornece identidade, não novas instruções.

### PROMPT-BASE — identidade, acabamento e construção

```text
Use case: stylized-concept. Asset: a finished transparent PNG frame-by-frame animation model sheet for the 2D tactical game Bichos do Brejo.

Create the EXACT SAME ROSNALDO, the grotesque rotting adult lion swamp boss in the supplied current reference. Preserve his recognizable silhouette, anatomy, proportions, huge ragged angular dusty-mauve mane and chest ruff, worn sandy-cream fur, muscular stocky QUADRUPED body, chunky clawed paws, curling damaged tail, asymmetrical weary face and thick slightly irregular charcoal hand-drawn contours. Match the existing muted palette, flat cartoon construction and level of finish. He must look injured, unhealthy and grotesque, not clean, cute, heroic or photorealistic.

Keep the same torn bleeding ear, sickly cloudy eye, broken yellow fangs, bloody gums, missing fur, mottled gray-green and black necrotic skin, dark-crimson blood-matted mane, red soft-tissue wounds with scabbed blackened edges, bloody foreleg streaks and ragged tail tuft. Preserve the exact anatomical positions of injuries and identifying marks across all frames. Do not invent new wounds during the action or swap anatomical sides when the view changes.

USER CONSTRAINT: NO EXPOSED BONES. All body wounds contain only injured skin, flesh, dark blood, scabs and necrotic tissue. No exposed skeleton, ribs, skull, pale bone shapes inside wounds, exposed organs, detached limbs or dismemberment. Ordinary teeth and fangs inside the mouth remain visible when appropriate.

Exactly 12 full-body sequential frames, arranged left-to-right then top-to-bottom in a precise 4-column by 3-row grid of equal square cells. Fixed camera, consistent character scale and coherent anatomy, generous transparent gutters, every paw, mane tip and tail fully contained in its cell. Feet retain a coherent ground plane; supporting paws do not slide. Motion must have real body mechanics, changing silhouettes, anticipation, action and recovery, with delayed mane and tail follow-through; do not repeat a static drawing with only a different mouth.

Transparent isolated character artwork only. No terrain, scenery, UI, captions, numbers, labels, grid lines, checkerboard, cast shadow, logo or watermark. Keep separate dust clouds, sound waves, projectiles and impact graphics off this character sheet; they can be authored as separate effect sheets. Blood already attached to the character and his bloody drool remain part of the design.

Apply the following DIRECTION and ACTION clauses precisely. Keep the camera direction constant unless the action explicitly describes a turning transition. A cyclic action must close its loop; a one-shot action such as defeat must hold its specified final pose instead of returning to life.
```

### Cláusulas de direção

**Direita / `right`:**

```text
DIRECTION: full RIGHT-FACING SIDE PROFILE in every frame. Nose points right, tail extends behind to the left. Show the near limbs clearly and the far limbs partially behind them. Fixed side camera and correct overlap. Keep the specified anatomical wound map, not a newly mirrored arrangement.
```

**Esquerda / `left`:**

```text
DIRECTION: full LEFT-FACING SIDE PROFILE in every frame. Nose points left, tail extends behind to the right. Show the near limbs clearly and the far limbs partially behind them. Fixed side camera and correct overlap. Translate the same anatomical injury map into this opposite view; do not randomly swap the torn ear, diseased eye or wounds.
```

**Frente / baixo / `down`:**

```text
DIRECTION: FRONT VIEW, facing the viewer and the bottom of the battlefield, with the project's slightly elevated orthographic game camera. Two broad forepaws are nearest the viewer; the two hind paws are partly visible behind. Remain a standing four-legged lion, never a seated mascot or upright biped. Maintain this camera and facing throughout the action.
```

**Costas / cima / `up`:**

```text
DIRECTION: REAR VIEW, facing away from the viewer toward the top of the battlefield, with the project's slightly elevated orthographic game camera. Cream hindquarters and hind paws are nearer the viewer; forepaws are farther ahead, partly occluded. The back of the mane is ragged mauve fur with decay and bloody patches, NOT a beige face-shaped panel. No eyes, nose, muzzle, mouth or teeth may appear through the back of the mane. Convey the action through back, shoulders, mane, ears, paws and tail without cheating toward a side/front camera.
```

## 8. Prompts das animações de Rosnaldo

### 8.1 Repouso / respiração — `idle` — cíclica

```text
ACTION: a seamless 12-frame sickly alert IDLE / BREATHING loop. 1 neutral hunched stance; 2 chest begins a shallow inhale; 3 ribs and shoulders subtly expand under intact skin; 4 head lifts a little and damaged ear twitches; 5 mane lags behind that lift; 6 inhalation peak, slow tired blink; 7 chest starts exhaling; 8 shoulders soften and head lowers slightly; 9 tail tip curls with delayed motion; 10 mane settles and eye reopens; 11 body returns toward the initial stance; 12 matches frame 1 seamlessly. Keep all four paws planted and body rooted. Breathing should be restrained, heavy and unhealthy, not a constant full-body squash or a roar. Retain all existing wounds without creating new injuries or showing bones.
```

### 8.2 Caminhada pesada — `walk` — cíclica, material futuro

```text
ACTION: a seamless 12-frame heavy quadrupedal WALK cycle IN PLACE. The lion stays centered; root travel will be supplied by the game. 1 first contact pose; 2 weight transfers onto supporting paws; 3 the trailing hind paw lifts and advances; 4 hind paw passes under the pelvis; 5 it plants while the corresponding forepaw prepares to swing; 6 opposite forepaw passes under the chest; 7 complementary contact pose; 8 opposite weight transfer; 9 other hind paw lifts and advances; 10 it passes and plants; 11 other forepaw finishes its swing; 12 closes into frame 1. Use a coherent staggered four-leg gait with far-side contacts offset, not a human two-leg walk. Supporting paws counter the implied ground travel and do not skate. The heavy chest and hips shift weight; the damaged mane and tail follow with delay. No whole-body hopping and no additional limbs. Preserve a stable ground plane, anatomy and injuries.
```

Este material não autoriza adicionar deslocamento à IA. A implementação futura precisa mover o bloco de 2 × 2 respeitando ocupação e caminho.

### 8.3 Virada no lugar — `turn` — transição, material futuro

Para esta ação, substituir a cláusula de direção fixa por uma transição explícita entre duas vistas adjacentes: direita→frente, frente→esquerda, esquerda→costas, costas→direita e seus inversos. Usar ambas as vistas finais como referências. Não deixar campos abaixo sem preenchimento no envio.

```text
ACTION: a one-shot 12-frame quarter-turn IN PLACE from [START VIEW] to [END VIEW]. These are the only intentional camera-facing changes; the camera itself remains fixed. 1 exact starting stance; 2 eyes/head orient toward the new facing where visible; 3 neck and shoulders begin following; 4 near forepaw unloads; 5 forepaw takes a small pivoting step; 6 chest reaches the intermediate three-quarter orientation; 7 hips follow; 8 one hind paw makes a small repositioning step; 9 other paws settle under the body; 10 head arrives at the final facing while mane still follows; 11 tail and ruff settle; 12 exactly matches the supplied ending-view idle. Turn a complete connected quadruped with weight and occlusion changes, not a flat card rotating or flipping. Keep the body center over the same ground footprint, without enlarging the character or teleporting its paws. Preserve anatomical wound sides through the turn.
```

### 8.4 Mordida — `bite` — ataque implementado, nova arte a preparar

```text
ACTION: a one-shot 12-frame aggressive BITE aimed along the specified facing. 1 alert combat idle; 2 eyes narrow and weight moves back; 3 shoulders crouch and neck retracts; 4 jaw opens in anticipation; 5 hindquarters push and chest starts a short controlled lunge; 6 head and open muzzle extend toward an unseen target; 7 precise bite-contact pose with powerful jaw closure and visible connected yellow fangs; 8 brief compression at contact and mane overshoot; 9 head withdraws and jaw loosens; 10 forequarters return over planted support paws; 11 mane, ears and tail settle; 12 matches the starting combat idle. Four-legged weight and believable neck/jaw articulation, no detached jaw, stretched rubber neck or unsupported flying body. Keep supporting paws grounded; any stepping paw must visibly lift and land. Do not draw a victim or invent additional injuries on Rosnaldo. No floating hit effects on this character sheet. Contact is frame 7, not frame 1.
```

Na integração atual, `bite` dura 1,2 s, com `release=.46` e `impact=.55`, em progresso normalizado. Mapear a pose de contato para esse evento ou ajustar deliberadamente os tempos em conjunto; nunca aplicar dano durante a preparação por conveniência.

### 8.5 Rugido — `roar` — referência atual, regenerar apenas quando necessário

```text
ACTION: the established one-shot 12-frame ROAR cycle. 1 sickly alert idle with slightly open mouth; 2 brow furrows and chin lowers; 3 chest and shoulders descend; 4 deepest crouch with braced paws, closed jaw and compressed mane; 5 chest inhales and mouth begins opening; 6 head and chest rise, jaw opens; 7 peak furious roar with a wide connected hinged jaw, ragged tongue, broken yellow fangs and bloody gums; 8 sustained roar with mane and tail follow-through; 9 release and jaw narrowing; 10 head descends with soft recoil; 11 body and mane settle; 12 returns seamlessly to frame 1. All four paws remain firmly braced; chest, head and mane make substantial readable silhouette changes. From behind, express the roar through raised head/mane/back and expanded chest without showing the face through the mane. Keep the current wounds and blood; no exposed bones. Sound waves, detached spit and dust belong on separate effect sheets.
```

Referência existente: 12 quadros, 150 ms cada. No vetor atual: duração 1,8 s, `release=.47`, `impact=.55`. `Rugido distante` usa a mesma família de animação; não criar um poder diferente sem pedido.

### 8.6 Receber golpe — `hit` — reação física

```text
ACTION: a one-shot 12-frame PHYSICAL HIT REACTION, while keeping the specified facing. The incoming force pushes backward relative to that facing. 1 combat idle just before contact; 2 sudden contact compression and startled eyelid; 3 head and chest recoil while support paws grip; 4 peak stagger with a short backward weight shift; 5 mane overshoots the head; 6 one balancing paw may lift slightly; 7 that paw plants and catches the body's weight; 8 chest begins returning; 9 head recovers without changing identity or direction; 10 tail and mane settle; 11 return near idle; 12 matches combat idle. Clear recoil and recovery, not a jump or a full knockdown. Existing wounds remain attached to their anatomical locations. No new wound growth, exposed bones, dismemberment, external weapon or drawn attacker. Blood flashes and impact particles should be separate effects so repeated hits do not permanently redraw the character.
```

### 8.7 Receber ácido — `hit-acid` — variante de reação, não novo efeito de regra

```text
ACTION: a one-shot 12-frame ACID PAIN REACTION. 1 combat idle; 2 flinch at contact from ahead; 3 eyelids squeeze and chin recoils; 4 shoulders tense and chest compresses; 5 head pulls back and turns only slightly within the specified view; 6 peak pained body tension with one forepaw briefly unweighted; 7 paw returns to support; 8 chest releases the tension; 9 eyes reopen with a mean exhausted expression; 10 head returns; 11 mane settles; 12 matches idle. Keep the same four-legged anatomy, existing necrotic wound map and constant scale; do not melt away the body, add bones, reveal organs, grow new lesions or change the camera. Do not paint acid over the character on this sheet: the acid projectile, splash and temporary color flash are separate effect layers.
```

É uma proposta visual compatível com os golpes de Bolota; não adicionar dano contínuo, redução de defesa ou outra regra de ácido automaticamente.

### 8.8 Dor por sangramento — `bleed-tick` — reação curta

```text
ACTION: a restrained one-shot 12-frame BLEEDING PAIN TICK. 1 combat idle; 2 momentary discomfort in the face where visible; 3 shoulders tighten; 4 head dips and torso contracts slightly around the existing injuries; 5 brief peak shudder; 6 mane gives a small delayed tremor; 7 tension releases; 8 chest exhales; 9 head rises; 10 tail settles; 11 near idle; 12 returns exactly to idle. Keep all four paws planted, remain readable without a large lunge, and preserve every existing wound's shape and location. Do not enlarge the wounds, add fresh anatomical damage or include bones. Detached blood droplets, the damage number and bleeding status indicator belong to separate overlays. This is not a new attack, a roar or a death animation.
```

### 8.9 Quase caindo / desequilíbrio — `stagger` — material futuro

```text
ACTION: a one-shot 12-frame HEAVY STAGGER WITH RECOVERY. 1 combat idle; 2 sudden loss of balance; 3 head and chest recoil; 4 forequarters sag; 5 one front knee bends toward the ground while the other forepaw bears weight; 6 deepest unstable pose, still anatomically connected; 7 hind paws brace and catch the body; 8 shoulders push upward; 9 the bent foreleg extends and plants; 10 head regains the specified facing; 11 mane and tail settle; 12 returns to idle. Distinguish this from the short hit reaction through a larger weight shift and visible recovery effort. Do not actually die, split limbs, expose bones, change wounds or leave the grid cell. Keep the ground plane and fixed camera clear.
```

Não adicionar atordoamento, perda de turno ou estado de pouca vida por causa dessa prancha. Ela é material futuro até haver pedido de comportamento.

### 8.10 Derrota / queda — `death` — sequência única, último quadro sustentado

```text
ACTION: a one-shot 12-frame DEFEAT / COLLAPSE, not a loop. 1 wounded combat stance; 2 exhaustion and softened eyes; 3 head droops; 4 forelegs buckle; 5 chest lowers toward the ground while hind legs still support; 6 front of the body contacts the ground; 7 hips sink and hind legs fold; 8 the heavy connected body settles into a coherent prone or slightly side-resting pose along the specified facing; 9 head rests and jaw relaxes; 10 mane and tail fall with gravity; 11 final small settling motion; 12 completely still defeated pose. Hold frame 12; never stand up, respawn or snap back to idle at the end. Keep all four limbs accounted for, correct body volume, attached head/jaw and sufficient cell margin for the horizontal collapse. Preserve the current blood and rot; do not dismember, expose bones or organs, explode or create a detached blood pool on this character sheet.
```

Na integração, segurar a última pose até o fluxo de resultado decidir esconder/reiniciar. Reiniciar deve limpar a derrota e restaurar repouso; não reaproveitar uma transformação deformada como pose-base.

### 8.11 Entrada / despertar — `entrance` — material futuro

```text
ACTION: a one-shot 12-frame GROTESQUE AWAKENING / ENTRANCE IN PLACE. 1 low dormant crouch with closed or nearly closed eyes; 2 a shallow breath moves the chest; 3 damaged ear twitches; 4 eyes open where visible; 5 front paws press into the ground; 6 shoulders rise; 7 hindquarters extend and support the torso; 8 head lifts into the specified direction; 9 mane swings with delayed weight; 10 jaw makes a small threatening movement; 11 tail and ruff settle; 12 reaches the established alert combat idle. Same undead lion throughout; no magical transformation, emerging bones, new wounds, smoke, terrain or camera movement. Keep this separate from a roar and leave all atmospheric effects to another sheet.
```

### 8.12 Vitória do boss / ameaça — `victory` — material futuro

```text
ACTION: a one-shot 12-frame MEAN VICTORY / THREATENING SETTLE. 1 combat idle; 2 eyes narrow toward the battlefield; 3 chest rises deliberately; 4 head tilts up slightly without changing facing; 5 lips curl to reveal the existing broken yellow fangs; 6 peak smug threatening pose with grounded paws; 7 small jaw closure; 8 tail gives a delayed heavy sweep; 9 mane follows; 10 head lowers into the established menacing stance; 11 body settles; 12 holds a stable alert idle compatible with the starting pose. Grotesque and exhausted, not a smiling handsome mascot. No full roar, walking offscreen, new injuries, exposed bones or added victims. Preserve the exact wound map and anatomical construction.
```

## 9. Contexto de animação dos aliados para próximas tarefas

Bolota foi substituído por Graxinin na equipe ativa. Os prompts de Bolota abaixo ficam preservados como histórico; não aplicar papo, salto, cuspe ou xixi ao guaxinim.

Os prompts detalhados acima são de Rosnaldo. Para os aliados, manter a identidade dos SVGs originais e produzir uma referência PNG específica antes de usar a linguagem visual de uma nova prancha. **Não aplicar automaticamente a podridão e as feridas do leão em todos os personagens.** Preservar as peculiaridades já desenhadas em cada um.

Base a acrescentar aos pedidos dos aliados:

```text
Create a transparent PNG 12-frame animation sheet in a precise 4-column by 3-row grid for the EXACT SAME supplied Bichos do Brejo character. Preserve species, original proportions, distinctive ears/eyes/muzzle/teeth, scars, markings, palette and thick irregular charcoal outlines. Use the supplied character image as identity reference, not Rosnaldo's anatomy or wounds. Fixed specified direction and camera, whole body inside each equal cell, constant scale and coherent ground plane. Show anticipation, action, recovery and secondary motion, with limbs and facial features attached. No extra limbs, scenery, UI, grid, labels or watermark. Respect the no-exposed-bones rule. Keep mutation attachments on their correct anatomical parts if present in the reference, but do not add mutations not requested. Apply the character action brief below; cyclic movement closes its loop, while defeat holds its final pose.
```

| Personagem / ação | Roteiro para desenvolver a prancha |
| --- | --- |
| Farrapo / repouso | Respiração nervosa, piscada assimétrica, tremor na orelha alta, atraso na orelha caída; patas firmes. |
| Farrapo / salto | Agachar com pés apoiados → impulso → voo com pernas recolhidas → extensão para pouso → contato → compressão e recuperação. Movimento do corpo na cena fica separado do ciclo em PNG. |
| Farrapo / coice | Preparar transferindo peso para a perna de apoio → recolher perna de ataque → estender em direção ao alvo → contato → recolher e recuperar; não transformar o coice em soco. |
| Farrapo / rajada | Desespero e preparação → orientar a traseira para o alvo → sequência de contrações/recuos → fim da rajada → alívio. Não mostrar o rosto através da vista de costas. Corpo e 10 projéteis são camadas separadas. |
| Fusível / repouso | Respiração contida, focinho farejando, olhos desconfiados, cauda ondulando com atraso. |
| Fusível / passada | Alternar apoios e balanço das duas pernas, contrabalançar braços e cauda; pé apoiado não escorrega. Preservar a postura própria do rato, sem copiar a marcha quadrúpede de Rosnaldo. |
| Fusível / sucata | Recolher peso e levantar braço → preparar arremesso → acelerar braço → liberar sucata pela mão → acompanhar → recuperar. Raiva durante a ação. |
| Fusível / corte de sucata | Mesmo encadeamento de arremesso, com gesto mais incisivo. Sucata cortante, impacto e sangramento em camadas separadas; não transformar em ataque corpo a corpo sem pedido. |
| Bolota / repouso | Papo infla/desinfla, olhos salientes com movimentos discretos independentes, postura larga e baixa. |
| Bolota / salto | Agachar → estender pernas traseiras → voo com membros recolhidos → preparar apoio → pousar e comprimir → voltar ao repouso. |
| Bolota / cuspe ácido | Inflar papo → preparar boca → abrir → liberar ácido pela boca → recuo e esvaziamento do papo → recuperação. Não fazer projétil nascer no centro do corpo. |
| Bolota / xixi ácido | Expressão relaxada desde o início, ajuste legível da postura e do membro correto → emissão → pequena recuperação e alívio; sem enquadramento sexualizado. Jato e efeitos separados do corpo. |
| Todos / receber golpe | Contato → compressão → recuo → recuperação de apoio → volta ao repouso; conservar a direção e as marcas. |
| Todos / derrota | Perda de sustentação própria da espécie → queda com membros conectados → repouso no chão → último quadro sustentado. |

## 10. Critérios para considerar uma entrega concluída

- PNGs e quadros salvos no projeto, com transparência real e sem cortes.
- Quatro direções coerentes, identidade reconhecível, proporções e anatomia estáveis, sem ossos expostos.
- Feridas e marcas não piscam nem mudam de lado entre os quadros; vistas de costas não mostram o rosto.
- Animação observada em movimento, com peso, apoios e movimento secundário; contato, emissão e recuperação distinguíveis.
- Prévia entregue ao usuário por imagem/GIF ou visualizador, acompanhada dos arquivos acessíveis.
- Manifesto descreve ação, vistas, quadros, duração, eventos e estado de integração. Prompts e referências usados ficam registrados.
- Se a tarefa incluir vetor: verificar no jogo e informar o que foi de fato integrado. Se incluir só PNG/prompts: não alterar mecânicas ou declarar integração vetorial.
- Atualizar este contexto quando o usuário mudar decisões visuais ou de fluxo; a correção mais recente do usuário prevalece sobre prompts históricos.
