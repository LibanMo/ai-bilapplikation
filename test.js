import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pipeline } from "@xenova/transformers";
import express from "express";

const app = express();
const port = 3000;

// ️ Supabase-uppgifter
const supabaseUrl = "http://127.0.0.1:42001";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const supabase = createClient(supabaseUrl, supabaseKey);

// ️ Gemini AI-klient
const geminiApiKey = "AIzaSyA9BeZQuTchMG4nhk9nHQFPLMF18V17Y4o";
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05" });

// ️ Hugging Face API-nyckel (Ej använd om pipeline körs lokalt)
const huggingFaceApiKey = "DINA_HUGGING_FACE_NYCKLAR_HÄR";

// ️ Vektoriseringspipeline
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

//  Funktion för att transformera bil-data (anpassa efter din bil-data)
function transformCars(cars) {
  return cars.map((car) => ({
    brand: car.brand,
    model: car.model,
    year: car.year,
    mpg: car.mpg,
    description: car.description, // Lägg till relevanta fält
  }));
}

//  Funktion för att vektorisera data
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
      embeddings.push({
        id: `${item.brand} ${item.model} ${item.year} ${item.mpg}`,
        embedding: Array.from(output.data),
      }); // Ändra id format
    } catch (vectorError) {
      console.error(
        "❌ FEL: Vektorisering misslyckades för",
        `${item.brand} ${item.model} ${item.year}`, // Ändra id format
        vectorError,
      );
    }
  }
  return embeddings;
}

//  Funktion för att fråga AI-agenten
async function queryAI(question, vectors) {
  try {
    if (!question || vectors.length === 0) {
      return "❌ Ingen giltig fråga eller data att analysera.";
    }

    const prompt = `utgå från datan som efterfåtts! Fråga: ${question}\nData: ${JSON.stringify(
      vectors,
    )} svara endast märket och modell och årmodell och avg mpg för modellen`; // Anpassa prompten
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (aiError) {
    console.error("❌ FEL: AI-förfrågan misslyckades!", aiError);
    return "AI-fel uppstod.";
  }
}

//  Hämta all data från "cars" tabellen
app.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("cars").select("*"); // Ändra tabellnamnet
    if (error) {
      console.error("❌ Supabase-fel:", error);
      return res
        .status(500)
        .json({ error: "Fel vid hämtning av data", details: error });
    }
    res.json(transformCars(data));
  } catch (error) {
    console.error("❌ Serverfel:", error);
    res
      .status(500)
      .json({ error: "Internt serverfel", details: error.toString() });
  }
});
async function getSportyAndFuelEfficientCars(mpgLimit) {
  // 1. Filtrera data i databasen
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .lt("mpg", mpgLimit)
    .limit(100);

  if (error) {
    console.error("Databasfel:", error);
    return [];
  }

  // 2. Använd AI-modellen för att filtrera på "sportig"
  const question = `Baserat på följande lista med bilar (där "mpg" representerar miles per gallon), vilka modeller kan beskrivas som "bränslesnåla"? Ge mig en lista med högst 5 modeller med högst mpg. Svara endast med märke och modell.`;
  const aiAnswer = await queryAI(question, data);

  const transformedData = transformCars(data);
  const vectors = await vectorizeData(transformedData);
  console.log(" Vektorer skapade:", vectors.length);

  // 3️⃣ Fråga AI
  const answer = await queryAI(question, vectors);
  console.log(" AI-svar:", answer);
  return aiAnswer;
}

app.get("/sporty-fuel-efficient", async (req, res) => {
  try {
    const cars = await getSportyAndFuelEfficientCars(50); // Justera mpgLimit
    res.send(cars);
  } catch (error) {
    // ...
  }
});

//  Fråga AI om bil-data
app.get("/query", async (req, res) => {
  try {
    const { question } = req.query;
    if (!question) {
      return res.status(400).json({ error: "Ingen fråga angiven" });
    }

    console.log(" Fråga:", question);

    // 1️⃣ Hämta data från "cars" tabellen
    const { data, error } = await supabase.from("cars").select("*"); // Ändra tabellnamnet
    if (error) {
      console.error("❌ Supabase-fel:", error);
      return res
        .status(500)
        .json({ error: "Supabase misslyckades", details: error });
    }

    console.log(" Hämtad data:", data.length, "poster");

    // 2️⃣ Transformera & vektorisera data
    const transformedData = transformCars(data);
    const vectors = await vectorizeData(transformedData);
    console.log(" Vektorer skapade:", vectors.length);

    // 3️⃣ Fråga AI
    const answer = await queryAI(question, vectors);
    console.log(" AI-svar:", answer);

    res.send(answer);
  } catch (error) {
    console.error("❌ Serverfel:", error);
    res.status(500).json({ error: "Serverfel", details: error.toString() });
  }
});

app.get("/model-info/:model", async (req, res) => {
  try {
    const { model: selectedModel } = req.params;
    console.log("Modellnamn från URL:", selectedModel);

    // 1. Hämta all information om den valda modellen
    const { data: modelData, error: modelError } = await supabase
      .from("cars")
      .select("*")
      .eq("model", selectedModel);

    if (modelError) {
      console.error("Supabase-fel:", modelError);
      return res.status(500).json({
        error: "Fel vid hämtning av bilinformation",
        details: modelError,
      });
    }

    if (!modelData || modelData.length === 0) {
      return res.status(404).json({ error: "Modellen hittades inte" });
    }

    // 2. Hämta unika motorstorlekar (utan rpc)
    const { data: engineSizesData, error: engineSizesError } = await supabase
      .from("cars")
      .select("engineSize")
      .eq("model", selectedModel);

    if (engineSizesError) {
      console.error("Supabase-fel:", engineSizesError);
      return res.status(500).json({
        error: "Fel vid hämtning av motorstorlekar",
        details: engineSizesError,
      });
    }

    // Extrahera unika motorstorlekar från resultatet
    const engineSizes = [
      ...new Set(engineSizesData.map((item) => item.engineSize)),
    ];

    // 3. Beräkna genomsnittspris
    const { data: averagePriceData, error: averagePriceError } = await supabase
      .from("cars")
      .select("price")
      .eq("model", selectedModel);

    if (averagePriceError) {
      console.error("Supabase-fel:", averagePriceError);
      return res.status(500).json({
        error: "Fel vid beräkning av genomsnittspris",
        details: averagePriceError,
      });
    }

    const prices = averagePriceData.map((item) => item.price);
    const averagePrice =
      prices.length > 0
        ? prices.reduce((sum, price) => sum + price, 0) / prices.length
        : 0;

    // 4. Presentera resultaten
    res.json({
      model: modelData[0].model,
      year: modelData[0].year,
      fuelType: modelData[0].fueltype,
      transmission: modelData[0].transmission,
      engineSizes,
      averagePrice,
    });
  } catch (error) {
    console.error("Serverfel:", error);
    res
      .status(500)
      .json({ error: "Internt serverfel", details: error.toString() });
  }
});

//starta servern
app.listen(port, () => {
  console.log(`✅ Server körs på http://localhost:${port}`);
});
