# Bichos do Brejo

Jogo tático por turnos em que Farrapo, Fusível e Graxinin enfrentam os bichos de uma clareira e depois encaram Rosnaldo, o Rei do Brejo.

## Como jogar

Com o Node.js instalado, abra a pasta `bichos` e execute:

```sh
npm start
```

Abra [o jogo no navegador](http://127.0.0.1:4173). No Windows, também é possível abrir `Iniciar jogo.bat` na mesma pasta. O jogo usa as dependências incluídas no repositório.

| Tecla | Ação |
| --- | --- |
| **V** | Mover |
| **A** | Ataque básico |
| **Q** | Habilidade |
| **B** | Interagir com pedras e troncos |
| **E** | Passar o turno |
| **Esc** | Cancelar seleção |
| **Espaço** | Pausar ou retomar |

O código fica em `bichos/dist`, os desenhos e animações em `bichos/art`, e os testes em `bichos/tests`. Dentro de `bichos`, execute `npm run check` para validar a sintaxe e `npm test` para rodar os testes.
