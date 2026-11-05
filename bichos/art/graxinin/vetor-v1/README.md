# Graxinin — vetor articulado integrado

Graxinin substitui Bolota no terceiro lugar da equipe. A implementação nativa usa paths e elipses de `dist/graxinin-art.js`, convertidos em geometria pelo renderizador vetorial já existente no jogo. Não há textura PNG no desenho do personagem.

Referências preservadas: `../referencia-do-usuario.png` (concept completa) e `../arremesso-v1/referencia-aprovada.png` (prancha aprovada pelo usuário).

Quatro vistas; perfil direito com olho arregalado, esquerdo com olho semicerrado; costas sem rosto. Cabeça e rosto compartilham o mesmo conjunto de articulação. Cauda, orelhas, pernas e braços possuem pivôs próprios. Tampa permanece nas costas e não concede defesa adicional.

- Vida: 24; iniciativa: 6; movimento: 3 casas.
- Lata amassada: 8 de dano, alcance 3.
- Garrafada: 12 de dano, alcance 3, custo 6 de mana; sangramento de 3 por 3 turnos do alvo. Reaplicar renova a duração sem empilhar.
- Arremesso: 1,2 s; soltura em 50% (600 ms), impacto em 76% (912 ms). Dano e gasto de mana seguem a confirmação de impacto existente no combate.

`quadros/` contém prévias SVG das seis animações: repouso, caminhada, arremesso, garrafada, dano e derrota. São 30 poses por ação e vista, calculadas pelas mesmas funções de animação que o jogo usa. GIFs/PNGs são derivados para revisão. `index.html` permite pausar, selecionar poses e alterar a velocidade. A derrota no visualizador reinicia para facilitar revisão; no jogo a queda termina antes de o aliado ser ocultado, e reiniciar restaura o personagem.

Verificação: geometria nativa sem texturas; 24 combinações de ataque × vista × velocidade; pausa, momento de impacto, dano, mana, sangramento, caminhada, queda e reinício. Relatórios em `.openai/graxinin-review/`. Os testes de regras também cobrem a renovação do sangramento da garrafa.
