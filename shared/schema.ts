import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Drizzle table schemas for future database persistence
export const sensors = pgTable("sensors", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  lat: decimal("lat", { precision: 10, scale: 6 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 6 }).notNull(),
  color: text("color").default("#10b981"),
  isGlowing: integer("is_glowing").default(0),
});

export const sensorReadings = pgTable("sensor_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sensorId: integer("sensor_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }).notNull(),
  humidity: decimal("humidity", { precision: 5, scale: 2 }).notNull(),
  aqi: integer("aqi").notNull(),
  co2: integer("co2").notNull(),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sensorName: text("sensor_name").notNull(),
  parameter: text("parameter").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  threshold: decimal("threshold", { precision: 10, scale: 2 }).notNull(),
  level: text("level").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const zones = pgTable("zones", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  polygon: jsonb("polygon").notNull(),
  sensors: jsonb("sensors").notNull(),
  avgAqi: integer("avg_aqi").default(0),
  avgTemp: decimal("avg_temp", { precision: 5, scale: 2 }).default("0"),
  color: text("color").default("#4ade80"),
});

// Zod insert schemas
export const insertSensorSchema = createInsertSchema(sensors).omit({
  color: true,
  isGlowing: true,
});

export const insertSensorReadingSchema = createInsertSchema(sensorReadings).omit({
  id: true,
  timestamp: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
});

export const insertZoneSchema = createInsertSchema(zones);

// TypeScript types from Drizzle tables
export type Sensor = typeof sensors.$inferSelect & {
  readings: SensorReading[];
  alerts: Alert[];
  predictedAqi: number;
  predictedTemp: number;
};

export type InsertSensor = z.infer<typeof insertSensorSchema>;
export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Zone = typeof zones.$inferSelect;
export type InsertZone = z.infer<typeof insertZoneSchema>;

// Additional TypeScript interfaces for app logic
export interface Point {
  lat: number;
  lng: number;
}

export interface MovingObject {
  id: number;
  type: "person" | "vehicle";
  lat: number;
  lng: number;
  path: Point[];
  progress: number;
}

export interface AnalyticsData {
  timestamp: string;
  aqi: number;
  temperature: number;
  humidity: number;
  co2: number;
}

export interface DashboardStats {
  avgTemp: number;
  avgHumidity: number;
  avgAqi: number;
  avgCo2: number;
  campusGreenIndex: number;
  campusHealthStatus: string;
  lastUpdated: string;
}
