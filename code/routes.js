// routes.js
import express from "express";
import {
  getCars,
  getSportyAndFuelEfficientCars,
  queryAI,
  getModelInfo,
  transformCars,
} from "./carService.js";

import { vectorizeData } from "./vectorizer.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const cars = await getCars();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: "Fel vid hämtning av data", details: error });
  }
});

router.get("/sporty-fuel-efficient", async (req, res) => {
  try {
    const cars = await getSportyAndFuelEfficientCars(50);
    res.send(cars);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/query", async (req, res) => {
  try {
    const { question } = req.query;
    if (!question) {
      return res.status(400).json({ error: "Ingen fråga angiven" });
    }

    const data = await getCars();
    const vectors = await vectorizeData(data);
    const answer = await queryAI(question, vectors);

    res.send(answer);
  } catch (error) {
    res.status(500).json({ error: "Serverfel", details: error.toString() });
  }
});

router.get("/model-info/:model", async (req, res) => {
  try {
    const modelInfo = await getModelInfo(req.params.model);
    res.json(modelInfo);
  } catch (error) {
    res.status(500).json({ error: "Serverfel", details: error.toString() });
  }
});

export default router;
