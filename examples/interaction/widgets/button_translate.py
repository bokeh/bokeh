from bokeh import events
from bokeh.io import curdoc, show
from bokeh.layouts import column
from bokeh.models import Button, CustomJS

button = Button(label="Change language!")
button.js_on_event("button_click", CustomJS(code="""
     const avialable_locales = ["en", "es-CO", "pl-PL", "fr-FR", "de-DE", "hi-IN", "pt-BR", "ar"]
     const locale_selection = avialable_locales[Math.floor(Math.random() * avialable_locales.length)]

     cb_obj.origin.document.config.i18n.set_locale(locale_selection)
"""))

button1 = Button(label="button1.label")
button2 = Button(label="String used as key itself to get its translation")

curdoc().on_event(events.DocumentReady, CustomJS(code="""
    cb_obj.config.i18n.set_config(
      ["en", "es-CO", "pl-PL", "fr-FR", "de-DE", "hi-IN", "pt-BR", "ar"],
      `{
        "en": {
            "button1": { "label": "Test en" },
            "String used as key itself to get its translation": "String used as key itself to get its translation (manually set)"
        },
        "es-CO": {
            "button1": {"label": "Prueba es-CO" },
            "String used as key itself to get its translation": "Cadena usada en si misma como llave para obtener su traducción (traducida manualmente)"
        },
        "pl-PL": {
            "button1": { "label": "Test pl-PL" }
        },
        "fr-FR": {
            "button1": { "label": "Test fr-FR" }
        },
        "de-DE": {
            "button1": { "label": "Prüfen de-DE" }
        },
        "hi-IN": {
            "button1": { "label": "परीक्षा hi-IN" }
        },
        "pt-BR": {
            "button1": { "label": "Teste pt-BR" }
        },
        "ar": {
            "button1": { "label": "امتحان ar" }
        }
       }`,
      [
        ["English", "en"],
        ["Español (CO)", "es-CO"],
        ["Polski (PL)", "pl-PL"],
        ["Français (FR)", "fr-FR"],
        ["Deutsch (DE)", "de-DE"],
        ["हिन्दी", "hi-IN"],
        ["Português (BR)", "pt-BR"],
        ["اَلْعَرَبِيَّةُ", "ar"],
      ],
      "en",
      true,
    )
    cb_obj.config.i18n.set_locale("es-CO")
"""))

show(column([button, button1, button2]))
