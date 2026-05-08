import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildGroundedAnswer, searchKnowledge } from "./legal-engine.mjs";

const runtimeDir = resolve(process.cwd(), "projects", "chatbot-juridico-ai", ".runtime");
const statsPath = resolve(runtimeDir, "engine-stats.json");

function loadStats() {
  try {
    return JSON.parse(readFileSync(statsPath, "utf8"));
  } catch {
    return {
      localAnswers: 0,
      openaiAnswers: 0,
      openaiFallbacks: 0,
      lastMode: "local",
    };
  }
}

function saveStats(patch) {
  mkdirSync(dirname(statsPath), { recursive: true });
  const next = {
    ...loadStats(),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(statsPath, JSON.stringify(next, null, 2));
}

function preferredMode() {
  if (process.env.CHATBOT_JURIDICO_MODE) {
    return process.env.CHATBOT_JURIDICO_MODE.trim().toLowerCase();
  }
  return process.env.OPENAI_API_KEY ? "openai" : "local";
}

function isUsageQuestion(query) {
  const normalized = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const cues = [
    "tutorial",
    "como usar",
    "como funciona",
    "que puedes hacer",
    "que haces",
    "ayuda",
    "dudas",
    "instrucciones",
    "guia",
    "explicame como",
  ];

  return cues.some((cue) => normalized.includes(cue));
}

export function buildUsageAnswer() {
  return {
    matter: "orientacion_de_uso",
    escalate: false,
    hits: [],
    disclaimer: "Orientacion informativa. El bot no sustituye asesoria legal profesional.",
    responseMode: "local",
    answer: [
      "Hola. Estoy para orientarte de forma inicial en temas legales y responder tus dudas con un lenguaje claro.",
      "",
      "Puedo ayudarte en temas:",
      "- penales",
      "- proceso penal",
      "- familiares",
      "- civiles",
      "",
      "Como puedes usarme",
      "1. Escribe tu caso o duda con el mayor detalle posible.",
      "2. Si tienes un tema urgente, dilo claramente.",
      "3. Yo te respondere con una orientacion inicial, base legal y pasos sugeridos.",
      "",
      "Lo que si hago",
      "- explico de forma clara derechos, obligaciones y reglas generales",
      "- te ayudo a ubicar el tipo de asunto",
      "- te comparto articulos o fragmentos relevantes cuando existan",
      "",
      "Lo que no hago",
      "- no sustituyo a una persona abogada",
      "- no elaboro estrategia ilegal ni ayudo a evadir autoridad",
      "- no doy dictamen definitivo",
      "",
      "Si quieres, cuentame ahora tu duda juridica y te acompano con una orientacion inicial.",
    ].join("\n"),
  };
}

function makeOpenAIPrompt(query, retrieval) {
  const snippets = retrieval.hits
    .map((hit, index) => {
      const excerpt = hit.text.slice(0, 700).trim();
      return `Fuente ${index + 1}\nLey: ${hit.law}\nArticulo: ${hit.article}\nTexto:\n${excerpt}`;
    })
    .join("\n\n");

  return [
    "Eres un asistente juridico de atencion al usuario para Morelos.",
    "Tu tono debe ser humano, claro, calmado y profesional.",
    "Habla como una persona que orienta, no como un robot ni como una sentencia judicial.",
    "Responde solo con base en las fuentes proporcionadas.",
    "No inventes articulos ni criterios.",
    "Si el soporte es insuficiente, dilo expresamente.",
    "No sustituyes asesoria legal profesional.",
    `Materia detectada: ${retrieval.matter}.`,
    retrieval.escalate ? "El caso debe escalarse a revision humana inmediata." : "No se detecto urgencia critica automatica.",
    `Consulta del usuario: ${query}`,
    "Fuentes recuperadas:",
    snippets,
    "Entrega una respuesta breve en espanol pensada para usuarios finales con esta estructura:",
    "1. Acompañamiento inicial al usuario",
    "2. Lo mas importante que debe saber",
    "3. Base legal encontrada en lenguaje claro",
    "4. Siguiente paso recomendado",
    "5. Limite o escalamiento si aplica",
  ].join("\n\n");
}

async function generateWithOpenAI(query, retrieval) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no disponible");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(20000),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "Responde en espanol claro y conciso. Usa exclusivamente las fuentes dadas.",
        },
        {
          role: "user",
          content: makeOpenAIPrompt(query, retrieval),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${errorBody}`);
  }

  const payload = await response.json();
  const answer = payload?.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("OpenAI no devolvio contenido util");
  }

  saveStats({
    ...loadStats(),
    openaiAnswers: loadStats().openaiAnswers + 1,
    lastMode: "openai",
  });

  return {
    ...retrieval,
    disclaimer: "Orientacion informativa basada en fuentes cargadas. No sustituye asesoria legal profesional.",
    answer,
    model,
    responseMode: "openai",
  };
}

function generateLocally(query) {
  const result = buildGroundedAnswer(query);
  saveStats({
    ...loadStats(),
    localAnswers: loadStats().localAnswers + 1,
    lastMode: "local",
  });
  return {
    ...result,
    responseMode: "local",
  };
}

export async function answerLegalQuestion(query) {
  if (isUsageQuestion(query)) {
    return buildUsageAnswer();
  }

  const mode = preferredMode();
  const retrieval = searchKnowledge(query, 3);

  if (mode === "openai" && retrieval.hits.length > 0) {
    try {
      return await generateWithOpenAI(query, retrieval);
    } catch (error) {
      saveStats({
        ...loadStats(),
        openaiFallbacks: loadStats().openaiFallbacks + 1,
        lastMode: "local",
      });
      const local = generateLocally(query);
      return {
        ...local,
        openaiError: String(error),
      };
    }
  }

  return generateLocally(query);
}

export function formatTelegramAnswer(result) {
  const sources = (result.hits || [])
    .slice(0, 3)
    .map((hit) => `- ${hit.article}`)
    .join("\n");

  const escalation = result.escalate
    ? "\n\nImportante: por la naturaleza de tu caso, conviene revision humana inmediata."
    : "";

  return [
    "Cano Digital | Orientacion juridica inicial",
    "",
    result.answer,
    escalation,
    sources ? `\nBase legal consultada:\n${sources}` : "",
    "\nAviso: esta orientacion es informativa y no sustituye asesoria legal profesional.",
  ].join("\n").trim();
}
