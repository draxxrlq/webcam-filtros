# filtro no espaço da mao

Projeto em HTML/JS puro que usa a câmera do notebook + detecção de mãos
(MediaPipe Hands) pra aplicar um filtro de vídeo só dentro do "quadro" que
você forma com os dedos — sem desenhar pontos ou linhas na mão, só o efeito.

## Como funciona

- Cada mão detectada contribui com 2 pontos: a ponta do **polegar** e a
  ponta do **indicador**.
- Com **duas mãos**, os 4 pontos formam um quadrilátero (o "quadro" que
  você monta, tipo enquadrando uma foto).
- Com **uma mão só**, o polegar e o indicador viram os dois cantos opostos
  de um retângulo.
- O filtro escolhido nos botões é aplicado *só* dentro dessa área; o resto
  da tela continua mostrando o vídeo normal.

## Como rodar

Navegadores bloqueiam a webcam em arquivos abertos direto (`file://`), então
é preciso servir a pasta por http. Duas opções simples:

**Com Python (já vem em qualquer distro Linux/Mac, e no Windows se instalado):**
```bash
cd hand-filter-project
python3 -m http.server 8000
```
Depois abra `http://localhost:8000` no navegador.

**Com Node (se preferir):**
```bash
cd hand-filter-project
npx serve .
```

> Precisa de internet na primeira vez que abrir, porque a biblioteca de
> detecção de mãos (MediaPipe) é carregada de um CDN. Depois disso o
> navegador costuma cachear os arquivos.

Ao abrir, o navegador vai pedir permissão de câmera — aceite. Depois é só
mostrar a mão (ou as duas) formando o quadro e trocar de filtro nos botões:

- **normal** — sem efeito
- **inverter** — cores invertidas (tipo raio-x)
- **p&b** — preto e branco
- **termal** — paleta de câmera térmica
- **pixelado** — mosaico
- **sépia** — tom antigo
- **contornos** — detecção de bordas (Sobel)

## Arquivos

- `index.html` — estrutura da página e botões de filtro
- `app.js` — câmera, detecção de mão e lógica do recorte (clip)
- `filters.js` — os efeitos visuais em si, cada um numa função separada

## Ideias pra evoluir

- Trocar o filtro automaticamente conforme o tamanho do quadro (mão mais
  aberta = filtro mais "forte")
- Detectar um gesto específico (tipo os dois polegares e indicadores
  formando um "L" duplo) antes de ativar o recorte, pra não aplicar filtro
  toda hora que a mão aparece
- Gravar o resultado em vídeo (`MediaRecorder` no canvas)
