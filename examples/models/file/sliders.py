from __future__ import print_function

from datetime import date

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.util.browser import view
from bokeh.models.layouts import Row, Column, WidgetBox
from bokeh.models.widgets import Slider, RangeSlider, DateSlider, DateRangeSlider, Div
from bokeh.models.callbacks import CustomJS

slider = Slider(value=50, start=0, end=96, step=5)

disabled_slider = Slider(value=50, start=0, end=96, step=5, disabled=True)

range_slider = RangeSlider(value=[30, 70], start=0, end=100, step=0.5)

date_slider = DateSlider(value=date(2014, 1, 1), start=date(2010, 1, 1), end=date(2020, 1, 1), step=1)

date_range_slider = DateRangeSlider(value=(date(2014, 1, 1), date(2018, 12, 31)), start=date(2010, 1, 1), end=date(2020, 1, 1), step=1)

def color_picker():
    def color_slider(color):
        return Slider(height=300, value=127, start=0, end=255, step=1, orientation="vertical", bar_color=color)

    red   = color_slider("red")
    green = color_slider("green")
    blue  = color_slider("blue")

    div = Div(width=100, height=100)

    cb = CustomJS(args=dict(red=red, green=green, blue=blue, div=div), code="""
      // div.style.background_color = "rgb(" + red.value + ", " + green.value + ", " + blue.value + ")";
      div.text = "rgb(" + red.value + ", " + green.value + ", " + blue.value + ")";
    """)

    red.callback   = cb
    green.callback = cb
    blue.callback  = cb

    return Row(children=[
        WidgetBox(width=50, children=[red]),
        WidgetBox(width=50, children=[green]),
        WidgetBox(width=50, children=[blue]),
        div,
    ])

sliders = Row(children=[
    Column(children=[
        slider,
        disabled_slider,
        range_slider,
        date_slider,
        date_range_slider,
    ]),
    color_picker(),
])

doc = Document()
doc.add_root(sliders)

if __name__ == "__main__":
    doc.validate()
    filename = "sliders.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "sliders"))
    print("Wrote %s" % filename)
    view(filename)
