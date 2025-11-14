// Weather Module - Generates temperature, humidity, and weather data

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  condition: string;
}

const BASE_TEMP = 28;
const BASE_HUMIDITY = 55;

export function getDummyWeatherData(locationName: string, timestamp: Date = new Date()): WeatherData {
  const hour = timestamp.getHours();
  const isDaytime = hour >= 6 && hour <= 18;
  
  // Temperature varies with time of day
  let tempModifier = 0;
  if (hour >= 12 && hour <= 16) {
    tempModifier = Math.random() * 5 + 2; // Hottest during midday
  } else if (hour >= 0 && hour <= 5) {
    tempModifier = Math.random() * -3 - 1; // Coolest at night
  } else {
    tempModifier = Math.random() * 2 - 1;
  }
  
  const temperature = BASE_TEMP + tempModifier;
  const humidity = BASE_HUMIDITY + (Math.random() * 10 - 5);
  
  const windSpeed = Math.random() * 15 + 5; // 5-20 km/h
  const rainfall = Math.random() < 0.1 ? Math.random() * 10 : 0; // 10% chance of rain
  
  let condition = "Clear";
  if (rainfall > 5) condition = "Heavy Rain";
  else if (rainfall > 0) condition = "Light Rain";
  else if (humidity > 70) condition = "Cloudy";
  
  return {
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(Math.max(0, Math.min(100, humidity)) * 10) / 10,
    windSpeed: Math.round(windSpeed * 10) / 10,
    rainfall: Math.round(rainfall * 10) / 10,
    condition,
  };
}

export function checkTemperatureAlert(temp: number): { level: "warning" | "critical" | null; threshold: number } {
  if (temp >= 37) {
    return { level: "critical", threshold: 37 };
  } else if (temp >= 33) {
    return { level: "warning", threshold: 33 };
  }
  return { level: null, threshold: 0 };
}

export function checkHumidityAlert(humidity: number): { level: "warning" | "critical" | null; threshold: number } {
  if (humidity >= 85 || humidity <= 15) {
    return { level: "critical", threshold: humidity >= 85 ? 85 : 15 };
  } else if (humidity >= 75 || humidity <= 25) {
    return { level: "warning", threshold: humidity >= 75 ? 75 : 25 };
  }
  return { level: null, threshold: 0 };
}
