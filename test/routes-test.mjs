// routes.test.js
import request from "supertest";
import express from "express";
import routes from "./routes.js";
import { getCars, queryAI, getModelInfo } from "./carService.js";

jest.mock("./carService.js");

const app = express();
app.use("/", routes);

describe("routes", () => {
  describe("/cars", () => {
    it("should return an array of Audi cars from 2015 and later", async () => {
      getCars.mockResolvedValue([
        { brand: "Audi", model: "A3", year: 2016, mpg: 35 },
        { brand: "Audi", model: "Q5", year: 2018, mpg: 30 },
      ]);

      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((car) => {
        expect(car.brand).toBe("Audi");
        expect(car.year).toBeGreaterThanOrEqual(2015);
      });
    });
  });
});
