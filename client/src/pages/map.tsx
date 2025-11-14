import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { Sensor, Zone } from "@shared/schema";

declare global {
  interface Window {
    mapboxgl: any;
  }
}

const NASHIK_CENTER = { lng: 73.7898, lat: 19.9975 };
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ""; // Get from environment

const viewModes = [
  { name: "Streets", value: "streets-v12" },
  { name: "Satellite", value: "satellite-streets-v12" },
  { name: "Heatmap", value: "heatmap" },
  { name: "AQI Overlay", value: "aqi" },
  { name: "CO₂ Zones", value: "co2" },
];

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [viewMode, setViewMode] = useState("streets-v12");
  const [mapLoaded, setMapLoaded] = useState(false);

  const { data: sensors = [] } = useQuery<Sensor[]>({
    queryKey: ["/api/sensors"],
    refetchInterval: 5000, // Refetch every 5 seconds for live map updates
  });

  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
    refetchInterval: 10000, // Refetch every 10 seconds (zones change less frequently)
  });

  useEffect(() => {
    if (!mapContainer.current || !window.mapboxgl) return;

    // Check if Mapbox token is available
    if (!MAPBOX_TOKEN) {
      console.warn("Mapbox token not found. Map functionality will be limited.");
      return;
    }

    try {
      window.mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: `mapbox://styles/mapbox/${viewMode}`,
        center: [NASHIK_CENTER.lng, NASHIK_CENTER.lat],
        zoom: 12,
        pitch: 45,
        bearing: 0,
      });

      map.current.on("load", () => {
        setMapLoaded(true);
        addSensorsToMap();
        addZonesToMap();
      });

      map.current.addControl(new window.mapboxgl.NavigationControl());

      return () => {
        if (map.current) {
          map.current.remove();
        }
      };
    } catch (error) {
      console.error("Map initialization error:", error);
    }
  }, []);

  useEffect(() => {
    if (map.current && mapLoaded) {
      updateMapStyle();
    }
  }, [viewMode, mapLoaded]);

  const updateMapStyle = () => {
    if (viewMode === "streets-v12" || viewMode === "satellite-streets-v12") {
      map.current.setStyle(`mapbox://styles/mapbox/${viewMode}`);
    } else if (viewMode === "heatmap") {
      addHeatmapLayer();
    } else if (viewMode === "aqi") {
      addAQIOverlay();
    } else if (viewMode === "co2") {
      addCO2Zones();
    }
  };

  const addSensorsToMap = () => {
    sensors.forEach((sensor) => {
      const el = document.createElement("div");
      el.className = "w-4 h-4 rounded-full cursor-pointer";
      el.style.backgroundColor = sensor.color || "#10b981";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

      if (sensor.isGlowing) {
        el.style.animation = "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite";
      }

      const sensorLat = typeof sensor.lat === 'string' ? parseFloat(sensor.lat) : sensor.lat;
      const sensorLng = typeof sensor.lng === 'string' ? parseFloat(sensor.lng) : sensor.lng;

      new window.mapboxgl.Marker(el)
        .setLngLat([sensorLng, sensorLat])
        .setPopup(
          new window.mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <h3 class="font-bold">${sensor.name}</h3>
              <p class="text-sm">AQI: ${sensor.predictedAqi.toFixed(0)}</p>
              <p class="text-sm">Temp: ${sensor.predictedTemp.toFixed(1)}°C</p>
            </div>`
          )
        )
        .addTo(map.current);
    });
  };

  const addZonesToMap = () => {
    zones.forEach((zone) => {
      if (map.current.getSource(`zone-${zone.id}`)) return;

      map.current.addSource(`zone-${zone.id}`, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [zone.polygon.map((p) => [p.lng, p.lat])],
          },
        },
      });

      map.current.addLayer({
        id: `zone-fill-${zone.id}`,
        type: "fill",
        source: `zone-${zone.id}`,
        paint: {
          "fill-color": zone.color,
          "fill-opacity": 0.3,
        },
      });

      map.current.addLayer({
        id: `zone-outline-${zone.id}`,
        type: "line",
        source: `zone-${zone.id}`,
        paint: {
          "line-color": zone.color,
          "line-width": 2,
        },
      });
    });
  };

  const addHeatmapLayer = () => {
    // Simplified heatmap visualization
    console.log("Heatmap mode activated");
  };

  const addAQIOverlay = () => {
    // Simplified AQI overlay
    console.log("AQI overlay mode activated");
  };

  const addCO2Zones = () => {
    // Simplified CO2 zones
    console.log("CO2 zones mode activated");
  };

  return (
    <div className="relative h-[calc(100vh-200px)] w-full rounded-2xl overflow-hidden shadow-xl">
      <div ref={mapContainer} className="w-full h-full" />

      <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-[1000] bg-white/50 backdrop-blur-md p-3 rounded-lg shadow-lg">
        {viewModes.map((mode) => (
          <Button
            key={mode.value}
            onClick={() => setViewMode(mode.value)}
            variant={viewMode === mode.value ? "default" : "secondary"}
            size="sm"
            className={
              viewMode === mode.value
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : ""
            }
            data-testid={`button-map-view-${mode.value}`}
          >
            {mode.name}
          </Button>
        ))}
      </div>

      <div className="absolute top-40 left-4 z-[1000] bg-white/70 backdrop-blur-md p-3 rounded-lg shadow-lg border border-slate-200 max-w-xs" data-testid="panel-map-controls">
        <p className="font-bold text-sm mb-2 text-slate-800">Map Controls</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => map.current?.flyTo({ center: [NASHIK_CENTER.lng, NASHIK_CENTER.lat], zoom: 12 })}
            data-testid="button-reset-view"
          >
            Reset View
          </Button>
        </div>
      </div>
    </div>
  );
}
