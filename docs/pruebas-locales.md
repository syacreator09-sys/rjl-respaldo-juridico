# Pruebas locales

## 1. Regenerar chunks
```powershell
node .\projects\chatbot-juridico-ai\scripts\chunk-legal-text.mjs
```

## 2. Consultar base legal sin n8n ni Telegram
```powershell
node .\projects\chatbot-juridico-ai\scripts\query-local-knowledge.mjs "me quieren detener y no se que derechos tengo"
node .\projects\chatbot-juridico-ai\scripts\query-local-knowledge.mjs "como funciona la pension alimenticia"
node .\projects\chatbot-juridico-ai\scripts\query-local-knowledge.mjs "incumplimiento de contrato civil"
```

## 3. Validar que el router no mezcle materias
La salida debe incluir:
- materia detectada,
- snippets recuperados,
- articulos citados,
- y advertencia cuando el caso requiere abogado humano.

## 4. Cuando conectar Telegram
Solo despues de que el retrieval local sea razonable y de contar con el `chat_id`.

Orden recomendado:
1. validar chunks,
2. validar consultas locales,
3. levantar servidor local y probar HTTP,
4. conectar Telegram fuera de `n8n` productivo,
5. probar mensaje de inicio con el cliente.

## 5. Ejecutar el bot de Telegram
```powershell
$env:TELEGRAM_BOT_TOKEN="TU_TOKEN"
node .\projects\chatbot-juridico-ai\scripts\telegram-bot-polling.mjs
```

Si el cliente envia `/start`, el bot responde de inmediato con el mensaje corto de inicio.

Para dejarlo corriendo en segundo plano:
```powershell
powershell -ExecutionPolicy Bypass -File .\projects\chatbot-juridico-ai\scripts\start-telegram-bot.ps1 -BotToken "TU_TOKEN"
```

Estado:
```powershell
powershell -ExecutionPolicy Bypass -File .\projects\chatbot-juridico-ai\scripts\status-telegram-bot.ps1
```

## 6. Activar OpenAI solo si existe la clave
```powershell
$env:OPENAI_API_KEY="TU_API_KEY"
$env:OPENAI_MODEL="gpt-4.1-mini"
node .\projects\chatbot-juridico-ai\scripts\telegram-bot-polling.mjs
```
