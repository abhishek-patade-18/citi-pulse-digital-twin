import reflex as rx
from app.state import CitiPulseState, Alert
from datetime import datetime, timezone


def alert_item(alert: Alert) -> rx.Component:
    is_critical = alert["level"] == "critical"
    border_bg_class = rx.cond(
        is_critical, "border-red-500 bg-red-50", "border-amber-500 bg-amber-50"
    )
    return rx.el.div(
        rx.el.div(
            rx.el.div(
                rx.el.h3(
                    f"{alert['parameter']} Alert: {alert['sensor_name']}",
                    class_name="font-semibold",
                ),
                rx.el.p(
                    f"{alert['parameter']} level of {alert['value']} has exceeded the {alert['level']} threshold of {alert['threshold']}.",
                    class_name="text-sm text-slate-600",
                ),
            ),
            rx.el.span(
                alert["level"],
                class_name="text-xs uppercase bg-white/70 rounded-full px-3 py-1 font-semibold",
            ),
            class_name="flex justify-between items-center",
        ),
        class_name=rx.cond(
            is_critical,
            "p-5 border-l-4 rounded-lg border-red-500 bg-red-50/80 backdrop-blur-sm",
            "p-5 border-l-4 rounded-lg border-amber-500 bg-amber-50/80 backdrop-blur-sm",
        ),
    )


def alerts_page() -> rx.Component:
    return rx.el.div(
        rx.el.h1(
            "Alerts",
            class_name="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-4",
        ),
        rx.cond(
            CitiPulseState.all_alerts.length() > 0,
            rx.el.div(
                rx.foreach(CitiPulseState.all_alerts, alert_item),
                class_name="space-y-4",
            ),
            rx.el.div(
                rx.icon("square_check", class_name="h-12 w-12 text-green-500 mx-auto"),
                rx.el.p(
                    "All systems normal.",
                    class_name="mt-4 text-lg font-semibold text-gray-700",
                ),
                rx.el.p(
                    "No alerts to display at this time.",
                    class_name="mt-1 text-sm text-gray-500",
                ),
                class_name="text-center p-12 rounded-2xl backdrop-blur-xl bg-white/90 shadow-xl border border-emerald-100",
            ),
        ),
    )