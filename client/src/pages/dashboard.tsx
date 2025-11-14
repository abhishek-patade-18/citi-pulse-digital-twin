import { useQuery } from "@tanstack/react-query";
import { Thermometer, Droplets, Wind, Leaf, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardStats } from "@shared/schema";

function StatCard({ title, value, unit, icon: Icon }: { title: string; value: number; unit: string; icon: any }) {
  return (
    <Card className="p-6 rounded-2xl backdrop-blur-xl bg-white/90 shadow-xl border border-emerald-100 hover:shadow-2xl transition-all">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500 mb-1" data-testid={`text-stat-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </p>
          <h3 className="text-3xl font-bold" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value.toFixed(1)} {unit}
          </h3>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white rounded-xl p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function LiveDataBadge() {
  return (
    <div className="relative flex items-center" data-testid="badge-live">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
      <span className="ml-2 text-sm font-semibold text-red-600">LIVE</span>
    </div>
  );
}

function CampusHealthPulse({ aqi, status }: { aqi: number; status: string }) {
  const getColorClasses = () => {
    if (aqi <= 50) return { bg: "bg-emerald-500", text: "text-emerald-600" };
    if (aqi <= 100) return { bg: "bg-yellow-500", text: "text-yellow-600" };
    return { bg: "bg-red-500", text: "text-red-600" };
  };

  const colors = getColorClasses();

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg border border-emerald-100">
      <div className="relative">
        <div className={`absolute inset-0 rounded-full animate-pulse ${colors.bg} opacity-30`}></div>
        <div className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg ${colors.bg}`}>
          <p className="text-2xl font-bold text-white" data-testid="text-campus-aqi">
            {Math.round(aqi)}
          </p>
          <p className="text-xs font-semibold text-white/80">AQI</p>
        </div>
      </div>
      <div className="text-left">
        <p className="text-sm text-slate-500 text-center">Campus Health</p>
        <h4 className={`font-bold text-lg text-center ${colors.text}`} data-testid="text-campus-health">
          {status}
        </h4>
      </div>
    </div>
  );
}

function CGIChart({ cgi, status }: { cgi: number; status: string }) {
  const getColor = () => {
    if (cgi >= 80) return "#10b981";
    if (cgi >= 60) return "#facc15";
    return "#f97316";
  };

  const color = getColor();
  const percentage = (cgi / 100) * 360;

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg border border-emerald-100">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${percentage} 360`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold" style={{ color }} data-testid="text-cgi-value">
            {Math.round(cgi)}
          </p>
          <p className="text-xs font-semibold text-slate-500">CGI</p>
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-500 text-center">Green Index</p>
        <h4 className="font-bold text-lg text-center" style={{ color }} data-testid="text-cgi-status">
          {status}
        </h4>
      </div>
    </div>
  );
}

function InsightBanner({ insight }: { insight: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50/70 border border-purple-200 shadow-sm mb-6" data-testid="banner-insight">
      <Sparkles className="h-5 w-5 text-purple-500" />
      <p className="font-bold text-purple-700">AI Insight:</p>
      <p className="text-slate-600">{insight}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 5000, // Refetch every 5 seconds to match backend updates
  });

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent" data-testid="heading-dashboard">
              Environmental Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1" data-testid="text-last-updated">
              Last updated: {new Date(stats.lastUpdated).toLocaleString()}
            </p>
          </div>
          <LiveDataBadge />
        </div>
        
        <div className="flex items-center gap-4">
          <CGIChart cgi={stats.campusGreenIndex} status={stats.campusHealthStatus} />
          <CampusHealthPulse aqi={stats.avgAqi} status={stats.campusHealthStatus} />
        </div>
      </div>

      <InsightBanner insight="Air quality is good across most areas. CO₂ levels are stable. Traffic flow is optimal." />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Temperature"
          value={stats.avgTemp}
          unit="°C"
          icon={Thermometer}
        />
        <StatCard
          title="Humidity"
          value={stats.avgHumidity}
          unit="%"
          icon={Droplets}
        />
        <StatCard
          title="Air Quality Index"
          value={stats.avgAqi}
          unit="AQI"
          icon={Wind}
        />
        <StatCard
          title="CO₂ Levels"
          value={stats.avgCo2}
          unit="ppm"
          icon={Leaf}
        />
      </div>
    </div>
  );
}
