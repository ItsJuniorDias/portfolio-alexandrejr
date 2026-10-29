# Código em Cena

Portfólio de Alexandre Junior com React, PixiJS 8, Framer Motion e Tailwind CSS. O cenário usa as animações do filme aprovado; cabeçalho, placa curva, cards, navegação, currículo e recomendação são renderizados por código.

## Executar

```sh
npm install
npm run dev -- --port 5173 --strictPort
```

Abra http://127.0.0.1:5173/. O servidor é local e não publica o site na internet.

## Verificar

```sh
npm run lint:fix
npm run format
npm run lint
npm run format:check
npm test
npm run build
npm run test:e2e
```

`npm run test:e2e` gera o build de produção, serve com `vite preview` e roda o Playwright em desktop (1440 × 900), laptop (1024 × 768) e mobile (Pixel 7) usando o Google Chrome instalado, que decodifica o H.264 do filme. `npm run test:e2e:prod` roda a mesma suíte contra https://portfolio-alexandrejr.vercel.app; o primeiro teste falha se o deploy servir o ponteiro do Git LFS no lugar do vídeo.

O teste da mídia usa `ffprobe`. O vídeo tem 2.880 quadros, 24 fps e 120 segundos. O export de 1920 × 984 amplia o original de 720p, retirando a faixa do cabeçalho; não acrescenta detalhes nativos de uma filmagem em 1080p.

## Composição

- `src/pixi/FilmStage.tsx`: textura do vídeo, quatro faixas do cenário, resolução de até 2×, câmera e descarte de recursos. Menus e botões o controlam por `src/lib/film-navigation.ts`.
- `src/lib/film-camera.ts`: enquadramento `contain`, palco apoiado na borda inferior, câmera e velocidade. A rolagem define o destino e o filme o percorre a 1×, em ambos os sentidos. Ao atingir o destino, congela. Os botões percorrem as cenas a 1,5×, sincronizando a rolagem. Rolar manualmente, tocar, usar as teclas de navegação ou pressionar Parar devolve o controle ao visitante. A preferência de movimento reduzido usa navegação direta.
- `src/styles-mobile.css`: composição mobile em Tailwind, com vídeo em `cover` vertical e cards menores sobre a cena. O cabeçalho recolhe nos trechos de imersão e o cenário ocupa toda a largura e altura da tela. Controles têm áreas de toque de 44 px; cartas longas permitem rolagem interna em telas baixas. O vídeo e a linha do tempo são os mesmos do desktop, que mantém `contain`.
- `src/lib/film-loader.ts`: inicialização compatível com políticas de mídia do Safari. Espera somente um frame decodificado do MP4, sem o teste auxiliar de transparência WebM do Pixi. Tenta reprodução muda e inline para ativar o decoder, pausa antes de entregar ao scroll e oferece toque para iniciar quando necessário. Carregamentos interrompidos têm cancelamento, prazo de 30 segundos e opção de tentar novamente.
- `src/components/FilmCards.tsx`: cards HTML com texto selecionável e transições Framer Motion. Seguem o quadro apresentado, inclusive ao voltar o scroll, sem descer sobre a barra de controles.
- `src/components/StageTitle.tsx`: texto SVG curvo na placa. A posição acompanha o movimento registrado em `src/data/stage-title.json`.
- `src/components/Program.tsx`: currículo completo e indicação integral em um diálogo acessível.
- `src/data/portfolio.ts` e `curriculum.json`: conteúdo extraído do material disponibilizado pelo autor.
- `public/assets/film/codigo-em-cena-no-text.mp4`: filme usado no site, sem as placas de texto e com limpeza das inscrições identificadas nos cenários.
- `public/assets/film/stage-poster-no-text.webp`: quadro inicial (173 KB, pré-carregado) com o mesmo enquadramento do vídeo, evitando cabeçalho duplicado durante o carregamento. O `.png` ao lado é a fonte.
- `public/assets/film/layers/manifest.json`: 46 recortes de pixels do vídeo original, com quadro e retângulo de origem. São recortes retangulares com o contexto visível; não recuperam áreas ocultas nem têm transparência semântica.

A câmera é uma transformação 2D do filme. O movimento de profundidade original continua na animação; o site não inventa geometria 3D para o cenário. Os componentes anteriores em `src/scene` são estudos preservados e não entram na experiência ativa.

## Preparação da mídia

`work/clean-film/stage-arguments.json` registra os clipes e filtros de montagem sem as placas. `work/text-audit/scan.swift` identifica inscrições com Vision; `scripts/clean-video-text.mjs` aplica a limpeza ao vídeo e gera os pontos de acompanhamento da placa. Os registros de revisão ficam em `work/text-audit`. A limpeza usa interpolação local da textura e não altera o MP4 original fornecido pelo autor.
