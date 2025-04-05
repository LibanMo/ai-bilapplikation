import { supabase } from "./supabaseClient.js";
import { geminiModel } from "./geminiClient.js";
import { vectorizeData } from "./vectorizer.js";

// Funktion för att transformera bilobjekt till ett enhetligt format.
export function transformCars(cars) {
  return cars.map((car) => ({
    brand: car.brand,
    model: car.model,
    year: car.year,
    mpg: car.mpg,
    description: car.description,
  }));
}

// Asynkron funktion för att skicka en fråga till AI-modellen.
export async function queryAI(question, vectors) {
  try {
    // Kontrollera om frågan är tom eller om det inte finns någon data att analysera.
    if (!question || vectors.length === 0) {
      return "❌ Ingen giltig fråga eller data att analysera.";
    }

    // Skapa en prompt för AI-modellen med frågan och den relevanta datan.
    const prompt = `utgå från datan som efterfåtts! Fråga: ${question}\nData: ${JSON.stringify(
      vectors,
    )} svara endast märket och modell och årmodell och avg mpg för modellen`;
    // Skicka prompten till Gemini-modellen för att generera ett svar.
    const result = await geminiModel.generateContent(prompt);
    // Hämta svaret från resultatet.
    const response = await result.response;

    // Returnera AI-modellens textbaserade svar.
    return response.text();
  } catch (aiError) {
    // Fånga eventuella fel som uppstår under AI-förfrågan.
    console.error("❌ FEL: AI-förfrågan misslyckades!", aiError);
    return "AI-fel uppstod.";
  }
}

// Asynkron funktion för att hämta alla bilar från databasen.
export async function getCars() {
  // Hämta all data från tabellen "cars" i Supabase.
  const { data, error } = await supabase.from("cars").select("*");
  // Om ett fel uppstår under databasfrågan, kasta felet.
  if (error) {
    throw error;
  }
  // Transformera den hämtade datan till ett enhetligt format och returnera den.
  return transformCars(data);
}

// Asynkron funktion för att hämta sportiga och bränslesnåla bilar baserat på en mpg-gräns.
export async function getSportyAndFuelEfficientCars(mpgLimit) {
  // Hämta bilar från databasen som har en mpg under den angivna gränsen (begränsat till 100).
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .lt("mpg", mpgLimit)
    .limit(100);

  // Om ett fel uppstår under databasfrågan, kasta felet.
  if (error) {
    throw error;
  }

  // Skapa en fråga för AI-modellen för att identifiera bränslesnåla modeller.
  const question = `Baserat på följande lista med bilar (där "mpg" representerar miles per gallon), vilka modeller kan beskrivas som "bränslesnåla"? Ge mig en lista med högst 5 modeller med högst mpg. Svara endast med märke och modell.`;
  // Skicka frågan till AI-modellen med den råa datan och hämta svaret.
  const aiAnswer = await queryAI(question, data);

  // Vektorisera den hämtade bildatan.
  const vectors = await vectorizeData(transformCars(data));
  console.log(" Vektorer skapade:", vectors.length);

  // Skicka samma fråga till AI-modellen med de vektoriserade datan och hämta svaret.
  const answer = await queryAI(question, vectors);
  console.log(" AI-svar:", answer);

  // Returnera AI-svaret baserat på den råa datan.
  return aiAnswer;
}

// Asynkron funktion för att hämta detaljerad information om en specifik bilmodell.
export async function getModelInfo(model) {
  // Hämta data för den angivna modellen från databasen.
  const { data: modelData, error: modelError } = await supabase
    .from("cars")
    .select("*")
    .eq("model", model);

  // Om ett fel uppstår eller om modellen inte hittas, kasta ett fel.
  if (modelError || !modelData || modelData.length === 0) {
    throw modelError || new Error("Modellen hittades inte");
  }

  // Hämta alla unika motorstorlekar för den angivna modellen.
  const { data: engineSizesData, error: engineSizesError } = await supabase
    .from("cars")
    .select("engineSize")
    .eq("model", model);

  // Om ett fel uppstår under databasfrågan, kasta felet.
  if (engineSizesError) {
    throw engineSizesError;
  }

  // Extrahera unika motorstorlekar från resultatet.
  const engineSizes = [
    ...new Set(engineSizesData.map((item) => item.engineSize)),
  ];

  // Hämta alla priser för den angivna modellen.
  const { data: averagePriceData, error: averagePriceError } = await supabase
    .from("cars")
    .select("price")
    .eq("model", model);

  // Om ett fel uppstår under databasfrågan, kasta felet.
  if (averagePriceError) {
    throw averagePriceError;
  }

  // Extrahera priserna och beräkna genomsnittspriset.
  const prices = averagePriceData.map((item) => item.price);
  const averagePrice =
    prices.length > 0
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : 0;

  // Returnera ett objekt med detaljerad information om modellen.
  return {
    model: modelData[0].model,
    year: modelData[0].year,
    fuelType: modelData[0].fueltype,
    transmission: modelData[0].transmission,
    engineSizes,
    averagePrice,
  };
}
