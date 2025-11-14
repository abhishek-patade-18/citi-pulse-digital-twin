import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnalyticsData, Sensor } from "@shared/schema";

const TOOLTIP_STYLE = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "0.5rem",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
};

function ChartCard({ title, dataKey, color, data }: { title: string; dataKey: string; color: string; data: AnalyticsData[] }) {
  return (
    <div className="bg-white/90 p-6 rounded-2xl shadow-xl border border-emerald-100" data-testid={`chart-${dataKey}`}>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={false} />
          <XAxis
            dataKey="timestamp"
            angle={-45}
            textAnchor="end"
            height={50}
            stroke="#A1A1AA"
          />
          <YAxis width={30} stroke="#A1A1AA" />
          <Line
            type="natural"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AnalyticsPage() {
  const [selectedSensorId, setSelectedSensorId] = useState("1");

  const { data: sensors = [] } = useQuery<Sensor[]>({
    queryKey: ["/api/sensors"],
    refetchInterval: 5000, // Refetch for live sensor list
  });

  const { data: analyticsData = [], isLoading } = useQuery<AnalyticsData[]>({
    queryKey: ["/api/analytics", selectedSensorId],
    refetchInterval: 5000, // Refetch every 5 seconds for live chart updates
  });

  const handleExportCSV = () => {
    const csvContent = [
      ["Timestamp", "AQI", "Temperature", "Humidity", "CO2"],
      ...analyticsData.map((d) => [
        d.timestamp,
        d.aqi,
        d.temperature,
        d.humidity,
        d.co2,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-sensor-${selectedSensorId}-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent" data-testid="heading-analytics">
            Analytics & Insights
          </h1>
          <p className="text-slate-500 mt-1">
            Analyze historical data and trends for each sensor.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedSensorId} onValueChange={setSelectedSensorId}>
            <SelectTrigger className="w-[200px] bg-white/80 backdrop-blur-md rounded-lg shadow-sm border-emerald-200" data-testid="select-sensor">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sensors.map((sensor) => (
                <SelectItem key={sensor.id} value={sensor.id.toString()}>
                  {sensor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleExportCSV}
            className="bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition-all"
            data-testid="button-export-csv"
          >
            Export CSV
            <Download className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard
          title="Air Quality Index (AQI)"
          dataKey="aqi"
          color="#10B981"
          data={analyticsData}
        />
        <ChartCard
          title="Temperature (°C)"
          dataKey="temperature"
          color="#F97316"
          data={analyticsData}
        />
        <ChartCard
          title="Humidity (%)"
          dataKey="humidity"
          color="#3B82F6"
          data={analyticsData}
        />
        <ChartCard
          title="CO₂ Levels (ppm)"
          dataKey="co2"
          color="#6B7280"
          data={analyticsData}
        />
      </div>
    </div>
  );
}
