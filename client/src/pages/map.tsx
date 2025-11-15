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
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

const viewModes = [
  { name: "🛣️ Streets", value: "streets-v12" },
  { name: "🛰️ Satellite", value: "satellite-streets-v12" },
  { name: "🌫️ AQI Heatmap", value: "heatmap" },
  { name: "🌿 Greenery Map", value: "greenery" },
  { name: "🚗 Crowd/Traffic", value: "density" },
];

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [viewMode, setViewMode] = useState("streets-v12");
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<any[]>([]);

  const { data: sensors = [] } = useQuery<Sensor[]>({
    queryKey: ["/api/sensors"],
    refetchInterval: 5000,
  });

  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!mapContainer.current || !window.mapboxgl) return;

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

  useEffect(() => {
    if (map.current && mapLoaded) {
      clearMarkers();
      addSensorsToMap();
    }
  }, [sensors, mapLoaded]);

  useEffect(() => {
    if (map.current && mapLoaded) {
      updateZonesOnMap();
    }
  }, [zones, mapLoaded, viewMode]);

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  const clearAllLayers = () => {
    if (!map.current || !map.current.getStyle()) return;

    const layersToRemove = [
      'aqi-heatmap',
      'density-heatmap',
      'greenery-heatmap',
      'greenery-zones-layer',
      'greenery-zones-outline'
    ];

    layersToRemove.forEach(layerId => {
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
    });

    const sourcesToRemove = [
      'aqi-heatmap-source',
      'density-heatmap-source',
      'greenery-heatmap-source',
      'greenery-zones-source'
    ];

    sourcesToRemove.forEach(sourceId => {
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });

    zones.forEach((zone) => {
      if (map.current.getLayer(`zone-fill-${zone.id}`)) {
        map.current.removeLayer(`zone-fill-${zone.id}`);
      }
      if (map.current.getLayer(`zone-outline-${zone.id}`)) {
        map.current.removeLayer(`zone-outline-${zone.id}`);
      }
      if (map.current.getSource(`zone-${zone.id}`)) {
        map.current.removeSource(`zone-${zone.id}`);
      }
    });
  };

  const updateMapStyle = () => {
    if (!map.current) return;

    clearAllLayers();

    if (viewMode === "streets-v12" || viewMode === "satellite-streets-v12") {
      map.current.setStyle(`mapbox://styles/mapbox/${viewMode}`);
      map.current.once('style.load', () => {
        addZonesToMap();
      });
    } else if (viewMode === "heatmap") {
      map.current.setStyle('mapbox://styles/mapbox/streets-v12');
      map.current.once('style.load', () => {
        addAQILayer();
      });
    } else if (viewMode === "greenery") {
      map.current.setStyle('mapbox://styles/mapbox/streets-v12');
      map.current.once('style.load', () => {
        addGreeneryLayer();
      });
    } else if (viewMode === "density") {
      map.current.setStyle('mapbox://styles/mapbox/streets-v12');
      map.current.once('style.load', () => {
        addCrowdLayer();
      });
    }
  };

  const addSensorsToMap = () => {
    if (!map.current || sensors.length === 0) return;

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

      // Check if coordinates are valid numbers
      if (isNaN(sensorLat) || isNaN(sensorLng)) {
        console.warn(`Invalid coordinates for sensor ${sensor.name}:`, sensor.lat, sensor.lng);
        return;
      }

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([sensorLng, sensorLat])
        .setPopup(
          new window.mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <h3 class="font-bold">${sensor.name}</h3>
              <p class="text-sm">AQI: ${(sensor.predictedAqi || 0).toFixed(0)}</p>
              <p class="text-sm">Temp: ${(sensor.predictedTemp || 0).toFixed(1)}°C</p>
            </div>`
          )
        )
        .addTo(map.current);

      markersRef.current.push(marker);
    });
  };

  const addZonesToMap = () => {
    if (!map.current || zones.length === 0 || !map.current.isStyleLoaded()) return;

    zones.forEach((zone) => {
      if (map.current.getSource(`zone-${zone.id}`)) return;

      // Validate polygon data
      if (!zone.polygon || !Array.isArray(zone.polygon) || zone.polygon.length === 0) {
        console.warn(`Invalid polygon data for zone ${zone.id}`);
        return;
      }

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
          "fill-color": zone.color || "#3388ff",
          "fill-opacity": 0.3,
        },
      });

      map.current.addLayer({
        id: `zone-outline-${zone.id}`,
        type: "line",
        source: `zone-${zone.id}`,
        paint: {
          "line-color": zone.color || "#3388ff",
          "line-width": 2,
        },
      });
    });
  };

  const updateZonesOnMap = () => {
    if (viewMode === "streets-v12" || viewMode === "satellite-streets-v12") {
      addZonesToMap();
    }
  };

  const addAQILayer = () => {
    if (!map.current || sensors.length === 0 || !map.current.isStyleLoaded()) return;

    const features = sensors.map((sensor) => {
      const sensorLat = typeof sensor.lat === 'string' ? parseFloat(sensor.lat) : sensor.lat;
      const sensorLng = typeof sensor.lng === 'string' ? parseFloat(sensor.lng) : sensor.lng;

      // Skip invalid coordinates
      if (isNaN(sensorLat) || isNaN(sensorLng)) {
        return null;
      }

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [sensorLng, sensorLat],
        },
        properties: {
          aqi: sensor.predictedAqi || 50,
        },
      };
    }).filter(Boolean); // Remove null entries

    if (features.length === 0) return;

    const geojsonData = {
      type: "FeatureCollection",
      features: features,
    };

    if (!map.current.getSource('aqi-heatmap-source')) {
      map.current.addSource('aqi-heatmap-source', {
        type: "geojson",
        data: geojsonData,
      });
    } else {
      map.current.getSource('aqi-heatmap-source').setData(geojsonData);
    }

    if (!map.current.getLayer('aqi-heatmap')) {
      map.current.addLayer({
        id: 'aqi-heatmap',
        type: 'heatmap',
        source: 'aqi-heatmap-source',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'aqi'],
            0, 0,
            400, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.8,
            15, 2
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,255,0,0)',
            0.2, 'rgba(0,255,0,0.5)',
            0.4, 'rgba(255,255,0,0.6)',
            0.6, 'rgba(255,165,0,0.7)',
            0.8, 'rgba(255,69,0,0.8)',
            1, 'rgba(139,0,0,0.85)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 4,
            15, 50
          ],
          'heatmap-opacity': 0.65,
        },
      });
    }
  };

  const addGreeneryLayer = () => {
    if (!map.current) return;

    if (!map.current.isStyleLoaded()) {
      setTimeout(() => addGreeneryLayer(), 100);
      return;
    }

    const greeneryPoints = [];
    
    const latRange = 0.15;
    const lngRange = 0.15;
    const minLat = NASHIK_CENTER.lat - latRange / 2;
    const maxLat = NASHIK_CENTER.lat + latRange / 2;
    const minLng = NASHIK_CENTER.lng - lngRange / 2;
    const maxLng = NASHIK_CENTER.lng + lngRange / 2;

    const gridSize = 20;
    const latStep = (maxLat - minLat) / gridSize;
    const lngStep = (maxLng - minLng) / gridSize;

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const lat = minLat + i * latStep;
        const lng = minLng + j * lngStep;
        
        const distFromCenter = Math.sqrt(
          Math.pow(lat - NASHIK_CENTER.lat, 2) + 
          Math.pow(lng - NASHIK_CENTER.lng, 2)
        );
        
        let greeneryDensity = Math.min(100, (distFromCenter * 10000) + (Math.random() * 40));
        
        if (Math.random() > 0.85) {
          greeneryDensity = 80 + Math.random() * 20;
        }
        
        greeneryPoints.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          properties: {
            greenery: greeneryDensity,
          },
        });
      }
    }

    zones.forEach((zone) => {
      if (!zone.polygon || !Array.isArray(zone.polygon)) return;
      
      const numPoints = 5;
      for (let i = 0; i < numPoints; i++) {
        const randomPoint = zone.polygon[Math.floor(Math.random() * zone.polygon.length)];
        const greenery = 60 + Math.random() * 40;
        
        greeneryPoints.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [randomPoint.lng, randomPoint.lat],
          },
          properties: {
            greenery: greenery,
          },
        });
      }
    });

    const geojsonData = {
      type: "FeatureCollection",
      features: greeneryPoints,
    };

    if (!map.current.getSource('greenery-heatmap-source')) {
      map.current.addSource('greenery-heatmap-source', {
        type: "geojson",
        data: geojsonData,
      });
    } else {
      map.current.getSource('greenery-heatmap-source').setData(geojsonData);
    }

    if (!map.current.getLayer('greenery-heatmap')) {
      map.current.addLayer({
        id: 'greenery-heatmap',
        type: 'heatmap',
        source: 'greenery-heatmap-source',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'greenery'],
            0, 0,
            100, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.6,
            15, 1.5
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(139,69,19,0)',
            0.2, 'rgba(139,69,19,0.4)',
            0.4, 'rgba(184,134,11,0.5)',
            0.6, 'rgba(255,255,0,0.5)',
            0.75, 'rgba(154,205,50,0.6)',
            0.85, 'rgba(34,139,34,0.65)',
            1, 'rgba(0,100,0,0.7)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 5,
            15, 60
          ],
          'heatmap-opacity': 0.6,
        },
      });
    }
  };

  const addCrowdLayer = () => {
    if (!map.current) return;

    if (!map.current.isStyleLoaded()) {
      setTimeout(() => addCrowdLayer(), 100);
      return;
    }

    const crowdPoints = [];

    sensors.forEach((sensor) => {
      const sensorLat = typeof sensor.lat === 'string' ? parseFloat(sensor.lat) : sensor.lat;
      const sensorLng = typeof sensor.lng === 'string' ? parseFloat(sensor.lng) : sensor.lng;
      
      // Skip invalid coordinates
      if (isNaN(sensorLat) || isNaN(sensorLng)) {
        return;
      }
      
      const density = Math.min(100, (sensor.predictedAqi || 50) * 0.6 + Math.random() * 25);
      
      crowdPoints.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [sensorLng, sensorLat],
        },
        properties: {
          density: density,
        },
      });
    });

    const roadPoints = 30;
    for (let i = 0; i < roadPoints; i++) {
      const angle = (Math.PI * 2 * i) / roadPoints;
      const distance = 0.01 + Math.random() * 0.02;
      const lat = NASHIK_CENTER.lat + Math.sin(angle) * distance;
      const lng = NASHIK_CENTER.lng + Math.cos(angle) * distance;
      
      const distFromCenter = Math.sqrt(
        Math.pow(lat - NASHIK_CENTER.lat, 2) + 
        Math.pow(lng - NASHIK_CENTER.lng, 2)
      );
      const baseDensity = Math.max(30, 90 - (distFromCenter * 2000));
      const density = baseDensity + Math.random() * 20;
      
      crowdPoints.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        properties: {
          density: density,
        },
      });
    }

    zones.forEach((zone) => {
      if (!zone.polygon || !Array.isArray(zone.polygon)) return;
      
      const numPoints = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < numPoints; i++) {
        const randomPoint = zone.polygon[Math.floor(Math.random() * zone.polygon.length)];
        const density = 20 + Math.random() * 60;
        
        crowdPoints.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [randomPoint.lng, randomPoint.lat],
          },
          properties: {
            density: density,
          },
        });
      }
    });

    const geojsonData = {
      type: "FeatureCollection",
      features: crowdPoints,
    };

    if (!map.current.getSource('density-heatmap-source')) {
      map.current.addSource('density-heatmap-source', {
        type: "geojson",
        data: geojsonData,
      });
    } else {
      map.current.getSource('density-heatmap-source').setData(geojsonData);
    }

    if (!map.current.getLayer('density-heatmap')) {
      map.current.addLayer({
        id: 'density-heatmap',
        type: 'heatmap',
        source: 'density-heatmap-source',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'density'],
            0, 0,
            100, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.9,
            15, 2.2
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,255,0,0)',
            0.2, 'rgba(0,255,0,0.5)',
            0.4, 'rgba(255,255,0,0.6)',
            0.6, 'rgba(255,165,0,0.7)',
            0.8, 'rgba(255,69,0,0.75)',
            1, 'rgba(255,0,0,0.8)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 4,
            15, 45
          ],
          'heatmap-opacity': 0.7,
        },
      });
    }
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

      {(viewMode === "greenery" || viewMode === "heatmap" || viewMode === "density") && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-bold text-sm mb-3 text-slate-800">
            {viewMode === "greenery" && "Greenery Density"}
            {viewMode === "heatmap" && "Air Quality Index"}
            {viewMode === "density" && "Traffic Density"}
          </p>
          <div className="space-y-2">
            {viewMode === "greenery" && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(139,69,19,0.6)' }}></div>
                  <span className="text-xs">Low / Barren</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(255,255,0,0.6)' }}></div>
                  <span className="text-xs">Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(154,205,50,0.7)' }}></div>
                  <span className="text-xs">Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(0,100,0,0.7)' }}></div>
                  <span className="text-xs">High / Dense</span>
                </div>
              </>
            )}
            {viewMode === "heatmap" && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(0,255,0,0.6)' }}></div>
                  <span className="text-xs">Good (0-50)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(255,255,0,0.7)' }}></div>
                  <span className="text-xs">Moderate (51-100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(255,165,0,0.7)' }}></div>
                  <span className="text-xs">Unhealthy (101-200)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(139,0,0,0.8)' }}></div>
                  <span className="text-xs">Hazardous (200+)</span>
                </div>
              </>
            )}
            {viewMode === "density" && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(0,255,0,0.6)' }}></div>
                  <span className="text-xs">Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(255,255,0,0.7)' }}></div>
                  <span className="text-xs">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(255,165,0,0.7)' }}></div>
                  <span className="text-xs">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(255,0,0,0.8)' }}></div>
                  <span className="text-xs">Very High</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}