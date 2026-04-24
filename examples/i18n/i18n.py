from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import (Button, CustomJS, Dropdown,
                          LanguageDropdown, Legend, LegendItem)
from bokeh.models.dom import TranslatableText
from bokeh.plotting import figure

language_dropdown = LanguageDropdown(
    locales_codes=["en", "es-CO", "pl-PL", "fr-FR", "de-DE", "hi-IN", "pt-BR", "ar"],
    translations="""
    {
     "en": {"button1": { "label": "Test en"}},
     "es-CO": {"button1": { "label": "Prueba es-CO"}}
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
button = Button(label=TranslatableText(content="button1.label"))
button_fixed = Button(label=TranslatableText(content="Fixed label but auto-translatable via Chrome Translator API"))
dropdown = Dropdown(label=TranslatableText(content="Select an option"), button_type="primary", menu=[
    (TranslatableText(content="Item 1"), "item_1"),
    (TranslatableText(content="Item 2"), "item_2"),
    None,
    (TranslatableText(content="Item 3"), "item_3"),
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
    title=TranslatableText(content="Available colors"),
)
p.add_layout(legend)

show(column(language_dropdown, button, button_fixed, dropdown, p))
