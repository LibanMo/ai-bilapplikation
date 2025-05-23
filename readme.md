# Användarmanual för AI-bilapplikationen

Denna manual beskriver hur du använder AI-bilapplikationen för att söka och få information om bilar.

## Innehållsförteckning

1.  Installation
2.  Användning av API
    * Hämta alla bilar
    * Hämta sportiga och bränslesnåla bilar
    * Fråga AI om bilar
    * Hämta modellinformation
3.  Exempel på användning
4.  Felhantering

## 1. Installation

1.  Klona repot från GitHub:
    ```bash
    git clone [repo-länk]
    ```
2.  Navigera till repots mapp:
    ```bash
    cd [repo-mapp]
    ```
3.  Installera beroenden:
    ```bash
    npm install
    ```
4.  Konfigurera Supabase-anslutning:
    * Skapa en `.env`-fil i rotmappen.
    * Lägg till dina Supabase-nycklar (byt ut `[din-supabase-url]` och `[din-supabase-anon-key]` med dina faktiska värden):
        ```
        SUPABASE_URL=din-supabase-url
        SUPABASE_ANON_KEY=din-supabase-anon-key
        ```
5.  Starta servern:
    ```bash
    npm start
    ```

## 2. Användning av API

### Hämta alla bilar

* **Endpoint:** `/cars`
* **Metod:** `GET`
* **Beskrivning:** Hämtar en lista med alla bilar i databasen.
* **Exempel:**
    ```bash
    curl http://localhost:3000/cars
    ```

### Hämta sportiga och bränslesnåla bilar

* **Endpoint:** `/sporty-fuel-efficient`
* **Metod:** `GET`
* **Beskrivning:** Hämtar en lista med bilar som är både sportiga och bränslesnåla.
* **Exempel:**
    ```bash
    curl http://localhost:3000/sporty-fuel-efficient
    ```

### Fråga AI om bilar

* **Endpoint:** `/query?question=[fråga]`
* **Metod:** `GET`
* **Beskrivning:** Frågar AI om bilar och returnerar ett svar.
* **Exempel:**
    ```bash
    curl "http://localhost:3000/query?question=Vilka Audi modeller finns det?"
    ```

### Hämta modellinformation

* **Endpoint:** `/model-info/:model`
* **Metod:** `GET`
* **Beskrivning:** Hämtar information om en specifik bilmodell.
* **Exempel:**
    ```bash
    curl http://localhost:3000/model-info/A3
    ```

## 3. Exempel på användning

1.  Öppna din webbläsare eller ett API-testverktyg (t.ex. Postman).
2.  Gör en `GET`-förfrågan till `http://localhost:3000/cars` för att hämta alla bilar.
3.  Gör en `GET`-förfrågan till `http://localhost:3000/query?question=Vilka Audi modeller finns det från 2015 och framåt?` för att fråga AI om bilar.
4.  Gör en `GET`-förfrågan till `http://localhost:3000/model-info/Q5` för att hämta information om Audi Q5.

## 4. Felhantering

* Om ett fel uppstår returnerar API:et ett JSON-objekt med ett felmeddelande och en statuskod.
* **Exempel:**
    ```json
    {
        "error": "Serverfel",
        "details": "Databasfel"
    }
    ```
* **Statuskoder:**
    * `200`: OK
    * `400`: Felaktig förfrågan
    * `500`: Serverfel

# Bil---AI---agent
