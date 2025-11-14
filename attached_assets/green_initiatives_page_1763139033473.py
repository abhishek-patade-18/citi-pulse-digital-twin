import reflex as rx
from app.state import CitiPulseState


def recommendation_card(recommendation: dict[str, str]) -> rx.Component:
    return rx.el.div(
        rx.el.div(
            rx.el.div(
                rx.el.h3(recommendation["title"], class_name="text-xl font-bold"),
                rx.el.p(recommendation["description"], class_name="text-slate-600"),
            ),
            rx.el.span(
                "High Priority",
                class_name="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-semibold",
            ),
            class_name="flex justify-between items-start mb-4",
        ),
        rx.el.p(f"📍 Campus-wide", class_name="text-sm text-slate-500"),
        rx.el.p(
            "High Impact", class_name="text-sm text-emerald-600 font-semibold mt-2"
        ),
        class_name="bg-white/90 p-6 rounded-2xl shadow-xl border-l-4 border-emerald-400 hover:shadow-2xl transition-all",
    )


def green_initiatives_page() -> rx.Component:
    return rx.el.div(
        rx.el.h1(
            "Green Initiatives",
            class_name="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent mb-8",
        ),
        rx.el.div(
            rx.foreach(
                CitiPulseState.green_initiatives_recommendations, recommendation_card
            ),
            class_name="grid md:grid-cols-2 gap-6",
        ),
    )