import reflex as rx
from app.state import CitiPulseState


def stat_card(title: str, value: rx.Var | str, unit: str, icon: str) -> rx.Component:
    return rx.el.div(
        rx.el.div(
            rx.el.div(
                rx.el.p(title, class_name="text-sm text-slate-500 mb-1"),
                rx.el.h3(f"{value} {unit}", class_name="text-3xl font-bold"),
            ),
            rx.el.div(
                rx.icon(icon, class_name="h-5 w-5"),
                class_name="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white rounded-xl p-3",
            ),
            class_name="flex justify-between items-center",
        ),
        class_name="p-6 rounded-2xl backdrop-blur-xl bg-white/90 shadow-xl border border-emerald-100 hover:shadow-2xl transition-all",
    )


def campus_health_pulse() -> rx.Component:
    return rx.el.div(
        rx.el.div(
            rx.el.div(
                class_name=rx.cond(
                    CitiPulseState.is_running,
                    "absolute inset-0 rounded-full animate-pulse "
                    + CitiPulseState.pulse_color_class,
                    "",
                )
            ),
            rx.el.div(
                rx.el.p(
                    CitiPulseState.campus_avg_aqi,
                    class_name="text-2xl font-bold text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_20%)]",
                ),
                rx.el.p(
                    "AQI",
                    class_name="text-xs font-semibold text-white/80 [text-shadow:_0_1px_2px_rgb(0_0_0_/_20%)]",
                ),
                class_name="relative w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg "
                + CitiPulseState.pulse_color_class,
            ),
            class_name="relative",
        ),
        rx.el.div(
            rx.el.p("Campus Health", class_name="text-sm text-slate-500 text-center"),
            rx.el.h4(
                CitiPulseState.campus_health_status,
                class_name="font-bold text-lg text-center "
                + CitiPulseState.pulse_text_color,
            ),
            class_name="text-left",
        ),
        class_name="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg border border-emerald-100",
    )


def live_data_badge() -> rx.Component:
    return rx.el.div(
        rx.el.span(class_name="relative flex h-3 w-3"),
        rx.el.span(
            class_name="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
        ),
        rx.el.span(class_name="relative inline-flex rounded-full h-3 w-3 bg-red-500"),
        rx.el.span("LIVE", class_name="ml-2 text-sm font-semibold text-red-600"),
        class_name="relative flex items-center",
    )


def cgi_chart() -> rx.Component:
    return rx.el.div(
        rx.el.div(
            rx.el.div(
                rx.recharts.radial_bar_chart(
                    rx.recharts.radial_bar(
                        data_key="value",
                        background={"fill": "#e5e7eb"},
                        fill=CitiPulseState.cgi_color,
                        cornerRadius=10,
                    ),
                    data=CitiPulseState.cgi_chart_data,
                    inner_radius="80%",
                    outer_radius="100%",
                    start_angle=90,
                    end_angle=-270,
                    bar_size=12,
                    width="100%",
                    height="100%",
                ),
                class_name="absolute inset-0",
            ),
            rx.el.div(
                rx.el.p(
                    CitiPulseState.campus_green_index.to_string(),
                    class_name="text-2xl font-bold",
                    color=CitiPulseState.cgi_color,
                ),
                rx.el.p("CGI", class_name="text-xs font-semibold text-slate-500"),
                class_name="absolute inset-0 flex flex-col items-center justify-center",
            ),
            class_name="relative w-24 h-24",
        ),
        rx.el.div(
            rx.el.p("Green Index", class_name="text-sm text-slate-500 text-center"),
            rx.el.h4(
                CitiPulseState.campus_health_status,
                class_name="font-bold text-lg text-center",
                color=CitiPulseState.pulse_text_color,
            ),
        ),
        class_name="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg border border-emerald-100",
    )


def insight_banner() -> rx.Component:
    return rx.el.div(
        rx.icon("sparkles", class_name="h-5 w-5 text-purple-500"),
        rx.el.p("AI Insight:", class_name="font-bold text-purple-700"),
        rx.el.p(CitiPulseState.campus_insights, class_name="text-slate-600"),
        class_name="flex items-center gap-3 p-4 rounded-xl bg-purple-50/70 border border-purple-200 shadow-sm mb-6",
    )


def dashboard_page() -> rx.Component:
    return rx.el.div(
        rx.el.div(
            rx.el.div(
                rx.el.div(
                    rx.el.h1(
                        "Environmental Dashboard",
                        class_name="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent",
                    ),
                    rx.el.p(
                        f"Last updated: {CitiPulseState.last_updated_display}",
                        class_name="text-xs text-slate-500 mt-1",
                    ),
                ),
                live_data_badge(),
                class_name="flex items-center gap-4",
            ),
            rx.el.div(
                cgi_chart(), campus_health_pulse(), class_name="flex items-center gap-4"
            ),
            class_name="flex justify-between items-center mb-6",
        ),
        insight_banner(),
        rx.el.div(
            stat_card(
                "Temperature",
                CitiPulseState.campus_avg_temp.to_string(),
                "°C",
                "thermometer",
            ),
            stat_card(
                "Humidity",
                CitiPulseState.campus_avg_humidity.to_string(),
                "%",
                "droplets",
            ),
            stat_card(
                "Air Quality Index",
                CitiPulseState.campus_avg_aqi.to_string(),
                "AQI",
                "wind",
            ),
            stat_card(
                "CO₂ Levels", CitiPulseState.campus_avg_co2.to_string(), "ppm", "leaf"
            ),
            class_name="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8",
        ),
        rx.el.div(),
    )