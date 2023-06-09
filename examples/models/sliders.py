'''Demonstrates the use of many Bokeh sliders with examples such as a numerical slider, a disabled slider, a date picker,
and a color picker.

.. bokeh-example-metadata::
    :apis: bokeh.models.Column, bokeh.models.CustomJS, bokeh.models.DateRangeSlider, bokeh.models.DateSlider, bokeh.models.Div, bokeh.models.RangeSlider, bokeh.models.Row, bokeh.models.Slider, bokeh.document.document, bokeh.embed.file_html, bokeh.util.browser.view
    :refs: :ref:`ug_interaction_widgets`
    :keywords: slider

''' # noqa: E501
from datetime import date

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (Column, CustomJS, DateRangeSlider,
                          DateSlider, Div, RangeSlider, Row, Slider)
from bokeh.util.browser import view

slider = Slider(title="Numerical", value=50, start=0, end=96, step=5)

disabled_slider = Slider(title="Disabled", value=50, start=0, end=96, step=5, disabled=True)

range_slider = RangeSlider(title="Numerical range", value=[30, 70], start=0, end=100, step=0.5)

date_slider = DateSlider(title="Date", value=date(2014, 1, 1), start=date(2010, 1, 1), end=date(2020, 1, 1), step=1)

date_range_slider = DateRangeSlider(title="Date range", value=(date(2014, 1, 1), date(2018, 12, 31)), start=date(2010, 1, 1), end=date(2020, 1, 1), step=1)

only_value_slider = Slider(value=50, start=0, end=96, step=5)

no_title_slider = Slider(title=None, value=50, start=0, end=96, step=5)

def color_picker():
    def color_slider(title, color):
        return Slider(title=title, show_value=False, value=127, start=0, end=255, step=1, orientation="vertical", bar_color=color)

    red   = color_slider("R", "red")
    green = color_slider("G", "green")
    blue  = color_slider("B", "blue")

    div = Div(width=100, height=100, background="rgb(127, 127, 127)")

    cb = CustomJS(args=dict(red=red, green=green, blue=blue, div=div), code="""
        const r = red.value
        const g = green.value
        const b = blue.value
        div.background = `rgb(${r}, ${g}, ${b})`
    """)

    red.js_on_change('value', cb)
    green.js_on_change('value', cb)
    blue.js_on_change('value', cb)

    return Row(children=[red, green, blue, div])

sliders = Row(children=[
    Column(children=[
        slider,
        disabled_slider,
        range_slider,
        date_slider,
        date_range_slider,
        only_value_slider,
        no_title_slider,
    ]),
    color_picker(),
])

doc = Document()
doc.add_root(sliders)

if __name__ == "__main__":
    doc.validate()
    filename = "sliders.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, title="sliders"))
    print(f"Wrote {filename}")
    view(filename)
