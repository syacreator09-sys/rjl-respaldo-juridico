import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { answerLegalQuestion, buildUsageAnswer, formatTelegramAnswer } from "../src/chatbot-engine.mjs";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

const runtimeDir = resolve(process.cwd(), "projects", "chatbot-juridico-ai", ".runtime");
const offsetPath = resolve(runtimeDir, "telegram-offset.json");
const heartbeatPath = resolve(runtimeDir, "telegram-heartbeat.json");
const pendingBroadcastPath = resolve(runtimeDir, "pending-broadcast.json");
const apiBase = `https://api.telegram.org/bot${token}`;
const startupChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || "";

function writeHeartbeat(extra = {}) {
  mkdirSync(dirname(heartbeatPath), { recursive: true });
  writeFileSync(heartbeatPath, JSON.stringify({
    pid: process.pid,
    mode: process.env.CHATBOT_JURIDICO_MODE || "local",
    updatedAt: new Date().toISOString(),
    ...extra,
  }, null, 2));
}

function maskChatId(chatId) {
  const raw = String(chatId || "");
  if (raw.length <= 4) return raw;
  return `${raw.slice(0, 2)}***${raw.slice(-2)}`;
}

function readOffset() {
  try {
    const data = JSON.parse(readFileSync(offsetPath, "utf8"));
    return Number(data.offset || 0);
  } catch {
    return 0;
  }
}

function writeOffset(offset) {
  mkdirSync(dirname(offsetPath), { recursive: true });
  writeFileSync(offsetPath, JSON.stringify({ offset, updatedAt: new Date().toISOString() }, null, 2));
}

async function callTelegram(method, payload) {
  const response = await fetch(`${apiBase}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram ${method} failed: ${JSON.stringify(data)}`);
  }
  return data.result;
}

async function sendMessage(chatId, text) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
  });
}

function readPendingBroadcast() {
  if (!existsSync(pendingBroadcastPath)) return null;
  try {
    return JSON.parse(readFileSync(pendingBroadcastPath, "utf8"));
  } catch {
    return null;
  }
}

function clearPendingBroadcast() {
  if (existsSync(pendingBroadcastPath)) {
    rmSync(pendingBroadcastPath, { force: true });
  }
}

function getWelcomeText() {
  return [
    "Cano Digital: el bot ya esta listo para prueba.",
    "Puedes iniciar el test cuando quieras.",
    "",
    "Puedo orientarte en:",
    "- penal",
    "- proceso penal",
    "- familiar",
    "- civil",
    "",
    "Comandos:",
    "/ayuda",
    "/tutorial",
    "/ping",
    "",
    "Escribe tu consulta juridica y te respondere con base en las fuentes cargadas.",
  ].join("\n");
}

async function notifyStartup() {
  if (!startupChatId) return;
  await sendMessage(
    startupChatId,
    "Cano Digital: el bot ya esta listo para prueba. Puedes iniciar el test cuando quieras.",
  );
}

async function handleUpdate(update) {
  const message = update.message;
  const chatId = message?.chat?.id;
  const text = String(message?.text || "").trim();
  if (!chatId) return;

  // One-shot operator broadcast: sent to the first active chat and then cleared.
  const pendingBroadcast = readPendingBroadcast();
  if (pendingBroadcast?.text) {
    await sendMessage(chatId, String(pendingBroadcast.text).slice(0, 3900));
    writeHeartbeat({
      lastChatIdMasked: maskChatId(chatId),
      lastCommand: "pending-broadcast-sent",
    });
    clearPendingBroadcast();
  }

  if (!text) {
    writeHeartbeat({
      lastChatIdMasked: maskChatId(chatId),
      lastCommand: "non-text-message",
    });
    await sendMessage(
      chatId,
      "Puedo ayudarte mejor si me escribes tu duda en texto. Ejemplo: \"Me detuvieron y no se que hacer\".",
    );
    return;
  }

  if (text === "/start") {
    writeHeartbeat({ lastChatIdMasked: maskChatId(chatId), lastCommand: "/start" });
    await sendMessage(chatId, getWelcomeText());
    return;
  }

  if (text === "/ayuda" || text === "/tutorial" || text === "/help") {
    writeHeartbeat({ lastChatIdMasked: maskChatId(chatId), lastCommand: text });
    await sendMessage(chatId, formatTelegramAnswer(buildUsageAnswer()).slice(0, 3900));
    return;
  }

  if (text === "/ping") {
    writeHeartbeat({ lastChatIdMasked: maskChatId(chatId), lastCommand: "/ping" });
    await sendMessage(chatId, "Bot juridico activo y escuchando.");
    return;
  }

  const result = await answerLegalQuestion(text);
  const reply = formatTelegramAnswer(result);
  writeHeartbeat({
    lastChatIdMasked: maskChatId(chatId),
    lastQueryLength: text.length,
    lastMatter: result.matter,
  });
  await sendMessage(chatId, reply.slice(0, 3900));
}

async function pollForever() {
  let offset = readOffset();
  console.log(`Telegram polling iniciado. Offset actual: ${offset}`);
  writeHeartbeat({ offset, phase: "startup" });
  await notifyStartup();

  while (true) {
    try {
      writeHeartbeat({ offset, phase: "polling" });
      const updates = await callTelegram("getUpdates", {
        offset,
        timeout: 25,
        allowed_updates: ["message"],
      });

      for (const update of updates) {
        offset = update.update_id + 1;
        writeOffset(offset);
        writeHeartbeat({ offset, phase: "handling-update", updateId: update.update_id });
        await handleUpdate(update);
      }
    } catch (error) {
      console.error(`Polling error: ${String(error)}`);
      writeHeartbeat({ offset, phase: "error", lastError: String(error) });
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 4000));
    }
  }
}

pollForever().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
