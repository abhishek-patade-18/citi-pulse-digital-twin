import reflex as rx
import asyncio
import random
import numpy as np
from typing import TypedDict
from datetime import datetime, timezone, timedelta


class SensorReading(TypedDict):
    timestamp: str
    temperature: float
    humidity: float
    aqi: int
    co2: int


class Alert(TypedDict):
    id: str
    sensor_name: str
    parameter: str
    value: float
    threshold: float
    level: str
    timestamp: str


class Point(TypedDict):
    lat: float
    lng: float


# Remove the reflex_enterprise import since we're using Mapbox directly
# from reflex_enterprise.components.map.types import LatLng

class LatLng(TypedDict):
    lat: float
    lng: float


class Zone(TypedDict):
    id: str
    name: str
    polygon: list[Point]
    sensors: list[int]
    avg_aqi: int
    avg_temp: float
    color: str
    polygon_latlng: list[LatLng]


class Sensor(TypedDict):
    id: int
    name: str
    type: str
    lat: float
    lng: float
    readings: list[SensorReading]
    alerts: list[Alert]
    predicted_aqi: float
    predicted_temp: float
    color: str
    is_glowing: bool


SENSOR_LOCATIONS = [
    {
        "id": 1,
        "name": "Main Gate",
        "type": "Campus",
        "lat": 20.041974,
        "lng": 73.849924,
    },
    {"id": 2, "name": "Canteen", "type": "Campus", "lat": 20.040594, "lng": 73.850536},
    {
        "id": 3,
        "name": "Meena Bhujbal School",
        "type": "Campus",
        "lat": 20.040648,
        "lng": 73.851721,
    },
    {
        "id": 4,
        "name": "Engg. Building",
        "type": "Campus",
        "lat": 20.040695,
        "lng": 73.84982,
    },
    {
        "id": 5,
        "name": "Mech. Building",
        "type": "Campus",
        "lat": 20.039654,
        "lng": 73.849021,
    },
    {"id": 6, "name": "Ground", "type": "Campus", "lat": 20.042238, "lng": 73.851231},
    {
        "id": 7,
        "name": "Police Training Ground",
        "type": "Campus",
        "lat": 20.042085,
        "lng": 73.848787,
    },
    {
        "id": 8,
        "name": "Institute of Pharmacy",
        "type": "Campus",
        "lat": 20.040741,
        "lng": 73.847402,
    },
    {
        "id": 9,
        "name": "Nearby Road",
        "type": "Nearby",
        "lat": 20.040191,
        "lng": 73.853408,
    },
    {
        "id": 10,
        "name": "Highway Entrance",
        "type": "Nearby",
        "lat": 19.997,
        "lng": 73.774,
    },
    {
        "id": 11,
        "name": "Residential Area",
        "type": "Nearby",
        "lat": 20.0005,
        "lng": 73.771,
    },
    {
        "id": 12,
        "name": "Industrial Zone",
        "type": "Nearby",
        "lat": 20.001,
        "lng": 73.7745,
    },
]
CAMPUS_ZONES = [
    {
        "id": "main_gate",
        "name": "Main Gate",
        "sensors": [1],
        "polygon": [
            {"lat": 20.0422, "lng": 73.8497},
            {"lat": 20.0422, "lng": 73.8502},
            {"lat": 20.0417, "lng": 73.8502},
            {"lat": 20.0417, "lng": 73.8497},
        ],
    },
    {
        "id": "canteen",
        "name": "Canteen",
        "sensors": [2],
        "polygon": [
            {"lat": 20.0408, "lng": 73.8503},
            {"lat": 20.0408, "lng": 73.8508},
            {"lat": 20.0403, "lng": 73.8508},
            {"lat": 20.0403, "lng": 73.8503},
        ],
    },
    {
        "id": "engg_building",
        "name": "Engg. Building",
        "sensors": [4],
        "polygon": [
            {"lat": 20.0409, "lng": 73.8496},
            {"lat": 20.0409, "lng": 73.8501},
            {"lat": 20.0404, "lng": 73.8501},
            {"lat": 20.0404, "lng": 73.8496},
        ],
    },
    {
        "id": "ground",
        "name": "Ground",
        "sensors": [6],
        "polygon": [
            {"lat": 20.0425, "lng": 73.8509},
            {"lat": 20.0425, "lng": 73.8516},
            {"lat": 20.0418, "lng": 73.8516},
            {"lat": 20.0418, "lng": 73.8509},
        ],
    },
]
BASE_VALUES = {"temperature": 28.0, "humidity": 55.0, "aqi": 70, "co2": 500}
LOCATION_FACTORS = {
    "Main Gate": {"aqi": 5, "co2": 50},
    "Canteen": {"temperature": 1, "co2": 100},
    "Engg. Building": {"co2": 70},
    "Mech. Building": {"aqi": 8, "co2": 60},
    "Ground": {"temperature": 1.5, "aqi": -5},
    "Highway Entrance": {"aqi": 15, "co2": 150},
    "Industrial Zone": {"aqi": 25, "co2": 200},
    "Residential Area": {"aqi": -5, "co2": -20},
    "Nearby Road": {"aqi": 10, "co2": 120},
}
ALERT_THRESHOLDS = {
    "temperature": {"warning": 33, "critical": 37},
    "humidity": {
        "warning_low": 25,
        "warning_high": 75,
        "critical_low": 15,
        "critical_high": 85,
    },
    "aqi": {"warning": 100, "critical": 150},
    "co2": {"warning": 900, "critical": 1200},
}
import os
import logging


class CitiPulseState(rx.State):
    """Manages the state for the CitiPulse Digital Twin."""

    show_dashboard: bool = False
    sensors: dict[int, Sensor] = {}
    all_alerts: list[Alert] = []
    active_page: str = "Dashboard"
    is_running: bool = False
    analytics_sensor_id: int = 1
    analytics_time_range: str = "1h"
    # Updated map_style to use Mapbox style URLs
    map_style: str = "mapbox://styles/mapbox/streets-v12"
    map_view_mode: str = "Streets"
    real_weather_temp: float = 0.0
    real_weather_humidity: float = 0.0
    real_weather_aqi: int = 0
    moving_objects: list[dict] = []
    zones: dict[str, Zone] = {}
    _object_states: list[dict] = []
    last_updated: str = ""
    demo_mode: bool = False
    demo_triggered: bool = False
    show_footer: bool = True

    # Map view states for Google Maps
    map_view_mode: str = "roadmap"
    show_traffic: bool = False
    show_weather: bool = False
    show_3d_terrain: bool = False

    @rx.event
    def enter_dashboard(self):
        """Sets the state to show the main dashboard and starts the simulation."""
        self.show_dashboard = True
        yield CitiPulseState.start_simulation()

    @rx.event
    def toggle_demo_mode(self):
        """Toggles the demo mode."""
        self.demo_mode = not self.demo_mode
        if self.demo_mode:
            return CitiPulseState.trigger_demo_alert()

    @rx.event
    def trigger_demo_alert(self):
        """Triggers a sample critical alert for demonstration purposes."""
        if 1 in self.sensors:
            self.demo_triggered = True
            demo_reading: SensorReading = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "temperature": 38.5,
                "humidity": 45.0,
                "aqi": 155,
                "co2": 1300,
            }
            self._check_for_alerts(1, demo_reading)
            self.sensors[1]["readings"].append(demo_reading)
            return rx.toast(
                title="🔥 Critical Alert Demo!",
                description="AQI at Main Gate has exceeded critical threshold.",
                duration=7000,
            )

    @rx.event
    def export_sensor_data_csv(self) -> rx.event.EventSpec:
        """Exports all sensor readings to a CSV file."""
        import csv
        from io import StringIO

        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "timestamp",
                "sensor_id",
                "sensor_name",
                "temperature",
                "humidity",
                "aqi",
                "co2",
            ]
        )
        for sensor_id, sensor in self.sensors.items():
            for reading in sensor.get("readings", []):
                writer.writerow(
                    [
                        reading["timestamp"],
                        sensor_id,
                        sensor["name"],
                        reading["temperature"],
                        reading["humidity"],
                        reading["aqi"],
                        reading["co2"],
                    ]
                )
        csv_data = output.getvalue().encode("utf-8")
        return rx.download(data=csv_data, filename="citipulse_sensor_data.csv")

    @rx.event
    def start_simulation(self):
        """Initializes sensors and starts the background simulation task."""
        if not self.is_running:
            if not self.sensors:
                for loc in SENSOR_LOCATIONS:
                    self.sensors[loc["id"]] = {
                        "id": loc["id"],
                        "name": loc["name"],
                        "type": loc["type"],
                        "lat": loc["lat"],
                        "lng": loc["lng"],
                        "readings": [],
                        "alerts": [],
                        "predicted_aqi": 0.0,
                        "predicted_temp": 0.0,
                        "color": "#A1A1AA",
                        "is_glowing": False,
                    }
            if not self.zones:
                # Use our custom LatLng class instead of reflex_enterprise
                for z in CAMPUS_ZONES:
                    self.zones[z["id"]] = {
                        "id": z["id"],
                        "name": z["name"],
                        "sensors": z["sensors"],
                        "polygon": z["polygon"],
                        "avg_aqi": 0,
                        "avg_temp": 0.0,
                        "color": "#4ade80",
                        "polygon_latlng": [
                            {"lat": p["lat"], "lng": p["lng"]} for p in z["polygon"]
                        ],
                    }
            if not self._object_states:
                paths = [
                    [(20.0419, 73.8499), (20.0406, 73.8498), (20.0405, 73.8505)],
                    [(20.0422, 73.8512), (20.0406, 73.8517), (20.0401, 73.8534)],
                    [(20.0396, 73.849), (20.0407, 73.8474)],
                ]
                self._object_states = [
                    {
                        "path_idx": random.randint(0, len(paths) - 1),
                        "segment_idx": 0,
                        "progress": random.random(),
                        "type": "person" if i % 3 != 0 else "vehicle",
                    }
                    for i in range(15)
                ]
            self.is_running = True
            return [
                CitiPulseState.update_sensor_data,
                CitiPulseState.fetch_weather_data,
                CitiPulseState.update_moving_objects,
            ]

    @rx.event(background=True)
    async def update_sensor_data(self):
        """Periodically updates sensor readings to simulate a real-time network."""
        from sklearn.linear_model import LinearRegression

        while self.is_running:
            async with self:
                now = datetime.now(timezone.utc)
                is_day = 6 <= now.hour <= 18
                for sensor_id, sensor in self.sensors.items():
                    base_temp = BASE_VALUES["temperature"] + (
                        random.uniform(2, 5) if is_day else random.uniform(-1, -3)
                    )
                    base_aqi = BASE_VALUES["aqi"] + (10 if is_day else -8)
                    loc_factor = LOCATION_FACTORS.get(sensor["name"], {})
                    temp = (
                        base_temp
                        + loc_factor.get("temperature", 0)
                        + np.random.uniform(-0.5, 0.5)
                    )
                    humidity = BASE_VALUES["humidity"] + np.random.uniform(-5, 5)
                    aqi = base_aqi + loc_factor.get("aqi", 0) + np.random.uniform(-5, 5)
                    co2 = (
                        BASE_VALUES["co2"]
                        + loc_factor.get("co2", 0)
                        + np.random.uniform(-20, 20)
                    )
                    new_reading: SensorReading = {
                        "timestamp": now.isoformat(),
                        "temperature": round(temp, 2),
                        "humidity": round(max(0, min(100, humidity)), 2),
                        "aqi": int(max(0, aqi)),
                        "co2": int(max(0, co2)),
                    }
                    self.sensors[sensor_id]["readings"].append(new_reading)
                    if len(self.sensors[sensor_id]["readings"]) > 100:
                        self.sensors[sensor_id]["readings"].pop(0)
                    self._check_for_alerts(sensor_id, new_reading)
                    is_critical_and_recent = False
                    if sensor["alerts"]:
                        latest_alert = sensor["alerts"][0]
                        if latest_alert["level"] == "critical":
                            alert_time = datetime.fromisoformat(
                                latest_alert["timestamp"]
                            )
                            if (now - alert_time).total_seconds() < 60:
                                is_critical_and_recent = True
                    self.sensors[sensor_id]["is_glowing"] = is_critical_and_recent
                    if len(sensor["readings"]) > 10:
                        X = np.array(range(len(sensor["readings"]))).reshape(-1, 1)
                        y_temp = np.array(
                            [r["temperature"] for r in sensor["readings"]]
                        )
                        y_aqi = np.array([r["aqi"] for r in sensor["readings"]])
                        model_temp = LinearRegression().fit(X, y_temp)
                        model_aqi = LinearRegression().fit(X, y_aqi)
                        future_point = len(sensor["readings"]) + 24 * 6
                        self.sensors[sensor_id]["predicted_temp"] = round(
                            model_temp.predict([[future_point]])[0], 2
                        )
                        self.sensors[sensor_id]["predicted_aqi"] = round(
                            model_aqi.predict([[future_point]])[0], 2
                        )
                    self.sensors[sensor_id]["color"] = self._get_aqi_color_for_sensor(
                        self.sensors[sensor_id]
                    )
                self._update_zone_data()
                self.last_updated = now.isoformat()
                # Remove the old map style switching logic since Mapbox handles this differently
            await asyncio.sleep(10)

    def _update_zone_data(self):
        for zone_id, zone in self.zones.items():
            zone_sensors = [
                self.sensors[s_id]
                for s_id in zone["sensors"]
                if s_id in self.sensors and self.sensors[s_id]["readings"]
            ]
            if not zone_sensors:
                continue
            avg_aqi = sum((s["readings"][-1]["aqi"] for s in zone_sensors)) / len(
                zone_sensors
            )
            avg_temp = sum(
                (s["readings"][-1]["temperature"] for s in zone_sensors)
            ) / len(zone_sensors)
            self.zones[zone_id]["avg_aqi"] = int(avg_aqi)
            self.zones[zone_id]["avg_temp"] = round(avg_temp, 2)
            if avg_aqi <= 50:
                color = "#4ade80"
            elif avg_aqi <= 100:
                color = "#facc15"
            elif avg_aqi <= 150:
                color = "#fb923c"
            else:
                color = "#f87171"
            self.zones[zone_id]["color"] = color

    def _check_for_alerts(self, sensor_id: int, reading: SensorReading):
        """Checks a new reading against thresholds and creates alerts."""
        sensor_name = self.sensors[sensor_id]["name"]
        self._create_alert_if_exceeded(
            sensor_id,
            sensor_name,
            "temperature",
            reading["temperature"],
            ALERT_THRESHOLDS["temperature"],
        )
        self._create_alert_if_exceeded(
            sensor_id, sensor_name, "aqi", reading["aqi"], ALERT_THRESHOLDS["aqi"]
        )
        self._create_alert_if_exceeded(
            sensor_id, sensor_name, "co2", reading["co2"], ALERT_THRESHOLDS["co2"]
        )
        if reading["humidity"] > ALERT_THRESHOLDS["humidity"]["critical_high"]:
            self._create_alert(
                sensor_id,
                sensor_name,
                "humidity",
                reading["humidity"],
                ALERT_THRESHOLDS["humidity"]["critical_high"],
                "critical",
            )
        elif reading["humidity"] > ALERT_THRESHOLDS["humidity"]["warning_high"]:
            self._create_alert(
                sensor_id,
                sensor_name,
                "humidity",
                reading["humidity"],
                ALERT_THRESHOLDS["humidity"]["warning_high"],
                "warning",
            )
        elif reading["humidity"] < ALERT_THRESHOLDS["humidity"]["critical_low"]:
            self._create_alert(
                sensor_id,
                sensor_name,
                "humidity",
                reading["humidity"],
                ALERT_THRESHOLDS["humidity"]["critical_low"],
                "critical",
            )
        elif reading["humidity"] < ALERT_THRESHOLDS["humidity"]["warning_low"]:
            self._create_alert(
                sensor_id,
                sensor_name,
                "humidity",
                reading["humidity"],
                ALERT_THRESHOLDS["humidity"]["warning_low"],
                "warning",
            )

    def _create_alert_if_exceeded(
        self,
        sensor_id: int,
        sensor_name: str,
        param: str,
        value: float,
        thresholds: dict,
    ):
        if value > thresholds["critical"]:
            self._create_alert(
                sensor_id, sensor_name, param, value, thresholds["critical"], "critical"
            )
        elif value > thresholds["warning"]:
            self._create_alert(
                sensor_id, sensor_name, param, value, thresholds["warning"], "warning"
            )

    def _create_alert(
        self,
        sensor_id: int,
        sensor_name: str,
        param: str,
        value: float,
        threshold: float,
        level: str,
    ) -> Alert:
        alert_id = f"{sensor_name}-{param}-{datetime.now().timestamp()}"
        new_alert: Alert = {
            "id": alert_id,
            "sensor_name": sensor_name,
            "parameter": param.upper(),
            "value": round(value, 2),
            "threshold": threshold,
            "level": level,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.all_alerts.insert(0, new_alert)
        if len(self.all_alerts) > 50:
            self.all_alerts.pop()
        self.sensors[sensor_id]["alerts"].insert(0, new_alert)
        if len(self.sensors[sensor_id]["alerts"]) > 10:
            self.sensors[sensor_id]["alerts"].pop()
        # Remove the old map style switching for alerts since Mapbox handles this differently
        return new_alert

    @rx.var
    def total_sensors(self) -> int:
        return len(self.sensors)

    @rx.var
    def critical_alerts_count(self) -> int:
        return len([a for a in self.all_alerts if a["level"] == "critical"])

    def _get_avg_campus_reading(self, key: str) -> float:
        campus_sensors = [
            s for s in self.sensors.values() if s["type"] == "Campus" and s["readings"]
        ]
        if not campus_sensors:
            return 0.0
        total_value = sum((s["readings"][-1][key] for s in campus_sensors))
        return round(total_value / len(campus_sensors), 1)

    @rx.var
    def campus_avg_aqi(self) -> int:
        return int(self._get_avg_campus_reading("aqi"))

    @rx.var
    def campus_avg_temp(self) -> float:
        return self._get_avg_campus_reading("temperature")

    @rx.var
    def campus_avg_humidity(self) -> float:
        return self._get_avg_campus_reading("humidity")

    @rx.var
    def campus_avg_co2(self) -> int:
        return int(self._get_avg_campus_reading("co2"))

    @rx.var
    def sensor_list(self) -> list[Sensor]:
        """Returns the list of sensors from the sensors dictionary."""
        return list(self.sensors.values())

    @rx.var
    def zone_list(self) -> list[Zone]:
        return list(self.zones.values())

    @rx.event
    def set_active_page(self, page_name: str):
        """Sets the currently active page for navigation highlighting."""
        self.active_page = page_name

    @rx.event
    def set_analytics_sensor_id(self, sensor_id: str):
        self.analytics_sensor_id = int(sensor_id)

    @rx.event
    def set_map_view_mode(self, mode: str):
        """Set map view mode for Google Maps"""
        self.map_view_mode = mode

    def _get_aqi_color_for_sensor(self, sensor: Sensor) -> str:
        if not sensor or not sensor["readings"]:
            return "#A1A1AA"
        latest_reading = sensor["readings"][-1]
        aqi = latest_reading.get("aqi", 0)
        if self.map_view_mode == "Environmental":
            if aqi < 50:
                return "#00FF00"
            elif aqi < 100:
                return "#FFFF00"
            elif aqi < 150:
                return "#FFA500"
            else:
                return "#FF0000"
        elif aqi < 50:
            return "#22C55E"
        elif aqi < 100:
            return "#EAB308"
        elif aqi < 150:
            return "#F97316"
        else:
            return "#EF4444"

    @rx.var
    def campus_green_index(self) -> int:
        aqi_score = max(0, 100 - self.campus_avg_aqi)
        temp_score = (
            100
            if 18 <= self.campus_avg_temp <= 28
            else max(0, 100 - abs(self.campus_avg_temp - 23) * 5)
        )
        co2_score = max(0, 100 - (self.campus_avg_co2 - 400) / 10)
        cgi = int(aqi_score * 0.5 + temp_score * 0.25 + co2_score * 0.25)
        return max(0, min(100, cgi))

    @rx.var
    def cgi_color(self) -> str:
        cgi = self.campus_green_index
        if cgi > 75:
            return "#10B981"
        elif cgi > 50:
            return "#FBBF24"
        else:
            return "#F97316"

    @rx.var
    def cgi_chart_data(self) -> list[dict[str, int | str]]:
        return [{"name": "CGI", "value": self.campus_green_index}]

    @rx.var
    def pulse_color_class(self) -> str:
        aqi = self.campus_avg_aqi
        if aqi < 50:
            return "from-green-400 to-green-600"
        elif aqi < 100:
            return "from-yellow-400 to-yellow-600"
        elif aqi < 150:
            return "from-orange-400 to-orange-600"
        else:
            return "from-red-400 to-red-600"

    @rx.var
    def pulse_text_color(self) -> str:
        aqi = self.campus_avg_aqi
        if aqi < 50:
            return "text-green-600"
        elif aqi < 100:
            return "text-yellow-600"
        elif aqi < 150:
            return "text-orange-600"
        else:
            return "text-red-600"

    @rx.var
    def campus_health_status(self) -> str:
        aqi = self.campus_avg_aqi
        if aqi < 50:
            return "Excellent"
        elif aqi < 100:
            return "Good"
        elif aqi < 150:
            return "Moderate"
        else:
            return "Unhealthy"

    @rx.var
    def last_updated_display(self) -> str:
        if not self.last_updated:
            return "Never"
        now = datetime.now(timezone.utc)
        last_update_time = datetime.fromisoformat(self.last_updated)
        diff_seconds = (now - last_update_time).total_seconds()
        if diff_seconds < 2:
            return "Just now"
        if diff_seconds < 60:
            return f"{int(diff_seconds)} seconds ago"
        return last_update_time.strftime("%H:%M:%S")

    @rx.event
    def trigger_alert_toast(
        self, level: str, sensor_name: str, param: str, value: str, threshold: str
    ):
        return rx.toast(
            title=f"{level.capitalize()} Alert: {sensor_name}",
            description=f"{param.upper()} level is {value} (Threshold: {threshold})",
            duration=5000,
            close_button=True,
            style={
                "background-color": "#EF4444" if level == "critical" else "#F59E0B",
                "color": "white",
            },
        )

    @rx.var
    def selected_sensor(self) -> Sensor | None:
        return self.sensors.get(self.analytics_sensor_id)

    @rx.var
    def analytics_data(self) -> list[SensorReading]:
        if not self.selected_sensor or not self.selected_sensor["readings"]:
            return []
        now = datetime.now(timezone.utc)
        readings = self.selected_sensor["readings"]
        if self.analytics_time_range == "1h":
            time_delta = 3600
        elif self.analytics_time_range == "6h":
            time_delta = 6 * 3600
        elif self.analytics_time_range == "24h":
            time_delta = 24 * 3600
        else:
            return readings
        return [
            r
            for r in readings
            if (now - datetime.fromisoformat(r["timestamp"])).total_seconds()
            <= time_delta
        ]

    @rx.event(background=True)
    async def fetch_weather_data(self):
        """Fetches real-time weather data from Open-Meteo."""
        import httpx

        while self.is_running:
            try:
                async with httpx.AsyncClient() as client:
                    lat, lon = (20.041264, 73.85038)
                    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m&forecast_days=1"
                    response = await client.get(url)
                    response.raise_for_status()
                    data = response.json()
                async with self:
                    current_weather = data.get("current", {})
                    self.real_weather_temp = current_weather.get("temperature_2m", 0.0)
                    self.real_weather_humidity = current_weather.get(
                        "relative_humidity_2m", 0.0
                    )
                    self.real_weather_aqi = 0
            except Exception as e:
                logging.exception(f"Error fetching weather data: {e}")
            await asyncio.sleep(300)

    @rx.event(background=True)
    async def update_moving_objects(self):
        """Simulates moving objects on campus."""
        if not hasattr(self, "_object_states") or not self._object_states:
            return
        paths = [
            [(20.0419, 73.8499), (20.0406, 73.8498), (20.0405, 73.8505)],
            [(20.0422, 73.8512), (20.0406, 73.8517), (20.0401, 73.8534)],
            [(20.0396, 73.849), (20.0407, 73.8474)],
        ]
        while self.is_running:
            async with self:
                if not self._object_states:
                    return
                new_objects = []
                for i, state in enumerate(self._object_states):
                    path = paths[state["path_idx"]]
                    start_node = path[state["segment_idx"]]
                    end_node = path[(state["segment_idx"] + 1) % len(path)]
                    lat = (
                        start_node[0]
                        + (end_node[0] - start_node[0]) * state["progress"]
                    )
                    lng = (
                        start_node[1]
                        + (end_node[1] - start_node[1]) * state["progress"]
                    )
                    new_objects.append(
                        {
                            "id": i,
                            "lat": lat,
                            "lng": lng,
                            "type": state["type"],
                            "color": "#3b82f6"
                            if state["type"] == "person"
                            else "#4f46e5",
                        }
                    )
                    state["progress"] += 0.05
                    if state["progress"] >= 1.0:
                        state["progress"] = 0.0
                        state["segment_idx"] = (state["segment_idx"] + 1) % len(path)
                        if state["segment_idx"] == 0:
                            state["path_idx"] = random.randint(0, len(paths) - 1)
                self.moving_objects = new_objects
            await asyncio.sleep(1)

    @rx.var
    def green_initiatives_recommendations(self) -> list[dict[str, str]]:
        recommendations = []
        if self.campus_avg_aqi > 90:
            recommendations.append(
                {
                    "icon": "tree-pine",
                    "title": "Tree Plantation Drive",
                    "description": "Campus AQI is elevated. Planting more trees can help filter pollutants and improve air quality.",
                    "color": "text-green-600",
                }
            )
        high_co2_sensors = [
            s
            for s in self.sensors.values()
            if s["readings"] and s["readings"][-1]["co2"] > 800
        ]
        if len(high_co2_sensors) > 2:
            recommendations.append(
                {
                    "icon": "bike",
                    "title": "Promote Bicycle Zones",
                    "description": "High CO2 levels detected near multiple zones, likely due to vehicle traffic. Promoting bicycle usage can reduce emissions.",
                    "color": "text-sky-600",
                }
            )
        high_temp_sensors = [
            s
            for s in self.sensors.values()
            if s["readings"] and s["readings"][-1]["temperature"] > 32
        ]
        if len(high_temp_sensors) > 3:
            recommendations.append(
                {
                    "icon": "solar-panel",
                    "title": "Explore Solar Initiatives",
                    "description": "Consistently high temperatures suggest an opportunity to harness solar energy. Consider installing solar panels on rooftops.",
                    "color": "text-orange-500",
                }
            )
        if not recommendations:
            recommendations.append(
                {
                    "icon": "party-popper",
                    "title": "All Green!",
                    "description": "Environmental parameters are within optimal ranges. Keep up the great work in maintaining a sustainable campus!",
                    "color": "text-emerald-500",
                }
            )
        return recommendations

    @rx.var
    def campus_insights(self) -> str:
        """Generates a dynamic insight text based on data trends."""
        if not self.sensors or not any((s["readings"] for s in self.sensors.values())):
            return "Awaiting data for insights..."
        campus_sensors = [
            s
            for s in self.sensors.values()
            if s["type"] == "Campus" and len(s["readings"]) > 2
        ]
        if not campus_sensors:
            return "Insufficient data for trend analysis."
        current_aqi = self.campus_avg_aqi
        yesterday_aqi_sum = 0
        count = 0
        now = datetime.now(timezone.utc)
        one_day_ago = (now - timedelta(days=1)).timestamp()
        for sensor in campus_sensors:
            for reading in sensor["readings"]:
                reading_time = datetime.fromisoformat(reading["timestamp"]).timestamp()
                if abs(reading_time - one_day_ago) < 3600:
                    yesterday_aqi_sum += reading["aqi"]
                    count += 1
                    break
        if count == 0:
            return f"Campus AQI is currently {current_aqi}. Keep monitoring for trends."
        yesterday_avg_aqi = yesterday_aqi_sum / count
        change = (current_aqi - yesterday_avg_aqi) / yesterday_avg_aqi * 100
        if abs(change) < 5:
            return f"AQI is stable at {current_aqi}, similar to yesterday."
        elif change > 0:
            return f"AQI has risen by {abs(change):.0f}% to {current_aqi} compared to yesterday."
        else:
            return f"AQI has improved by {abs(change):.0f}% to {current_aqi} since yesterday!"

    @rx.var
    def prediction_confidence(self) -> int:
        """Calculates a mock prediction confidence score."""
        if not self.selected_sensor or len(self.selected_sensor["readings"]) < 10:
            return 0
        confidence = min(95, 50 + len(self.selected_sensor["readings"]))
        return confidence

    @rx.var
    def confidence_color(self) -> str:
        """Returns color based on prediction confidence."""
        conf = self.prediction_confidence
        if conf > 80:
            return "bg-green-100 text-green-800"
        elif conf > 60:
            return "bg-yellow-100 text-yellow-800"
        else:
            return "bg-red-100 text-red-800"
    
    # New 3D campus states
    map_view_mode: str = "3d"
    show_traffic: bool = False
    show_weather: bool = False
    show_3d_terrain: bool = False
    real_weather_temp: str = "28"
    real_weather_humidity: str = "65"
    
    
    def toggle_traffic_layer(self):
        """Toggle traffic layer visibility"""
        self.show_traffic = not self.show_traffic
    
    def toggle_weather_layer(self):
        """Toggle weather layer visibility"""
        self.show_weather = not self.show_weather
    
    def toggle_terrain_3d(self):
        """Toggle 3D terrain"""
        self.show_3d_terrain = not self.show_3d_terrain
    
    
    def reset_view(self):
        """Reset camera view to default"""
        # This will be used by the frontend
        pass

    
    def set_map_view_mode(self, mode: str):
        """Set map view mode and sync with iframe"""
        self.map_view_mode = mode
        # The iframe communication is now handled client-side in the components
    
    def spawn_agents(self):
        """Spawn agents in the campus"""
        # This will trigger the client-side script that updates the iframe
        pass
    
    def update_weather_data(self, temp: str, humidity: str):
        """Update weather data"""
        self.real_weather_temp = temp
        self.real_weather_humidity = humidity