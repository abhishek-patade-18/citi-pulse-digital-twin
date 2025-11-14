import { useQuery } from "@tanstack/react-query";
import { CheckSquare } from "lucide-react";
import type { Alert } from "@shared/schema";

function AlertItem({ alert }: { alert: Alert }) {
  const isCritical = alert.level === "critical";
  
  return (
    <div
      className={`p-5 border-l-4 rounded-lg ${
        isCritical
          ? "border-red-500 bg-red-50/80"
          : "border-amber-500 bg-amber-50/80"
      } backdrop-blur-sm`}
      data-testid={`alert-${alert.id}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold" data-testid={`text-alert-title-${alert.id}`}>
            {alert.parameter} Alert: {alert.sensorName}
          </h3>
          <p className="text-sm text-slate-600" data-testid={`text-alert-desc-${alert.id}`}>
            {alert.parameter} level of {parseFloat(alert.value).toFixed(1)} has exceeded the {alert.level} threshold of {parseFloat(alert.threshold).toFixed(0)}.
          </p>
        </div>
        <span className="text-xs uppercase bg-white/70 rounded-full px-3 py-1 font-semibold" data-testid={`badge-alert-level-${alert.id}`}>
          {alert.level}
        </span>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 5000, // Refetch every 5 seconds for live alerts
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-4" data-testid="heading-alerts">
        Alerts
      </h1>

      {alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 rounded-2xl backdrop-blur-xl bg-white/90 shadow-xl border border-emerald-100" data-testid="empty-alerts">
          <CheckSquare className="h-12 w-12 text-green-500 mx-auto" />
          <p className="mt-4 text-lg font-semibold text-gray-700">
            All systems normal.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            No alerts to display at this time.
          </p>
        </div>
      )}
    </div>
  );
}
