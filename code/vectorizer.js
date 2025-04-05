// vectorizer.js
// Importera pipeline för feature-extraktion.
import { pipeline } from "@xenova/transformers";

// Lagrar vektoriseringspipelinen.
let vectorizer = null;

// Initiera vektoriseringspipelinen asynkront.
export async function initVectorizer() {
  try {
    // Skapa feature-extraktionspipeline med all-MiniLM-L6-v2 modellen.
    vectorizer = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
    console.log("✅ Vektoriseringspipeline initierad!");
  } catch (error) {
    console.error("❌ FEL: Kunde inte ladda vektoriseringsmodellen", error);
  }
}

// Vektorisera en array av data asynkront.
export async function vectorizeData(data) {
  // Kontrollera om vektoriseringsmodellen är laddad.
  if (!vectorizer) {
    console.error("❌ FEL: Vektoriseringsmodellen är inte laddad!");
    return [];
  }

  const embeddings = [];
  // Iterera över varje item i datan.
  for (const item of data) {
    try {
      // Generera embedding för item (konverterat till JSON).
      const output = await vectorizer(JSON.stringify(item), {
        pooling: "mean", // Använd medelvärdespooling.
        normalize: true, // Normalisera vektorn.
      });
      // Lägg till ID och embedding till resultatet.
      embeddings.push({
        id: `${item.brand} ${item.model} ${item.year} ${item.mpg}`,
        embedding: Array.from(output.data), // Konvertera till vanlig array.
      });
    } catch (vectorError) {
      console.error(
        "❌ FEL: Vektorisering misslyckades för",
        `${item.brand} ${item.model} ${item.year}`,
        vectorError,
      );
    }
  }
  return embeddings;
}
