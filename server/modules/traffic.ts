// Traffic Module - Generates traffic and congestion data

export interface TrafficData {
  congestionLevel: number; // 0-100
  vehicleCount: number;
  averageSpeed: number; // km/h
  status: string;
}

export function getDummyTrafficData(locationName: string, timestamp: Date = new Date()): TrafficData {
  const hour = timestamp.getHours();
  
  let congestionLevel = 20; // Base level
  
  // Rush hours
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
    congestionLevel += Math.random() * 40 + 30; // 50-90 during rush
  } else if (hour >= 22 || hour <= 5) {
    congestionLevel = Math.random() * 15; // Low at night
  } else {
    congestionLevel += Math.random() * 30;
  }
  
  congestionLevel = Math.min(100, Math.max(0, congestionLevel));
  
  const vehicleCount = Math.round(congestionLevel * 5 + Math.random() * 50);
  const averageSpeed = Math.round(60 - (congestionLevel * 0.5));
  
  let status = "Light";
  if (congestionLevel > 70) status = "Heavy";
  else if (congestionLevel > 40) status = "Moderate";
  
  return {
    congestionLevel: Math.round(congestionLevel),
    vehicleCount,
    averageSpeed,
    status,
  };
}

export function checkTrafficAlert(congestionLevel: number): { level: "warning" | "critical" | null; threshold: number } {
  if (congestionLevel >= 80) {
    return { level: "critical", threshold: 80 };
  } else if (congestionLevel >= 60) {
    return { level: "warning", threshold: 60 };
  }
  return { level: null, threshold: 0 };
}
