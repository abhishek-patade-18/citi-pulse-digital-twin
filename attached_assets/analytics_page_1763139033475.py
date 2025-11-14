import reflex as rx
from app.state import CitiPulseState, SensorReading
from datetime import datetime

TOOLTIP_STYLE = {
    "background": "#FFFFFF",
    "border": "1px solid #E5E7EB",
    "border_radius": "0.5rem",
    "box_shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
}
CHART_MARGIN = {"top": 20, "right": 30, "left": 20, "bottom": 70}


def chart_component(data_key: str, stroke_color: str, name: str) -> rx.Component:
    return rx.recharts.line_chart(
        rx.recharts.cartesian_grid(stroke_dasharray="3 3", vertical=False),
        rx.recharts.graphing_tooltip(cursor=False, content_style=TOOLTIP_STYLE),
        rx.recharts.x_axis(
            data_key="timestamp",
            angle=-45,
            text_anchor="end",
            height=50,
            stroke="#A1A1AA",
        ),
        rx.recharts.y_axis(width=30, stroke="#A1A1AA"),
        rx.recharts.line(
            data_key=data_key,
            type_="natural",
            stroke=stroke_color,
            stroke_width=2,
            dot=False,
            name=name,
        ),
        data=CitiPulseState.analytics_data,
        height=250,
        margin=CHART_MARGIN,
    )


def analytics_header() -> rx.Component:
    return rx.el.div(
        rx.el.div(
            rx.el.h1(
                "Analytics & Insights",
                class_name="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent",
            ),
            rx.el.p(
                "Analyze historical data and AI-powered predictions for each sensor.",
                class_name="text-slate-500 mt-1",
            ),
        ),
        rx.el.div(
            rx.el.select(
                rx.foreach(
                    CitiPulseState.sensor_list,
                    lambda sensor: rx.el.option(
                        sensor["name"], value=sensor["id"].to_string()
                    ),
                ),
                on_change=CitiPulseState.set_analytics_sensor_id,
                default_value=CitiPulseState.analytics_sensor_id.to_string(),
                size="3",
                class_name="bg-white/80 backdrop-blur-md rounded-lg shadow-sm border-emerald-200",
            ),
            rx.el.button(
                "Export CSV",
                rx.icon("download", class_name="ml-2 h-4 w-4"),
                on_click=CitiPulseState.export_sensor_data_csv,
                class_name="bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition-all",
            ),
            class_name="flex items-center gap-4",
        ),
        class_name="flex justify-between items-center mb-6",
    )


def chart_card(title: str, data_key: str, color: str, name: str) -> rx.Component:
    return rx.el.div(
        rx.el.h3(title, class_name="text-lg font-semibold text-gray-700 mb-2"),
        chart_component(data_key, color, name),
        class_name="bg-white/90 p-6 rounded-2xl shadow-xl border border-emerald-100",
    )


def analytics_page() -> rx.Component:
    return rx.el.div(
        analytics_header(),
        rx.el.div(
            chart_card("Air Quality Index (AQI)", "aqi", "#10B981", "AQI"),
            chart_card("Temperature (°C)", "temperature", "#F97316", "Temp"),
            chart_card("Humidity (%)", "humidity", "#3B82F6", "Humidity"),
            chart_card("CO₂ Levels (ppm)", "co2", "#6B7280", "CO2"),
            class_name="grid md:grid-cols-2 gap-6",
        ),
    )