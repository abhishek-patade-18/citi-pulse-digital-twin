import { useQuery } from "@tanstack/react-query";
import { CheckSquare, ChevronDown, ChevronUp, MapPin, AlertTriangle, Flame, Wind, Sprout } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Alert, Sensor } from "@shared/schema";

// Generate mock historical data for charts
function generateHistoricalData(baseValue: number, variance: number) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, index) => ({
    month,
    aqi: Math.max(0, baseValue + (Math.random() - 0.5) * variance + (index * 2)),
    temp: Math.max(15, 25 + (Math.random() - 0.5) * 8 + Math.sin(index / 2) * 5),
  }));
}

// Generate real-time alerts from sensor data
function generateAlertsFromSensors(sensors: Sensor[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  
  // Force at least one alert if no sensors or no threshold breaches
  let hasAlert = false;
  
  sensors.forEach((sensor, index) => {
    // Check AQI threshold
    if (sensor.predictedAqi > 100) {
      alerts.push({
        id: `alert-aqi-${sensor.id}`,
        sensorId: sensor.id,
        sensorName: sensor.name,
        parameter: "AQI",
        value: sensor.predictedAqi.toString(),
        threshold: "100",
        level: sensor.predictedAqi > 150 ? "critical" : "warning",
        timestamp: new Date(now.getTime() - index * 60000).toISOString(),
        resolved: false,
        lat: sensor.lat,
        lng: sensor.lng,
      });
      hasAlert = true;
    }
    
    // Check temperature threshold
    if (sensor.predictedTemp > 35) {
      alerts.push({
        id: `alert-temp-${sensor.id}`,
        sensorId: sensor.id,
        sensorName: sensor.name,
        parameter: "Temperature",
        value: sensor.predictedTemp.toString(),
        threshold: "35",
        level: sensor.predictedTemp > 40 ? "critical" : "warning",
        timestamp: new Date(now.getTime() - (index + 1) * 90000).toISOString(),
        resolved: false,
        lat: sensor.lat,
        lng: sensor.lng,
      });
      hasAlert = true;
    }
    
    // Check CO2 threshold (simulated from AQI correlation)
    const estimatedCO2 = 400 + (sensor.predictedAqi * 2);
    if (estimatedCO2 > 600) {
      alerts.push({
        id: `alert-co2-${sensor.id}`,
        sensorId: sensor.id,
        sensorName: sensor.name,
        parameter: "CO₂",
        value: estimatedCO2.toFixed(0),
        threshold: "600",
        level: estimatedCO2 > 800 ? "critical" : "warning",
        timestamp: new Date(now.getTime() - (index + 2) * 120000).toISOString(),
        resolved: false,
        lat: sensor.lat,
        lng: sensor.lng,
      });
      hasAlert = true;
    }
  });
  
  // If no alerts were generated from sensor data, create a demo alert
  if (!hasAlert && sensors.length > 0) {
    const demoSensor = sensors[0];
    alerts.push({
      id: `demo-alert-aqi-${demoSensor.id}`,
      sensorId: demoSensor.id,
      sensorName: demoSensor.name,
      parameter: "AQI",
      value: "156", // Force above threshold
      threshold: "100",
      level: "critical",
      timestamp: new Date().toISOString(),
      resolved: false,
      lat: demoSensor.lat,
      lng: demoSensor.lng,
    });
  }
  
  // If no sensors exist at all, create a demo alert with mock data
  if (sensors.length === 0) {
    alerts.push({
      id: `demo-alert-aqi-1`,
      sensorId: 1,
      sensorName: "Downtown Nashik Sensor",
      parameter: "AQI",
      value: "156",
      threshold: "100",
      level: "critical",
      timestamp: new Date().toISOString(),
      resolved: false,
      lat: 19.9975,
      lng: 73.7898,
    });
  }
  
  // Limit to 4-5 most recent alerts
  return alerts.slice(0, 5);
}

function AlertIcon({ parameter, level }: { parameter: string; level: string }) {
  const isCritical = level === "critical";
  
  if (parameter === "Temperature") {
    return <Flame className={`h-5 w-5 ${isCritical ? 'text-red-600' : 'text-orange-500'}`} />;
  } else if (parameter === "CO₂") {
    return <Wind className={`h-5 w-5 ${isCritical ? 'text-red-600' : 'text-amber-500'}`} />;
  } else if (parameter === "AQI") {
    return <AlertTriangle className={`h-5 w-5 ${isCritical ? 'text-red-600' : 'text-yellow-500'}`} />;
  } else {
    return <Sprout className={`h-5 w-5 ${isCritical ? 'text-red-600' : 'text-green-500'}`} />;
  }
}

function AlertItem({ alert, allSensors }: { alert: Alert; allSensors: Sensor[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [, setLocation] = useLocation();
  const isCritical = alert.level === "critical";
  
  const sensor = allSensors.find(s => s.id === alert.sensorId);
  const historicalData = generateHistoricalData(
    parseFloat(alert.value),
    parseFloat(alert.value) * 0.3
  );
  
  const alertDate = new Date(alert.timestamp);
  const timeAgo = Math.floor((Date.now() - alertDate.getTime()) / 60000);
  const displayTime = timeAgo < 1 ? 'Just now' : 
                      timeAgo < 60 ? `${timeAgo}m ago` : 
                      `${Math.floor(timeAgo / 60)}h ago`;
  
  const handleViewOnMap = () => {
    // Store the target sensor coordinates in sessionStorage for the map to read
    sessionStorage.setItem('mapFlyTo', JSON.stringify({
      lng: typeof alert.lng === 'string' ? parseFloat(alert.lng) : alert.lng,
      lat: typeof alert.lat === 'string' ? parseFloat(alert.lat) : alert.lat,
      zoom: 15,
      sensorId: alert.sensorId
    }));
    setLocation('/map');
  };
  
  const getReason = () => {
    if (alert.parameter === "AQI") {
      return "Possible causes: High traffic density, industrial activity, low vegetation coverage in the area.";
    } else if (alert.parameter === "Temperature") {
      return "Possible causes: Urban heat island effect, lack of tree cover, high concrete density, peak solar exposure.";
    } else if (alert.parameter === "CO₂") {
      return "Possible causes: Vehicle emissions, crowd concentration, poor air circulation, nearby construction.";
    }
    return "Environmental imbalance detected. Monitor ongoing.";
  };
  
  return (
    <div
      className={`p-5 border-l-4 rounded-lg transition-all ${
        isCritical
          ? "border-red-500 bg-red-50/80"
          : "border-amber-500 bg-amber-50/80"
      } backdrop-blur-sm hover:shadow-lg cursor-pointer`}
      data-testid={`alert-${alert.id}`}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      {/* Collapsed View */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          <AlertIcon parameter={alert.parameter} level={alert.level} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-800" data-testid={`text-alert-title-${alert.id}`}>
                {alert.parameter} Alert: {alert.sensorName}
              </h3>
              <span className="text-xs text-slate-500">{displayTime}</span>
            </div>
            <p className="text-sm text-slate-600" data-testid={`text-alert-desc-${alert.id}`}>
              {alert.parameter} level of {parseFloat(alert.value).toFixed(1)} has exceeded the {alert.level} threshold of {parseFloat(alert.threshold).toFixed(0)}.
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              <span>Lat: {typeof alert.lat === 'string' ? parseFloat(alert.lat).toFixed(4) : alert.lat.toFixed(4)}, 
                    Lng: {typeof alert.lng === 'string' ? parseFloat(alert.lng).toFixed(4) : alert.lng.toFixed(4)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <span className={`text-xs uppercase rounded-full px-3 py-1 font-semibold ${
            isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
          }`} data-testid={`badge-alert-level-${alert.id}`}>
            {alert.level}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-white/50 rounded transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-slate-200 animate-in slide-in-from-top duration-300">
          {/* Detailed Information */}
          <div className="space-y-4">
            <div className="bg-white/60 rounded-lg p-4">
              <h4 className="font-semibold text-slate-800 mb-2">Alert Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Date & Time</p>
                  <p className="font-medium">{alertDate.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Current Reading</p>
                  <p className="font-medium">{parseFloat(alert.value).toFixed(1)} {alert.parameter === 'CO₂' ? 'ppm' : alert.parameter === 'Temperature' ? '°C' : ''}</p>
                </div>
                <div>
                  <p className="text-slate-500">Threshold</p>
                  <p className="font-medium">{parseFloat(alert.threshold).toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Sensor Type</p>
                  <p className="font-medium">{sensor?.type || 'Unknown'}</p>
                </div>
              </div>
            </div>
            
            {/* Possible Reasons */}
            <div className="bg-white/60 rounded-lg p-4">
              <h4 className="font-semibold text-slate-800 mb-2">Possible Causes</h4>
              <p className="text-sm text-slate-600">{getReason()}</p>
            </div>
            
            {/* Previous Alerts */}
            {sensor && sensor.alerts && sensor.alerts.length > 0 && (
              <div className="bg-white/60 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Recent History</h4>
                <p className="text-sm text-slate-600">
                  This sensor has triggered {sensor.alerts.length} alert{sensor.alerts.length > 1 ? 's' : ''} in the past 24 hours.
                </p>
              </div>
            )}
            
            {/* Analytics Chart */}
            <div className="bg-white/60 rounded-lg p-4">
              <h4 className="font-semibold text-slate-800 mb-4">Annual Trend Analysis</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {alert.parameter === "Temperature" ? (
                    <Line 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      name="Temperature (°C)"
                      dot={{ fill: '#f97316', r: 4 }}
                    />
                  ) : (
                    <Line 
                      type="monotone" 
                      dataKey="aqi" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name={alert.parameter === "CO₂" ? "CO₂ Level (ppm)" : "AQI"}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Action Button */}
            <button
              onClick={handleViewOnMap}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <MapPin className="h-4 w-4" />
              View on Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 5000,
  });

  const { data: sensors = [], isLoading: sensorsLoading } = useQuery<Sensor[]>({
    queryKey: ["/api/sensors"],
    refetchInterval: 5000,
  });

  const isLoading = alertsLoading || sensorsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Generate alerts from sensor data if no alerts exist
  const generatedAlerts = alerts.length === 0 ? generateAlertsFromSensors(sensors) : [];
  const displayAlerts = alerts.length > 0 ? alerts : generatedAlerts;

  return (
    <div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-4" data-testid="heading-alerts">
        Alerts
      </h1>

      {displayAlerts.length > 0 ? (
        <div className="space-y-4">
          {displayAlerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} allSensors={sensors} />
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