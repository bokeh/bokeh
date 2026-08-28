import random
from datetime import datetime

from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import Button
from bokeh.models.dom import TranslatableText

available_locales = ["en", "es-CO", "pl-PL", "fr-FR", "de-DE", "hi-IN", "pt-BR", "ar"]

button = Button(label="Change to a random language!")
button1 = Button(
    label=TranslatableText(
        content="button1.label",
        options={
            "interpolation": {
                "locale": {
                    "value": "en",
                    "formatting": {
                        "format": "display",
                        "options": {"type": "language"},
                    },
                },
                "current_date": {
                    "value": datetime.now(),
                    "formatting": {
                        "format": "date",
                        "options": {
                          "weekday": "long",
                          "year": "numeric",
                          "month": "long",
                          "day": "numeric",
                        },
                    },
                },
            },
        },
    ),
)
button2 = Button(label="String used as key itself to get its translation.")

def change_locale(event):
    locale_selection = random.choice(available_locales)
    curdoc().config.i18n.locale = locale_selection
    button1.label.options = {
        "interpolation": {
            "locale": {
                "value": locale_selection,
                "formatting": {
                    "format": "display",
                    "options": {"type": "language"},
                },
            },
            "current_date": {
                "value": datetime.now(),
                "formatting": {
                    "format": "date",
                    "options": {
                      "weekday": "long",
                      "year": "numeric",
                      "month": "long",
                      "day": "numeric",
                    },
                },
            },
        },
    }

button.on_click(change_locale)

curdoc().add_root(column([button, button1, button2]))
curdoc().config.i18n.locales_codes = available_locales
curdoc().config.i18n.translations = {
    "en": {
        "button1": {"label": "Test {{locale}} - {{current_date}} - {{missing_interpolation_var}}"},
        "String used as key itself to get its translation.": "String used as key itself to get its translation (manually set).",
    },
    "es-CO": {
        "button1": {"label": "Prueba {{locale}} - {{current_date}}"},
        "String used as key itself to get its translation.": "Cadena usada en si misma como llave para obtener su traducción (traducida manualmente).",
    },
    "pl-PL": {
        "button1": {"label": "Test {{locale}} - {{current_date}}"},
    },
    "fr-FR": {
        "button1": {"label": "Test {{locale}} - {{current_date}}"},
    },
    "de-DE": {
        "button1": {"label": "Prüfen {{locale}} - {{current_date}}"},
    },
    "hi-IN": {
        "button1": {"label": "परीक्षा {{locale}} - {{current_date}}"},
    },
    "pt-BR": {
        "button1": {"label": "Teste {{locale}} - {{current_date}}"},
    },
    "ar": {
        "button1": {"label": "امتحان {{locale}} - {{current_date}}"},
    },
}
curdoc().config.i18n.languages = [
    ["English", "en"],
    ["Español (CO)", "es-CO"],
    ["Polski (PL)", "pl-PL"],
    ["Français (FR)", "fr-FR"],
    ["Deutsch (DE)", "de-DE"],
    ["हिन्दी", "hi-IN"],
    ["Português (BR)", "pt-BR"],
    ["اَلْعَرَبِيَّةُ", "ar"],
]
curdoc().config.i18n.source_language = "en"
curdoc().config.i18n.auto_t_enabled = True
