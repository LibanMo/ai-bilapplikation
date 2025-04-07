import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pipeline } from "@xenova/transformers";
import express from "express";

const app = express();
const port = 3000;

// 🛠️ Supabase-uppgifter
const supabaseUrl = "http://127.0.0.1:42001";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛠️ Gemini AI-klient
const geminiApiKey = "AIzaSyA9BeZQuTchMG4nhk9nHQFPLMF18V17Y4o";
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05" });

// 🛠️ Hugging Face API-nyckel (Ej använd om pipeline körs lokalt)
const huggingFaceApiKey = "DINA_HUGGING_FACE_NYCKLAR_HÄR";

// 🛠️ Vektoriseringspipeline
let vectorizer = null;

async function initVectorizer() {
  try {
    vectorizer = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
    console.log("✅ Vektoriseringspipeline initierad!");
  } catch (error) {
    console.error("❌ FEL: Kunde inte ladda vektoriseringsmodellen", error);
  }
}

initVectorizer();

// 🔹 Funktion för att transformera landdata
function transformCountries(countries) {
  return countries.map((country) => ({
    ...country,
    population_density: country.Population / (country["Area(km²)"] || 1),
  }));
}

// 🔹 Funktion för att vektorisera data
async function vectorizeData(data) {
  if (!vectorizer) {
    console.error("❌ FEL: Vektoriseringsmodellen är inte laddad!");
    return [];
  }

  const embeddings = [];
  for (const item of data) {
    try {
      const output = await vectorizer(JSON.stringify(item), {
        pooling: "mean",
        normalize: true,
      });
      embeddings.push({ id: item.Country, embedding: Array.from(output.data) });
    } catch (vectorError) {
      console.error(
        "❌ FEL: Vektorisering misslyckades för",
        item.Country,
        vectorError,
      );
    }
  }
  return embeddings;
}

// 🔹 Funktion för att fråga AI-agenten
async function queryAI(question, vectors) {
  try {
    if (!question || vectors.length === 0) {
      return "❌ Ingen giltig fråga eller data att analysera.";
    }

    const prompt = `utgå från datan som efterfåtts! Fråga: ${question}\nData: ${JSON.stringify(
      vectors,
    )} svara endast märket och modell och årmodell`;
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (aiError) {
    console.error("❌ FEL: AI-förfrågan misslyckades!", aiError);
    return "AI-fel uppstod.";
  }
}

// 📌 Hämta all data
app.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("countries").select("*");
    if (error) {
      console.error("❌ Supabase-fel:", error);
      return res
        .status(500)
        .json({ error: "Fel vid hämtning av data", details: error });
    }
    res.json(transformCountries(data));
  } catch (error) {
    console.error("❌ Serverfel:", error);
    res
      .status(500)
      .json({ error: "Internt serverfel", details: error.toString() });
  }
});

// 📌 Fråga AI om landdata
app.get("/query", async (req, res) => {
  try {
    const { question } = req.query;
    if (!question) {
      return res.status(400).json({ error: "Ingen fråga angiven" });
    }

    console.log("📝 Fråga:", question);

    // 1️⃣ Hämta data från Supabase
    const { data, error } = await supabase.from("countries").select("*");
    if (error) {
      console.error("❌ Supabase-fel:", error);
      return res
        .status(500)
        .json({ error: "Supabase misslyckades", details: error });
    }

    console.log("📊 Hämtad data:", data.length, "poster");

    // 2️⃣ Transformera & vektorisera data
    const transformedData = transformCountries(data);
    const vectors = await vectorizeData(transformedData);
    console.log("🔹 Vektorer skapade:", vectors.length);

    // 3️⃣ Fråga AI
    const answer = await queryAI(question, vectors);
    console.log("💡 AI-svar:", answer);

    res.send(answer);
  } catch (error) {
    console.error("❌ Serverfel:", error);
    res.status(500).json({ error: "Serverfel", details: error.toString() });
  }
});

// 🚀 Starta servern
app.listen(port, () => {
  console.log(`✅ Server körs på http://localhost:${port}`);
});
