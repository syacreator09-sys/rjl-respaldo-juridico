import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const chunksPath = resolve(process.cwd(), "projects", "chatbot-juridico-ai", "knowledge", "processed", "legal_chunks.json");
const chunks = JSON.parse(readFileSync(chunksPath, "utf8"));

const matterRules = [
  { matter: "proceso_penal", words: ["detencion", "fiscal", "audiencia", "imputado", "juez", "ministerio publico", "proceso penal", "prision preventiva", "defensa"] },
  { matter: "penal", words: ["delito", "amenaza", "robo", "lesiones", "fraude", "violencia", "denuncia penal", "extorsion"] },
  { matter: "familiar", words: ["divorcio", "custodia", "alimentos", "pension", "patria potestad", "convivencia", "familia", "deudor alimentario"] },
  { matter: "civil", words: ["contrato", "arrendamiento", "pago", "incumplimiento", "propiedad", "posesion", "danos", "obligacion civil"] },
];

function plain(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectMatter(input) {
  const normalized = plain(input);
  const scores = matterRules.map((rule) => ({
    matter: rule.matter,
    score: rule.words.reduce((sum, word) => sum + (normalized.includes(plain(word)) ? 1 : 0), 0),
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].matter : "fuera_de_alcance";
}

function tokenize(input) {
  const stop = new Set([
    "como", "funciona", "tengo", "quiero", "puedo", "debo", "donde", "cuando",
    "para", "porque", "sobre", "caso", "tema", "esto", "esta", "este", "duda",
    "consulta", "necesito", "saber", "ayuda",
  ]);
  return Array.from(new Set(
    plain(input)
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !stop.has(word)),
  ));
}

function noisePenalty(chunk) {
  const haystack = plain(chunk.text);
  const noisyTerms = [
    "decreto",
    "publicado",
    "vigencia",
    "fe de erratas",
    "transitorio",
    "promulgacion",
    "aprobacion",
    "ultima reforma",
    "periodico oficial",
  ];

  return noisyTerms.reduce((sum, term) => sum + (haystack.includes(term) ? 2 : 0), 0);
}

function scoreChunk(chunk, terms) {
  const haystack = plain(`${chunk.article} ${chunk.keywords.join(" ")} ${chunk.text.slice(0, 1400)}`);
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += 3;
  }
  if (terms.some((term) => plain(chunk.article).includes(term))) score += 5;
  if (/^articulo\s+\d+/i.test(chunk.article)) score += 2;
  score -= noisePenalty(chunk);
  return score;
}

export function needsEscalation(input) {
  const normalized = plain(input);
  const critical = [
    "me detuvieron",
    "orden de aprehension",
    "violencia familiar",
    "abuso sexual",
    "menor",
    "urgente",
    "hoy tengo audiencia",
    "quiero demandar ya",
    "me acusan",
  ];
  return critical.some((term) => normalized.includes(plain(term)));
}

export function searchKnowledge(query, limit = 5) {
  const matter = detectMatter(query);
  const terms = tokenize(query);
  const pool = matter === "fuera_de_alcance" ? chunks : chunks.filter((chunk) => chunk.matter === matter);

  const hits = pool
    .map((chunk) => ({ ...chunk, score: scoreChunk(chunk, terms) }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    query,
    matter,
    escalate: needsEscalation(query),
    hits,
  };
}

export function buildGroundedAnswer(query) {
  const result = searchKnowledge(query, 3);

  if (result.matter === "fuera_de_alcance") {
    return {
      ...result,
      answer: "No detecte una materia clara dentro de las fuentes cargadas. Este prototipo solo cubre penal, proceso penal, familiar y civil de Morelos. Conviene revisar el caso con una persona abogada.",
      disclaimer: "Orientacion informativa basada en fuentes cargadas. No sustituye asesoria legal profesional.",
    };
  }

  if (!result.hits.length) {
    return {
      ...result,
      answer: `Detecte la materia ${result.matter}, pero no encontre articulos con suficiente coincidencia textual para responder con seguridad.`,
      disclaimer: "Orientacion informativa basada en fuentes cargadas. Si no hay soporte textual suficiente, el caso debe escalarse.",
    };
  }

  const sources = result.hits
    .map((hit) => `- ${hit.law} / ${hit.article}`)
    .join("\n");

  const synthesis = result.hits
    .map((hit, index) => `${index + 1}. ${hit.text.slice(0, 320).trim()}`)
    .join("\n\n");

  const escalationLine = result.escalate
    ? "\n\nDetecte indicadores de urgencia o riesgo. Este caso debe escalarse a revision humana inmediata."
    : "";

  return {
    ...result,
    disclaimer: "Orientacion informativa basada en fuentes cargadas. No sustituye asesoria legal profesional.",
    answer: `Materia detectada: ${result.matter}.\n\nCon base en los fragmentos recuperados, estos son los puntos mas cercanos a tu consulta:\n\n${synthesis}${escalationLine}\n\nFuentes:\n${sources}`,
  };
}
