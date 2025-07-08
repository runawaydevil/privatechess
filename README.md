# ♟️ Private CHESS

Private CHESS é um jogo de xadrez online para dois jogadores, totalmente anônimo, seguro e sem coleta de dados.

## Funcionalidades
- Jogo de xadrez em tempo real para 2 jogadores
- Atribuição automática de cor (brancas/pretas)
- Histórico de movimentos e estatísticas
- Timer individual para cada jogador
- Botão para desistir da partida
- Overlay animado de vitória
- Layout responsivo
- Aviso de privacidade: não coletamos nenhum dado dos jogadores

## Privacidade e Segurança
- **100% anônimo:** Nenhum dado pessoal é solicitado ou armazenado
- **Sem cadastro ou login**
- **Sem histórico persistente**
- **Comunicação segura** (recomenda-se rodar atrás de HTTPS em produção)

## Instalação
1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/privatechess.git
   cd privatechess
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   node server.js
   ```
4. Acesse no navegador:
   - [http://localhost:8743](http://localhost:8743)

## Estrutura
- `server.js` — Backend Node.js com Express e Socket.IO
- `public/` — Frontend (HTML, JS, CSS, imagens)
- `public/baby.gif` — GIF exibido ao vencer

## Como jogar
1. Abra dois navegadores em `http://localhost:8743`
2. Clique em "Iniciar jogo" em ambos
3. Jogue normalmente, use o botão "Desistir" se quiser encerrar

## Créditos
Desenvolvido por [Pablo Murad (runawaydevil)](https://github.com/runawaydevil)

---

> 🔒 Private CHESS: Este jogo é seguro, privado e não coletamos nenhum dado dos jogadores. 