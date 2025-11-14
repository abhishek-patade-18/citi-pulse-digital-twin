// Air Quality Module - Generates AQI and related air quality data

export interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
}

const BASE_AQI = 70;
const TIME_VARIATION_FACTOR = 10;
const LOCATION_FACTORS: Record<string, number> = {
  "Main Gate": 5,
  "Highway Entrance": 15,
  "Industrial Zone": 25,
  "Residential Area": -5,
  "Nearby Road": 10,
};

export function getDummyAirQualityData(locationName: string, timestamp: Date = new Date()): AirQualityData {
  const hour = timestamp.getHours();
  const isDaytime = hour >= 6 && hour <= 18;
  
  // Higher pollution during day due to traffic
  const timeModifier = isDaytime ? TIME_VARIATION_FACTOR : -TIME_VARIATION_FACTOR / 2;
  
  // Location-specific modifier
  const locationModifier = LOCATION_FACTORS[locationName] || 0;
  
  // Random variation
  const randomVariation = Math.random() * 10 - 5;
  
  const aqi = Math.max(0, BASE_AQI + timeModifier + locationModifier + randomVariation);
  
  return {
    aqi: Math.round(aqi),
    pm25: Math.round(aqi * 0.4),
    pm10: Math.round(aqi * 0.6),
    no2: Math.round(aqi * 0.3),
    so2: Math.round(aqi * 0.2),
  };
}

export function checkAQIAlert(aqi: number): { level: "warning" | "critical" | null; threshold: number } {
  if (aqi >= 150) {
    return { level: "critical", threshold: 150 };
  } else if (aqi >= 100) {
    return { level: "warning", threshold: 100 };
  }
  return { level: null, threshold: 0 };
}
