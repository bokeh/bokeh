from bokeh import events
from bokeh.io import curdoc, show
from bokeh.layouts import column
from bokeh.models import (Button, CustomJS, Dropdown,
                          LanguageDropdown, Legend, LegendItem)
from bokeh.plotting import figure

# TODO: i18n config should be handled via the curdoc().config instead of passing values to language dropdown
language_dropdown = LanguageDropdown(
    locales_codes=["en", "es-CO", "pl-PL", "fr-FR", "de-DE", "hi-IN", "pt-BR", "ar"],
    translations="""
    {
     "en": {"button1": { "label": "Test en" }, "String used as key itself to get its translation": "String used as key itself to get its translation" },
     "es-CO": {
         "button1": {"label": "Prueba es-CO" },
         "String used as key itself to get its translation": "Cadena usada en si misma como llave para obtener su traducción"
     },
     "pl-PL": {},
     "fr-FR": {},
     "de-DE": {},
     "hi-IN": {},
     "pt-BR": {},
     "ar": {}
    }""",
    languages=[
      ("English", "en"),
      ("Español (CO)", "es-CO"),
      ("Polski (PL)", "pl-PL"),
      ("Français (FR)", "fr-FR"),
      ("Deutsch (DE)", "de-DE"),
      ("हिन्दी", "hi-IN"),
      ("Português (BR)", "pt-BR"),
      ("اَلْعَرَبِيَّةُ", "ar"),
    ],
    source_language="en",
    auto_t_enabled=True,
)
language_dropdown.js_on_event("menu_item_click", CustomJS(code="console.log('languagedropdown: ' + this.item, this.toString())"))
button = Button(label="button1.label")
button_non_convention_string = Button(label="String used as key itself to get its translation")
button_fixed = Button(label="Fixed label but auto-translatable via Chrome Translator API")
dropdown = Dropdown(label="Select an option", button_type="primary", menu=[
    ("Item 1", "item_1"),
    ("Item 2", "item_2"),
    None,
    ("Item 3", "item_3"),
])

p = figure(title="Multi-line plot translation example")

p.xaxis.axis_label = "X-Axis"
p.yaxis.axis_label = "Y-Axis"

r = p.multi_line([[1,2,3], [1,2,3], [3,2,1]], [[1,3,2], [3,4,3], [3,2,1]],
                 color=["orange", "red", "blue"], line_width=4)

legend = Legend(
    items=[
        LegendItem(label="orange", renderers=[r], index=0),
        LegendItem(label="red", renderers=[r], index=1),
        LegendItem(label="blue", renderers=[r], index=2),
    ],
    title="Available colors",
)
p.add_layout(legend)

curdoc().on_event(events.DocumentReady, CustomJS(code="""
    cb_obj.config.i18n.set_config(
      ["en", "es-CO", "pl-PL", "fr-FR", "de-DE", "hi-IN", "pt-BR", "ar"],
      `{
        "en": { "legend": { "title": "Available colors" }},
        "es-CO": { "legend": { "title": "Colores disponibles" }},
        "pl-PL": { "legend": { "title": "Dostępne kolory" }},
        "fr-FR": { "legend": { "title": "Couleurs disponibles" }},
        "de-DE": { "legend": { "title": "Verfügbare Farben" }},
        "hi-IN": { "legend": { "title": "उपलब्ध रंग" }},
        "pt-BR": { "legend": { "title": "Cores disponíveis" }},
        "ar": { "legend": { "title": "الألوان المتاحة" }}
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
"""))

show(column(language_dropdown, button, button_non_convention_string, button_fixed, dropdown, p))
