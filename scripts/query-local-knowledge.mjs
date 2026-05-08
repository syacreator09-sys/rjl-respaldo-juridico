const query = process.argv.slice(2).join(" ").trim();
import { answerLegalQuestion } from "../src/chatbot-engine.mjs";

if (!query) {
  console.error("Usage: node .\\projects\\chatbot-juridico-ai\\scripts\\query-local-knowledge.mjs \"tu consulta\"");
  process.exit(1);
}
console.log(JSON.stringify(await answerLegalQuestion(query), null, 2));
