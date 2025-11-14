import reflex as rx
import reflex_enterprise as rxe
from app.components.navbar import navbar
from app.pages.dashboard import dashboard_page
from app.pages.map_page import map_page
from app.pages.alerts_page import alerts_page
from app.pages.analytics_page import analytics_page
from app.pages.green_initiatives_page import green_initiatives_page
from app.state import CitiPulseState


def hero_page() -> rx.Component:
    return rx.el.div(
        rx.el.div(
            rx.el.h1(
                "✨ CitiPulse",
                class_name="text-6xl md:text-8xl font-extrabold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent",
            ),
            rx.el.p(
                "Real-Time Digital Twin for MET BKC Campus",
                class_name="text-lg md:text-2xl text-slate-600 mt-4",
            ),
            rx.el.button(
                "Enter Digital Twin",
                rx.icon("arrow_right", class_name="ml-2"),
                on_click=CitiPulseState.enter_dashboard,
                size="4",
                class_name="mt-8 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform",
            ),
            class_name="text-center flex flex-col items-center",
        ),
        class_name="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-cyan-50",
    )


def tech_badge(icon: str, name: str) -> rx.Component:
    return rx.el.div(
        rx.icon(icon, size=16, class_name="text-slate-500"),
        rx.el.span(name, class_name="text-xs font-medium text-slate-600"),
        class_name="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg",
    )


def app_footer() -> rx.Component:
    return rx.el.footer(
        rx.el.div(
            rx.el.p("Built with:", class_name="text-sm font-semibold text-slate-700"),
            rx.el.div(
                tech_badge("cog", "Reflex"),
                tech_badge("code", "Python"),
                tech_badge("database", "scikit-learn"),
                tech_badge("map", "Mapbox"),
                class_name="flex items-center gap-2",
            ),
            class_name="flex items-center gap-4",
        ),
        rx.el.p(
            "CitiPulse © 2024 - A Smart Campus Digital Twin for MET BKC.",
            class_name="text-sm text-slate-500",
        ),
        class_name="flex justify-between items-center p-6 border-t border-emerald-100 mt-12",
    )


def demo_mode_toggle() -> rx.Component:
    return rx.el.button(
        rx.icon("test_tube", size=20),
        rx.el.span(rx.cond(CitiPulseState.demo_mode, "Demo ON", "Demo OFF")),
        on_click=CitiPulseState.toggle_demo_mode,
        class_name=rx.cond(
            CitiPulseState.demo_mode,
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full shadow-2xl animate-pulse",
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 text-slate-700 rounded-full shadow-lg backdrop-blur-md hover:bg-white transition-all",
        ),
    )


def main_app_content() -> rx.Component:
    return rx.el.div(
        navbar(),
        rx.el.main(
            rx.match(
                CitiPulseState.active_page,
                ("Dashboard", dashboard_page()),
                ("Analytics", analytics_page()),
                ("Alerts", alerts_page()),
                ("Green Initiatives", green_initiatives_page()),
                ("Map", map_page()),
                dashboard_page(),
            ),
            class_name="p-6 md:p-8",
        ),
        app_footer(),
        demo_mode_toggle(),
        class_name="min-h-screen text-slate-800 font-['Montserrat'] bg-gradient-to-br from-slate-50 via-emerald-50 to-cyan-50",
    )


def index() -> rx.Component:
    return rx.cond(CitiPulseState.show_dashboard, main_app_content(), hero_page())


app = rxe.App(
    theme=rx.theme(appearance="light", accent_color="green", radius="medium"),
    head_components=[
        rx.el.link(rel="preconnect", href="https://fonts.googleapis.com"),
        rx.el.link(rel="preconnect", href="https://fonts.gstatic.com", cross_origin=""),
        rx.el.link(
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
            rel="stylesheet",
        ),
        rx.el.link(
            rel="stylesheet",
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
            cross_origin="",
        ),
        rx.el.link(rel="stylesheet", href="/animations.css"),
    ],
)
app.add_page(index)
if __name__ == "__main__":
    app.run()

