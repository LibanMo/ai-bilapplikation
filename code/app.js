import express from "express";
import routes from "./routes.js";
import { initVectorizer } from "./vectorizer.js";

// Skapa en Express-applikation.
const app = express();
// Definiera portnumret som servern ska lyssna på.
const port = 3000;

// Använd de definierade API-routerna under basvägen '/'.
app.use("/", routes);

// Asynkron funktion för att starta servern.
async function startServer() {
  // Initiera vektoriseringsmodellen innan servern startar.
  await initVectorizer();
  app.listen(port, () => {
    console.log(`✅ Server körs på http://localhost:${port}`);
  });
}

// Anropa funktionen för att starta servern.
startServer();
