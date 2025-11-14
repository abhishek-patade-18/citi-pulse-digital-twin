// Water Module - Generates water quality and CO2 data

export interface WaterData {
  co2: number; // ppm
  waterQuality: number; // 0-100
  ph: number;
}

const BASE_CO2 = 500;

export function getDummyWaterData(locationName: string, timestamp: Date = new Date()): WaterData {
  const hour = timestamp.getHours();
  const isDaytime = hour >= 6 && hour <= 18;
  
  // CO2 tends to be higher indoors and during the day
  const timeModifier = isDaytime ? Math.random() * 100 : Math.random() * 50;
  
  // Location-specific modifiers
  let locationModifier = 0;
  if (locationName.includes("Canteen") || locationName.includes("Building")) {
    locationModifier = Math.random() * 100 + 50; // Higher indoors
  } else if (locationName.includes("Ground") || locationName.includes("Residential")) {
    locationModifier = Math.random() * -50; // Lower outdoors
  }
  
  const co2 = BASE_CO2 + timeModifier + locationModifier;
  const waterQuality = Math.round(Math.random() * 20 + 75); // Generally good 75-95
  const ph = Math.round((Math.random() * 2 + 6.5) * 10) / 10; // 6.5-8.5
  
  return {
    co2: Math.round(Math.max(300, co2)),
    waterQuality,
    ph,
  };
}

export function checkCO2Alert(co2: number): { level: "warning" | "critical" | null; threshold: number } {
  if (co2 >= 1200) {
    return { level: "critical", threshold: 1200 };
  } else if (co2 >= 900) {
    return { level: "warning", threshold: 900 };
  }
  return { level: null, threshold: 0 };
}
