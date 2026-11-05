# Farrapo — teste completo de mutações em camadas PNG

**Estudo encerrado em 02/11/2026.** O usuário avaliou o custo de produção e decidiu manter sprites completos em PNG, sem continuar as animações por peças. Esta pasta é somente um registro histórico; a recomendação de produção abaixo foi descartada.

Estudo visual solicitado em 02/11/2026. **Não integrado ao combate**. O Farrapo atual, os quadros anteriores e as regras foram preservados.

Abra, com o servidor local do jogo ligado: [visualizador](http://127.0.0.1:4173/art/farrapo/mutacoes-camadas-v1/index.html).

Prévia animada da rajada: `rajada-camadas.gif` (42 quadros, 4,2 s, com alívio). Capturas das sete ações, inspeção de camadas e quatro vistas em `previas/`. Resultado das verificações em `verificacao.json`.

## Estrutura

- 28 PNGs normais: cabeça com orelhas, tronco, braço direito, braço esquerdo, perna direita, perna esquerda e cauda, nas quatro vistas.
- 28 PNGs de teste: chifre, tronco com carapaça, braços com garras, pernas robustas e cauda espinhosa, nas quatro vistas.
- 16 cabeças alternativas: preparação, esforço, alívio e derrota, nas quatro vistas.
- Pelagem é uma transformação de cor compartilhada pelas peças; preserva o contorno e evita tingir os traços pretos e as partes rosadas. Tons creme muito claros também são preservados para manter olhos e dentes claros.
- `originais/` preserva as três pranchas PNG geradas com a ferramenta integrada de imagens. `pecas/` contém somente recortes transparentes derivados.
- `rig.js` articula e sobrepõe os próprios PNGs; não redesenha o personagem com SVG, paths ou geometria vetorial.
- `manifest.json` descreve peças, tempos, vistas e estado de integração. Prompts completos em `prompts.md`.

## O que testar

Os três personagens são, da esquerda para a direita: PNGs completos atuais; montagem normal; montagem com a combinação selecionada. As duas montagens usam a mesma pose e o mesmo tempo. Os quadros completos servem como comparação visual; não são a fonte de movimento do novo rig.

Há oito escolhas independentes, uma para cada parte: cabeça, tronco, dois braços, duas pernas, cauda e pelagem. Os exemplos foram escolhidos para demonstrar combinações; não são uma lista de mutações aprovada para o jogo e não concedem atributos.

O visualizador tem sete ações (repouso, salto, coice, rajada, dano, sangramento e derrota), quatro vistas, pausa, velocidade, tempo exato, camadas separadas, inspeção de uma parte, encaixes, combinação aleatória e retorno à aparência normal. A rajada mantém o esforço durante as dez contrações e sustenta 1,8 s de alívio. Derrota não repete a ação automaticamente.

## Limites do estudo

Este é um **teste de PNGs articulados**, não a separação exata dos 96 quadros existentes. Recortar imagens completas não recupera as áreas ocultas de cada parte; por isso foram criadas peças completas, incluindo margens que ficam escondidas durante a montagem.

Articulação, rotação e sobreposição resolvem a troca independente das partes. O desenho em cada ação complexa ainda precisa de acabamento específico: pernas dobradas/estendidas no coice, membros recolhidos no salto, orelhas com movimento próprio e queda desenhada. Não tratar o rig desta prévia como substituto final da qualidade das animações atuais.

A recomendação apresentada durante o estudo foi **PNGs em camadas por pose**: preservar os encaixes e acrescentar desenhos próprios das partes quando a silhueta ou a perspectiva mudar. **O usuário descartou essa abordagem**; a direção atual é manter sprites completos em PNG.

## Reprodução

Na pasta `bichos/`, execute `node .openai/build-rabbit-layers.mjs` para recortar novamente as três pranchas e reconstruir o manifesto. Os recortes medem as calhas transparentes; a geração não produziu linhas com alturas iguais.

`node .openai/verify-rabbit-layers-assets.mjs` confere transparência, medidas, poses, esforço/alívio e retenção da derrota. A inspeção de interface foi feita no navegador, com capturas reais. `export-rabbit-layers-gif.mjs` monta o GIF a partir das capturas já salvas; não abre nem controla o navegador.
