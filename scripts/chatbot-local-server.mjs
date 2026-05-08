import { createServer } from "node:http";
import { answerLegalQuestion } from "../src/chatbot-engine.mjs";

const port = Number(process.env.CHATBOT_JURIDICO_PORT || 3099);

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chatbot Juridico AI</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: "Segoe UI", sans-serif; background: #f4f6fb; color: #16213a; }
    main { max-width: 900px; margin: 0 auto; padding: 32px 20px 64px; }
    .card { background: #fff; border-radius: 18px; box-shadow: 0 18px 45px rgba(17, 33, 68, 0.08); padding: 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    p { line-height: 1.5; }
    textarea { width: 100%; min-height: 130px; border: 1px solid #ccd4e4; border-radius: 12px; padding: 14px; font: inherit; resize: vertical; }
    button { margin-top: 14px; background: #1247b7; color: #fff; border: 0; border-radius: 999px; padding: 12px 18px; font: inherit; cursor: pointer; }
    button:hover { background: #0d3995; }
    pre { white-space: pre-wrap; word-break: break-word; background: #0d1831; color: #eff5ff; border-radius: 14px; padding: 18px; overflow: auto; }
    .meta { display: grid; gap: 10px; margin: 16px 0 0; }
    .pill { display: inline-block; background: #e6eefc; color: #1247b7; border-radius: 999px; padding: 6px 10px; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <h1>Chatbot Juridico AI</h1>
      <p>Prueba local sin Telegram ni n8n. Este prototipo consulta la base legal procesada y devuelve una respuesta orientativa con citas.</p>
      <textarea id="message" placeholder="Ejemplo: Me quieren detener y no se que derechos tengo"></textarea>
      <button id="send">Consultar</button>
      <div class="meta">
        <span class="pill">Local only</span>
        <span class="pill">Sin dependencias nuevas</span>
        <span class="pill">Base legal de Morelos</span>
      </div>
      <h2>Resultado</h2>
      <pre id="output">Esperando consulta...</pre>
    </div>
  </main>
  <script>
    const btn = document.getElementById("send");
    const textarea = document.getElementById("message");
    const output = document.getElementById("output");

    btn.addEventListener("click", async () => {
      const message = textarea.value.trim();
      if (!message) return;
      output.textContent = "Consultando base legal local...";
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      output.textContent = JSON.stringify(data, null, 2);
    });
  </script>
</body>
</html>`;

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  if (req.method === "POST" && req.url === "/api/ask") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body || "{}");
        const message = String(parsed.message || "").trim();
        const result = await answerLegalQuestion(message);
        res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(result, null, 2));
      } catch (error) {
        res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
    return;
  }

  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Chatbot Juridico AI escuchando en http://127.0.0.1:${port}`);
});
