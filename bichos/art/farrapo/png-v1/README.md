# Farrapo — quatro vistas em PNG

Etapa iniciada em 02/11/2026 com a ferramenta integrada de geração de imagens. O usuário aprovou a prancha e pediu a implementação completa. Farrapo está integrado ao jogo com 96 PNGs transparentes, quatro direções e retratos derivados dos mesmos desenhos.

- `quatro-vistas.png`: prancha atual, após correção da orientação frontal. Fundo com canal alfa, 1312 × 1199 pixels.
- `quatro-vistas-estudo-v1.png`: primeira geração preservada; frente ligeiramente em três quartos.
- `prompt.md`: referências e instruções de geração/revisão.

Ordem da prancha: perfil direito no alto à esquerda; perfil esquerdo no alto à direita; frente embaixo à esquerda; costas embaixo à direita. Os lados preservam olhos diferentes e a cicatriz aparece no perfil aprovado, sem simples espelhamento.

`index.html` contém repouso, salto, coice, rajada, dano, sangramento e derrota. Permite pausar, mudar velocidade, escolher o ponto da animação e inspecionar os 24 desenhos por vista. Usa o mesmo renderizador e a mesma seleção de quadros do jogo. A derrota segura o último quadro; sangramento reutiliza a reação a dano.

A rajada tem 2,3 s de ação e mais 1,8 s mostrando a expressão de alívio antes de repetir na prévia e nos GIFs. O jogo mantém a mesma duração de alívio no personagem e no retrato. Os desenhos do rosto e os dois incisivos são preservados.

`quadros/` contém os 96 PNGs de 512 × 512, alinhados à linha de apoio y=480. São quatro desenhos de cada uma das seis ações por direção. A rajada amostra os dois desenhos de esforço pelas dez contrações de `barragePulse`, mantém os olhos fechados e usa a curva gradual de `barrageFlush`. A cor da cabeça é aplicada sobre o próprio PNG, também no retrato e na vista traseira.

Pranchas originais: `prancha-right.png`, `prancha-left.png`, `prancha-down.png`, `prancha-up.png`. A primeira prancha traseira está preservada como `prancha-up-estudo-v1.png`. `contracao-costas.png` substitui somente a segunda pose de esforço traseira para manter a orelha erguida. As revisões foram geradas pela ferramenta integrada, sem redesenhar o personagem em vetor.

Prévia animada: `animacoes-quatro-direcoes.gif` e `rajada-quatro-direcoes.gif`. Metadados em `manifest.json`; resultado dos testes do navegador em `verificacao.json`. Gerador: `../../../.openai/build-rabbit-png.mjs`; verificação: `../../../.openai/verify-rabbit-png.mjs`.
