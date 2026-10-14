# Widget Privado Kommo CRM - Kommo Voice Hub

Este widget adiciona o botão nativo **"Ligar pelo WhatsApp"** dentro do cartão de Leads e Contatos do Kommo CRM.

## Como Instalar no Kommo

1. Compacte os arquivos `manifest.json`, `script.js` e `style.css` em um arquivo `.zip`:
   ```bash
   cd widget && zip -r ../kommo-voice-widget.zip *
   ```
2. No painel do seu Kommo CRM, acesse:
   **Configurações → Integrações → Criar Integração**.
3. Na aba **Widget**, faça o upload do arquivo `kommo-voice-widget.zip`.
4. Configure a URL do seu SaaS (ex: `https://seu-dominio.com` ou seu túnel ngrok para testes locais).
5. Salve e ative o widget. Ao abrir qualquer cartão de lead com telefone, o painel de discagem aparecerá automaticamente.
