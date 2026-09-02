import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "..");

app.use(cors());
app.use(express.json());

/*
========================================
FRONTEND
========================================
*/

function sendFrontendFile(res, fileName) {
  // Evita que navegadores mobile continuem usando versões antigas
  // do HTML/CSS/JS depois de um novo deploy no Render.
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  return res.sendFile(path.join(frontendDir, fileName));
}

app.get("/", (req, res) => {
  return sendFrontendFile(res, "index.html");
});

app.get("/Style.css", (req, res) => {
  return sendFrontendFile(res, "Style.css");
});

app.get("/adjustments.css", (req, res) => {
  return sendFrontendFile(res, "adjustments.css");
});

app.get("/mobile.css", (req, res) => {
  return sendFrontendFile(res, "mobile.css");
});

app.get("/script.js", (req, res) => {
  return sendFrontendFile(res, "script.js");
});

app.get("/adjustments.js", (req, res) => {
  return sendFrontendFile(res, "adjustments.js");
});

/*
========================================
ANALISAR IMÓVEL
========================================
*/

app.post("/analisar-imovel", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        erro: "URL não enviada"
      });
    }

    console.log("🔎 Buscando imóvel:", url);

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    let imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $("img").first().attr("src");

    if (!imageUrl) {
      return res.status(404).json({
        erro: "Imagem não encontrada"
      });
    }

    if (!imageUrl.startsWith("http")) {
      const base = new URL(url);
      imageUrl = new URL(imageUrl, base.origin).href;
    }

    console.log("🖼 Imagem encontrada:", imageUrl);

    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const contentType = imageResponse.headers["content-type"] || "image/jpeg";
    const base64 =
      `data:${contentType};base64,` +
      Buffer.from(imageResponse.data).toString("base64");

    res.json({
      imagem: base64
    });
  } catch (error) {
    console.error("❌ Erro:", error.message);

    res.status(500).json({
      erro: "Erro ao analisar o imóvel"
    });
  }
});

/*
========================================
PORTA PARA RENDER
========================================
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
