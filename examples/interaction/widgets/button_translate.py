from bokeh import events
from bokeh.io import curdoc, show
from bokeh.layouts import column
from bokeh.models import Button, CustomJS
from bokeh.models.dom import TranslatableText

button = Button(label="Change to a random language!")
button1 = Button(label=TranslatableText(content="button1.label", options={"interpolation": {"locale": "en"}}))
button2 = Button(label="String used as key itself to get its translation")

button.js_on_event("button_click", CustomJS(args=dict(button1=button1), code="""
     const available_locales = ["en", "es-CO", "pl-PL", "fr-FR", "de-DE", "hi-IN", "pt-BR", "ar"]
     const locale_selection = available_locales[Math.floor(Math.random() * available_locales.length)]

     cb_obj.origin.document.config.i18n.set_locale(locale_selection)
     button1.label.options = {interpolation: {locale: locale_selection}}
"""))

curdoc().on_event(events.DocumentReady, CustomJS(code="""
    cb_obj.config.i18n.set_config(
      ["en", "es-CO", "pl-PL", "fr-FR", "de-DE", "hi-IN", "pt-BR", "ar"],
      `{
        "en": {
            "button1": { "label": "Test {{locale}}" },
            "String used as key itself to get its translation": "String used as key itself to get its translation (manually set)"
        },
        "es-CO": {
            "button1": {"label": "Prueba {{locale}}" },
            "String used as key itself to get its translation": "Cadena usada en si misma como llave para obtener su traducción (traducida manualmente)"
        },
        "pl-PL": {
            "button1": { "label": "Test {{locale}}" }
        },
        "fr-FR": {
            "button1": { "label": "Test {{locale}}" }
        },
        "de-DE": {
            "button1": { "label": "Prüfen {{locale}}" }
        },
        "hi-IN": {
            "button1": { "label": "परीक्षा {{locale}}" }
        },
        "pt-BR": {
            "button1": { "label": "Teste {{locale}}" }
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
    cb_obj.config.i18n.change_locale.emit()
"""))

show(column([button, button1, button2]))
