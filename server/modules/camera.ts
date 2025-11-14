// Camera Module - Generates crowd density and people counting data

export interface CameraData {
  crowdDensity: number; // 0-100
  peopleCount: number;
  status: string;
}

export function getDummyCameraData(locationName: string, timestamp: Date = new Date()): CameraData {
  const hour = timestamp.getHours();
  
  let crowdDensity = 20; // Base level
  
  // Peak hours for public spaces
  if (hour >= 9 && hour <= 12) {
    crowdDensity += Math.random() * 40 + 20; // Morning peak
  } else if (hour >= 16 && hour <= 20) {
    crowdDensity += Math.random() * 50 + 30; // Evening peak
  } else if (hour >= 22 || hour <= 6) {
    crowdDensity = Math.random() * 10; // Very low at night
  } else {
    crowdDensity += Math.random() * 25;
  }
  
  crowdDensity = Math.min(100, Math.max(0, crowdDensity));
  
  const peopleCount = Math.round(crowdDensity * 3 + Math.random() * 20);
  
  let status = "Low";
  if (crowdDensity > 70) status = "High";
  else if (crowdDensity > 40) status = "Medium";
  
  return {
    crowdDensity: Math.round(crowdDensity),
    peopleCount,
    status,
  };
}

export function checkCrowdAlert(crowdDensity: number): { level: "warning" | "critical" | null; threshold: number } {
  if (crowdDensity >= 85) {
    return { level: "critical", threshold: 85 };
  } else if (crowdDensity >= 70) {
    return { level: "warning", threshold: 70 };
  }
  return { level: null, threshold: 0 };
}
