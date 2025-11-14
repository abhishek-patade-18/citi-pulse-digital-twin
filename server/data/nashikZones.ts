import type { Zone, Point } from "@shared/schema";

// Nashik city zones with polygons
export const NASHIK_ZONES: Zone[] = [
  {
    id: "nashik_road",
    name: "Nashik Road",
    polygon: [
      { lat: 20.0025, lng: 73.78 },
      { lat: 20.0025, lng: 73.79 },
      { lat: 19.9975, lng: 73.79 },
      { lat: 19.9975, lng: 73.78 },
    ],
    sensors: [1, 2],
    avgAqi: 75,
    avgTemp: 28.5,
    color: "#4ade80",
  },
  {
    id: "panchavati",
    name: "Panchavati",
    polygon: [
      { lat: 20.0025, lng: 73.79 },
      { lat: 20.0025, lng: 73.80 },
      { lat: 19.9975, lng: 73.80 },
      { lat: 19.9975, lng: 73.79 },
    ],
    sensors: [3, 4],
    avgAqi: 68,
    avgTemp: 28.2,
    color: "#10b981",
  },
  {
    id: "cidco",
    name: "CIDCO",
    polygon: [
      { lat: 19.9975, lng: 73.78 },
      { lat: 19.9975, lng: 73.79 },
      { lat: 19.9925, lng: 73.79 },
      { lat: 19.9925, lng: 73.78 },
    ],
    sensors: [5, 6],
    avgAqi: 82,
    avgTemp: 29.0,
    color: "#facc15",
  },
  {
    id: "industrial",
    name: "Industrial Area",
    polygon: [
      { lat: 19.9975, lng: 73.79 },
      { lat: 19.9975, lng: 73.80 },
      { lat: 19.9925, lng: 73.80 },
      { lat: 19.9925, lng: 73.79 },
    ],
    sensors: [7, 8],
    avgAqi: 95,
    avgTemp: 29.5,
    color: "#fb923c",
  },
];

// Pollution hotspots
export const POLLUTION_HOTSPOTS: Point[] = [
  { lat: 19.9965, lng: 73.7895 },
  { lat: 19.9945, lng: 73.7955 },
  { lat: 19.9985, lng: 73.7975 },
];

// Traffic hotspots
export const TRAFFIC_HOTSPOTS: Point[] = [
  { lat: 20.0015, lng: 73.7885 },
  { lat: 19.9955, lng: 73.7925 },
  { lat: 19.9995, lng: 73.7965 },
];

// Crowd density zones
export const CROWD_ZONES: Point[] = [
  { lat: 20.0005, lng: 73.7905 },
  { lat: 19.9975, lng: 73.7945 },
  { lat: 19.9945, lng: 73.7975 },
];
