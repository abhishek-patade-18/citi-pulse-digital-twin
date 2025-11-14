import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Get all sensors
  app.get("/api/sensors", async (_req, res) => {
    try {
      const sensors = await storage.getSensors();
      res.json(sensors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sensors" });
    }
  });

  // Get specific sensor
  app.get("/api/sensors/:id", async (req, res) => {
    try {
      const sensorId = parseInt(req.params.id);
      const sensor = await storage.getSensor(sensorId);
      if (sensor) {
        res.json(sensor);
      } else {
        res.status(404).json({ error: "Sensor not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sensor" });
    }
  });

  // Get all alerts
  app.get("/api/alerts", async (_req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Get all zones
  app.get("/api/zones", async (_req, res) => {
    try {
      const zones = await storage.getZones();
      res.json(zones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch zones" });
    }
  });

  // Get analytics data for a sensor
  app.get("/api/analytics/:sensorId", async (req, res) => {
    try {
      const sensorId = parseInt(req.params.sensorId);
      const analyticsData = await storage.getAnalyticsData(sensorId);
      res.json(analyticsData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  // Auto-refresh sensor data every 5 seconds
  setInterval(async () => {
    const sensors = await storage.getSensors();
    sensors.forEach((sensor) => {
      storage.generateSensorReading(sensor.id);
    });
  }, 5000);

  const httpServer = createServer(app);

  return httpServer;
}
