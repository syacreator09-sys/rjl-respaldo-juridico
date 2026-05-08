# Aviso de fin por Telegram

Para enviar un mensaje cuando terminen las pruebas locales hace falta:
- `bot token`
- `chat_id`

## Obtener `chat_id`
1. Habla con tu bot en Telegram y enviale `/start`.
2. Consulta `getUpdates` con el token.
3. Toma el `chat.id` de la conversacion correcta.

## Script local
Se dejo el script:
- `scripts/send-telegram-message.ps1`
- `scripts/get-telegram-updates.ps1`

Mensaje corto recomendado para iniciar prueba del cliente:
`Cano Digital: el bot ya esta listo para prueba. Puedes iniciar el test cuando quieras.`

Si el bot corre con `scripts/telegram-bot-polling.mjs`, ese mensaje se manda automaticamente cuando el cliente escribe `/start`.

Ejemplo:
```powershell
powershell -ExecutionPolicy Bypass -File .\projects\chatbot-juridico-ai\scripts\send-telegram-message.ps1 `
  -BotToken "TU_TOKEN" `
  -ChatId "TU_CHAT_ID" `
  -Message "Prueba local terminada. Ya puedes revisar el chatbot juridico."
```

No se integra automaticamente hasta tener `chat_id`.
