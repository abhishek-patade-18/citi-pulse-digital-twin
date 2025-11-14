import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { MapPin, Thermometer, Wind, Droplets, Activity } from "lucide-react";
import type { Sensor } from "@shared/schema";

function SensorCard({ sensor }: { sensor: Sensor }) {
  const latestReading = sensor.readings[sensor.readings.length - 1];

  return (
    <Card className="p-6 rounded-2xl bg-white/90 shadow-xl border border-emerald-100 hover:shadow-2xl transition-all" data-testid={`card-sensor-${sensor.id}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800" data-testid={`text-sensor-name-${sensor.id}`}>
            {sensor.name}
          </h3>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {sensor.type}
          </p>
        </div>
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: sensor.color }}
        />
      </div>

      {latestReading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-slate-500">Temperature</p>
              <p className="font-semibold" data-testid={`text-sensor-temp-${sensor.id}`}>
                {parseFloat(latestReading.temperature).toFixed(1)}°C
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-slate-500">Humidity</p>
              <p className="font-semibold" data-testid={`text-sensor-humidity-${sensor.id}`}>
                {parseFloat(latestReading.humidity).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-xs text-slate-500">AQI</p>
              <p className="font-semibold" data-testid={`text-sensor-aqi-${sensor.id}`}>
                {latestReading.aqi}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-slate-500">CO₂</p>
              <p className="font-semibold" data-testid={`text-sensor-co2-${sensor.id}`}>
                {latestReading.co2} ppm
              </p>
            </div>
          </div>
        </div>
      )}

      {sensor.alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-emerald-100">
          <p className="text-xs font-semibold text-red-600">
            {sensor.alerts.length} Active Alert{sensor.alerts.length > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </Card>
  );
}

export default function SensorsPage() {
  const { data: sensors = [], isLoading } = useQuery<Sensor[]>({
    queryKey: ["/api/sensors"],
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const campusSensors = sensors.filter((s) => s.type === "Campus");
  const nearbySensors = sensors.filter((s) => s.type === "Nearby");

  return (
    <div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent mb-6" data-testid="heading-sensors">
        Sensor Network
      </h1>

      {campusSensors.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">Campus Sensors</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campusSensors.map((sensor) => (
              <SensorCard key={sensor.id} sensor={sensor} />
            ))}
          </div>
        </div>
      )}

      {nearbySensors.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">Nearby Sensors</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbySensors.map((sensor) => (
              <SensorCard key={sensor.id} sensor={sensor} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
