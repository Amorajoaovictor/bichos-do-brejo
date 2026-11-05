# Leãozinho — estudo inicial em quatro vistas

Data: 02/11/2026. Ferramenta: geração integrada de imagens (`image_gen`), com fundo transparente.

Pedido: criar um leãozinho para ser invocado por Rosnaldo, a partir da referência do usuário.

Referência preservada em `../referencia-do-usuario.png`. Resultado em `quatro-vistas.png`: direita e esquerda na linha superior; frente e costas na linha inferior. Esta etapa entrega o desenho para avaliação visual; animações, atributos e a mecânica de invocação ainda não foram implementados.

## Prompt utilizado

```text
Use case: stylized-concept. Asset type: transparent PNG four-view character turnaround for the tactical game Bichos do Brejo.
Input image 1 is an identity and style reference only: preserve THIS EXACT grumpy diseased lion cub, intended as a small summoned minion of Rosnaldo.
Create a polished 2-by-2 evenly spaced turnaround sheet, exactly four full-body drawings of the SAME lion cub in a neutral standing quadruped idle pose. Top left = strict RIGHT profile facing right (only one eye visible); top right = strict LEFT profile facing left (only one eye visible); bottom left = direct FRONT view with both eyes; bottom right = direct REAR view, without any visible face. These are four camera directions, NOT the four different actions in the reference. Keep same character scale and generous transparent gutters; whole bodies, paws, ear tips and tails must fit within each quadrant.
Match reference identity closely: oversized round cub head, short muzzle, rounded ears with red wounded interiors, large heavy-lidded angry ivory eyes, very thick black slanting brows, tiny reddish nose, a small slightly open grumpy mouth with a couple of irregular yellow milk fangs and small dark red drool, prominent spiky dusty-rose/mauve mohawk, NO adult mane, sandy cream fur, small stocky juvenile body, short sturdy legs with large rounded paws, pale chest tuft, long curling thin tail with mauve tuft. Muted gray-olive scabby patches and small blood-red scratches on fur, cartoon decay, consistent anatomical markings across views (not indiscriminate mirror copies).
Style: exactly the reference's polished hand-drawn grotesque cartoon game art, bold dark charcoal outlines, restrained warm cel shading, flat muted palette, readable silhouette. Grumpy, unsettling yet funny. No exposed bones, no exposed organs, no dismemberment, no realistic gore. No scenery, grass, ground plane, drop shadows, labels, text, borders, checkerboard drawing or watermark. REAL transparent background with clean alpha. This is a character model sheet, not a gameplay screenshot.
```
