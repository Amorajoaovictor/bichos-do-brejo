# Correção do rosto de Graxinin

O usuário rejeitou o rosto da primeira integração: a reconstrução manual alongou as orelhas, mudou o contorno da cabeça e perdeu a expressão aprovada. A comparação registra a referência, a primeira versão e a correção.

O novo desenho usa curvas vetoriais traçadas dos primeiros quadros aprovados de `../arremesso-v1/quadros/`, com paleta plana, simplificação controlada e suavização dos contornos. As quatro vistas vêm das respectivas referências; o perfil esquerdo conserva o olho semicerrado e o direito conserva o olho arregalado. A vista traseira não contém rosto.

Os paths nativos estão em `dist/graxinin-face-v2.js`. São aplicados por `graxininParts()` tanto no retrato quanto no personagem. Os olhos possuem pivôs individuais; focinho, dentes e orelhas acompanham o crânio. Os PNGs desta pasta e os GIFs de `../vetor-v2/` são prévias derivadas; o personagem usa geometria vetorial, sem imagem embutida.

Gerador: `.openai/build-graxinin-face-v2.mjs`. Comparação: `.openai/compare-graxinin-face.mjs`. As mecânicas de lata, garrafa e sangramento permanecem as mesmas.
