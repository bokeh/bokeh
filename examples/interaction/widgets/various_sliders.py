from datetime import date

from bokeh import models
from bokeh.core.enums import OrientationType
from bokeh.io import show
from bokeh.layouts import column, row

cb = models.CustomJS(code="""
    console.log(`slider: value=${this.value}, ${this.toString()}`)
""")

categories = ["A", "B", "C", "D", "E", "F", "G"]

april = date(2026, 4, 3)
july = date(2026, 7, 16)
january = date(2026, 1, 1)
december = date(2026, 12, 31)

def sliders(orientation: OrientationType) -> list[models.AbstractSlider]:
    examples: list[models.AbstractSlider] = [
        models.Slider(start=10, end=50, value=25, step=1, title="Integer", orientation=orientation),
        models.Slider(start=50, end=10, value=25, step=1, title="Integer reversed", orientation=orientation),
        models.CategoricalSlider(title="Categorical", value="B", categories=categories, orientation=orientation),
        models.DateSlider(title="Date", value=april, start=january, end=december, orientation=orientation),
        models.DateSlider(title="Date reversed", value=april, start=december, end=january, orientation=orientation),
        models.RangeSlider(start=10, end=100, value=(25, 50), step=1, title="Integer range", orientation=orientation),
        models.RangeSlider(start=100, end=10, value=(25, 50), step=1, title="Integer range reversed", orientation=orientation),
        models.DateRangeSlider(title="Date", value=(april, july), start=january, end=december, orientation=orientation),
        models.DateRangeSlider(title="Date reversed", value=(april, july), start=december, end=january, orientation=orientation),
    ]
    for slider in examples:
        slider.js_on_change("value", cb)
    return examples

show(
    row(
        column(*sliders("horizontal")),
        row(*sliders("vertical")),
    ),
)

#slider0_0 = Slider(title="Int", value=50, start=0, end=96, step=5)
#slider0_1 = Slider(title="Float", value=0.5, start=0, end=1, step=0.1)
#slider0_3 = DateSlider(title="Date", value=date(2026, 4, 2), start=date(2026, 1, 1), end=date(2026, 12, 31))

#slider1_0 = Slider(title="Int", value=50, start=0, end=96, step=5, appearance="stealth")
#slider1_1 = Slider(title="Float", value=0.5, start=0, end=1, step=0.1, appearance="stealth")
#slider1_2 = CategoricalSlider(title="Categorical", value="B", categories=["A", "B", "C", "D", "E", "F", "G"], appearance="stealth")
#slider1_3 = DateSlider(title="Date", value=date(2026, 4, 2), start=date(2026, 1, 1), end=date(2026, 12, 31), appearance="stealth")
