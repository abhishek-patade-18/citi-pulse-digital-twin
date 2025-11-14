import type { Sensor, Alert, Zone, SensorReading, AnalyticsData, DashboardStats } from "@shared/schema";
import { randomUUID } from "crypto";
import { SENSOR_LOCATIONS } from "./data/nashikSensors";
import { NASHIK_ZONES } from "./data/nashikZones";
import { getDummyAirQualityData, checkAQIAlert } from "./modules/airQuality";
import { getDummyWeatherData, checkTemperatureAlert, checkHumidityAlert } from "./modules/weather";
import { getDummyWaterData, checkCO2Alert } from "./modules/water";

export interface IStorage {
  getSensors(): Promise<Sensor[]>;
  getSensor(id: number): Promise<Sensor | undefined>;
  getAlerts(): Promise<Alert[]>;
  getZones(): Promise<Zone[]>;
  getDashboardStats(): Promise<DashboardStats>;
  getAnalyticsData(sensorId: number): Promise<AnalyticsData[]>;
  generateSensorReading(sensorId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private sensors: Map<number, Sensor>;
  private alerts: Alert[];
  private zones: Map<string, Zone>;

  constructor() {
    this.sensors = new Map();
    this.alerts = [];
    this.zones = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Initialize sensors - convert to match Sensor interface
    SENSOR_LOCATIONS.forEach((loc) => {
      this.sensors.set(loc.id, {
        id: loc.id,
        name: loc.name,
        type: loc.type,
        lat: loc.lat.toString(),
        lng: loc.lng.toString(),
        color: "#10b981",
        isGlowing: 0,
        readings: [],
        alerts: [],
        predictedAqi: 0,
        predictedTemp: 0,
      });
    });

    // Initialize zones
    NASHIK_ZONES.forEach((zone) => {
      this.zones.set(zone.id, {
        ...zone,
        polygon: zone.polygon as any,
        sensors: zone.sensors as any,
        avgTemp: zone.avgTemp.toString(),
      });
    });

    // Generate initial readings for all sensors
    this.sensors.forEach((_, sensorId) => {
      for (let i = 0; i < 20; i++) {
        const timestamp = new Date(Date.now() - (20 - i) * 5 * 60 * 1000); // 5 min intervals
        this.generateSensorReadingAtTime(sensorId, timestamp);
      }
    });
  }

  private generateSensorReadingAtTime(sensorId: number, timestamp: Date) {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) return;

    const airData = getDummyAirQualityData(sensor.name, timestamp);
    const weatherData = getDummyWeatherData(sensor.name, timestamp);
    const waterData = getDummyWaterData(sensor.name, timestamp);

    const reading: SensorReading = {
      id: randomUUID(),
      sensorId: sensorId,
      timestamp: timestamp,
      temperature: weatherData.temperature.toString(),
      humidity: weatherData.humidity.toString(),
      aqi: airData.aqi,
      co2: waterData.co2,
    };

    sensor.readings.push(reading);
    if (sensor.readings.length > 100) {
      sensor.readings.shift();
    }

    sensor.predictedAqi = airData.aqi;
    sensor.predictedTemp = weatherData.temperature;

    // Update sensor color based on AQI
    if (airData.aqi > 100) {
      sensor.color = "#f97316";
      sensor.isGlowing = 1;
    } else if (airData.aqi > 50) {
      sensor.color = "#facc15";
      sensor.isGlowing = 0;
    } else {
      sensor.color = "#10b981";
      sensor.isGlowing = 0;
    }

    // Check for alerts
    this.checkAndCreateAlerts(sensor, reading);
  }

  private checkAndCreateAlerts(sensor: Sensor, reading: SensorReading) {
    const aqiAlert = checkAQIAlert(reading.aqi);
    const tempAlert = checkTemperatureAlert(reading.temperature);
    const humidityAlert = checkHumidityAlert(reading.humidity);
    const co2Alert = checkCO2Alert(reading.co2);

    const alertChecks = [
      { alert: aqiAlert, parameter: "AQI", value: reading.aqi },
      { alert: tempAlert, parameter: "Temperature", value: reading.temperature },
      { alert: humidityAlert, parameter: "Humidity", value: reading.humidity },
      { alert: co2Alert, parameter: "CO2", value: reading.co2 },
    ];

    alertChecks.forEach(({ alert, parameter, value }) => {
      if (alert.level) {
        const newAlert: Alert = {
          id: randomUUID(),
          sensorName: sensor.name,
          parameter,
          value: value.toString(),
          threshold: alert.threshold.toString(),
          level: alert.level,
          timestamp: reading.timestamp,
        };

        this.alerts.unshift(newAlert);
        sensor.alerts.unshift(newAlert);

        // Keep only last 10 alerts per sensor
        if (sensor.alerts.length > 10) {
          sensor.alerts.pop();
        }

        // Keep only last 50 global alerts
        if (this.alerts.length > 50) {
          this.alerts.pop();
        }
      }
    });
  }

  async generateSensorReading(sensorId: number): Promise<void> {
    this.generateSensorReadingAtTime(sensorId, new Date());
  }

  async getSensors(): Promise<Sensor[]> {
    return Array.from(this.sensors.values());
  }

  async getSensor(id: number): Promise<Sensor | undefined> {
    return this.sensors.get(id);
  }

  async getAlerts(): Promise<Alert[]> {
    return this.alerts.slice(0, 20); // Return latest 20 alerts
  }

  async getZones(): Promise<Zone[]> {
    return Array.from(this.zones.values());
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const sensors = Array.from(this.sensors.values());
    
    let totalTemp = 0;
    let totalHumidity = 0;
    let totalAqi = 0;
    let totalCo2 = 0;
    let count = 0;

    sensors.forEach((sensor) => {
      const latest = sensor.readings[sensor.readings.length - 1];
      if (latest) {
        totalTemp += parseFloat(latest.temperature);
        totalHumidity += parseFloat(latest.humidity);
        totalAqi += latest.aqi;
        totalCo2 += latest.co2;
        count++;
      }
    });

    const avgTemp = count > 0 ? totalTemp / count : 0;
    const avgHumidity = count > 0 ? totalHumidity / count : 0;
    const avgAqi = count > 0 ? totalAqi / count : 0;
    const avgCo2 = count > 0 ? totalCo2 / count : 0;

    // Calculate Campus Green Index (CGI)
    const aqiScore = Math.max(0, 100 - avgAqi);
    const co2Score = Math.max(0, 100 - (avgCo2 / 15));
    const campusGreenIndex = (aqiScore + co2Score) / 2;

    let campusHealthStatus = "Excellent";
    if (avgAqi > 100 || campusGreenIndex < 50) {
      campusHealthStatus = "Poor";
    } else if (avgAqi > 50 || campusGreenIndex < 70) {
      campusHealthStatus = "Moderate";
    } else {
      campusHealthStatus = "Good";
    }

    return {
      avgTemp,
      avgHumidity,
      avgAqi,
      avgCo2,
      campusGreenIndex,
      campusHealthStatus,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getAnalyticsData(sensorId: number): Promise<AnalyticsData[]> {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) return [];

    return sensor.readings.map((reading) => ({
      timestamp: new Date(reading.timestamp).toLocaleTimeString(),
      aqi: reading.aqi,
      temperature: parseFloat(reading.temperature),
      humidity: parseFloat(reading.humidity),
      co2: reading.co2,
    }));
  }
}

export const storage = new MemStorage();
