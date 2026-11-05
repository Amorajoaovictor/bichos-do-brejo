# Leãozinho de Rosnaldo

Implementado em PNG em 02/11/2026, a partir do estudo aprovado em `../concept-v1/quatro-vistas.png` e da referência original preservada em `../referencia-do-usuario.png`.

Prévia: [quatro vistas e animações](http://127.0.0.1:4173/art/leaozinho/png-v1/index.html). Combate: [Rosnaldo](http://127.0.0.1:4173/?encontro=rosnaldo).

Cada filhote ocupa uma casa, tem 10 de vida, iniciativa 7, movimento de até 3 casas e Mordidinha de 3 de dano com alcance 1. Rosnaldo invoca até dois no lugar de atacar, em casas livres junto dele; começa no primeiro turno e pode repetir após três turnos desde a última invocação, desde que nenhum filhote esteja vivo. Sem espaço, ataca normalmente. Vitória exige derrotar todos; reiniciar remove os filhotes.

São nove desenhos por direção: repouso, respiração, duas passadas, preparação e contato da mordida, dano, queda e derrota. A ação de mordida dura 0,85 s e aplica dano no contato em 56% (0,476 s). Aparição dura 0,45 s; derrota dura 1,05 s e mantém o último desenho. Sangramento usa a reação de dano.

`movimentos.png` e `reacoes.png` são originais preservados. `quadros/` contém 36 PNGs transparentes de 512 × 512. Cada GIF compara as quatro direções. `manifest.json` registra escala, cortes, alinhamentos e tempos; `prompts.md` guarda os prompts da geração integrada de imagens.

Gerar derivados: `node .openai/build-lion-cub-preview.mjs`, na pasta `bichos/`. Verificar fluxo: `node .openai/verify-lion-cub.mjs`, com o servidor local iniciado. Os resultados e capturas ficam em `.openai/lion-cub-review/`.
