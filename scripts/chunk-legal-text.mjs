import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const root = resolve(process.cwd(), "projects", "chatbot-juridico-ai");
const rawDir = resolve(root, "knowledge", "raw");
const processedDir = resolve(root, "knowledge", "processed");

mkdirSync(processedDir, { recursive: true });

const sources = [
  {
    file: "CPENALEM.txt",
    sourceId: "cp-morelos",
    law: "Codigo Penal para el Estado de Morelos",
    matter: "penal",
    scope: "local",
  },
  {
    file: "CNPP.txt",
    sourceId: "cnpp",
    law: "Codigo Nacional de Procedimientos Penales",
    matter: "proceso_penal",
    scope: "nacional",
  },
  {
    file: "CFAMILIAREM.txt",
    sourceId: "cfamiliar-morelos",
    law: "Codigo Familiar del Estado de Morelos",
    matter: "familiar",
    scope: "local",
  },
  {
    file: "CODIGO_CIVIL_MORELOS.txt",
    sourceId: "ccivil-morelos",
    law: "Codigo Civil del Estado de Morelos",
    matter: "civil",
    scope: "local",
  },
];

function normalize(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function plain(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function splitByArticle(text) {
  const regex = /(?=^\s*Art\S*\s+\d+[A-Za-z0-9.\-ºo ]*)/gim;
  const parts = text.split(regex).map((part) => part.trim()).filter(Boolean);
  return parts.length ? parts : [text];
}

function articleLabel(chunk, fallbackIndex) {
  const match = chunk.match(/^\s*Art\S*\s+([^\n.:-]+)/im);
  return match ? `ARTICULO ${match[1].trim()}` : `BLOQUE ${fallbackIndex + 1}`;
}

function buildKeywords(chunk) {
  const words = chunk
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]{4,}/g) || [];

  const stop = new Set([
    "para", "como", "esta", "este", "sobre", "entre", "cuando", "donde",
    "porque", "tiene", "todas", "todos", "codigo", "estado", "morelos",
    "articulo", "fraccion", "parrafo", "publicado", "vigencia", "fecha",
  ]);

  const unique = [];
  for (const word of words) {
    if (stop.has(word)) continue;
    if (!unique.includes(word)) unique.push(word);
    if (unique.length >= 18) break;
  }
  return unique;
}

function isMostlyEditorial(chunk) {
  const normalized = plain(chunk);
  const editorialSignals = [
    "decreto",
    "publicado en el periodico oficial",
    "tierra y libertad",
    "vigencia",
    "fe de erratas",
    "transitorio",
    "reforma",
    "promulgacion",
    "aprobacion",
    "ultima reforma",
    "observaciones generales",
  ];

  const hitCount = editorialSignals.reduce((sum, signal) => sum + (normalized.includes(signal) ? 1 : 0), 0);
  const articleMentions = (normalized.match(/art\S*\s+\d+/g) || []).length;

  return hitCount >= 3 || (hitCount >= 2 && articleMentions > 3);
}

const chunks = [];
const sourceSummary = [];

for (const source of sources) {
  const fullPath = resolve(rawDir, source.file);
  const raw = normalize(readFileSync(fullPath, "utf8"));
  const articles = splitByArticle(raw);

  articles.forEach((chunk, index) => {
    const compact = normalize(chunk);
    if (compact.length < 200) return;
    if (isMostlyEditorial(compact)) return;

    chunks.push({
      id: `${source.sourceId}-${index + 1}`,
      sourceId: source.sourceId,
      law: source.law,
      matter: source.matter,
      scope: source.scope,
      article: articleLabel(compact, index),
      keywords: buildKeywords(compact),
      text: compact.slice(0, 6000),
    });
  });

  sourceSummary.push({
    sourceId: source.sourceId,
    law: source.law,
    matter: source.matter,
    scope: source.scope,
    file: source.file,
    extractedFrom: basename(fullPath),
    chunkCount: chunks.filter((item) => item.sourceId === source.sourceId).length,
  });
}

writeFileSync(resolve(processedDir, "legal_chunks.json"), JSON.stringify(chunks, null, 2));
writeFileSync(resolve(processedDir, "legal_sources.json"), JSON.stringify(sourceSummary, null, 2));

console.log(JSON.stringify({
  outputDir: dirname(resolve(processedDir, "legal_chunks.json")),
  sources: sourceSummary,
  totalChunks: chunks.length,
}, null, 2));
