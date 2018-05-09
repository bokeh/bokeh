from __future__ import print_function

#from datetime import date
import os
import sys
sys.path.append('..')

from IPython import embed

from bokeh.io import show, save, curdoc
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.util.browser import view
from bokeh.models.layouts import Row, Column, WidgetBox
from bokeh.models.widgets import Div
from bokeh.models.callbacks import CustomJS
from bokeh_ion_rangeslider import *

slider = IonRangeSlider(title="Numerical", value=[50, 10000], start=0, end=96, step=5)
duo_slider = IonRangeSlider(slider_type='double', title="Numerical", value=[50, 10000], start=0, end=96, step=5)

disabled_slider = IonRangeSlider(title="Disabled", value=[50, 50], start=0, end=96, step=5, disabled=True)

range_slider = IonRangeSlider(title="Numerical range", value=[30, 70], start=0, end=100, step=0.5)

only_value_slider = IonRangeSlider(value=[50, 50], start=0, end=96, step=5)

no_title_slider = IonRangeSlider(title=None, value=[50, 50], start=0, end=96, step=5)

round = CustomJS(code="""
         var f = cb_obj
         f = Number(f.toPrecision(2))
         return f
     """)

prettified_slider = IonRangeSlider(title=None, values=[1, 2, 3.141592, 1000000], start=0, end=96, step=5, prettify=round)
string_slider = IonRangeSlider(title=None, values=['apple', 'banana', 'cherry', 'kiwi'], value=('banana', 'banana'), prettify=round)

def color_picker():
    def color_slider(title, color):
        return IonRangeSlider(title=title, show_value=False, height=300, value=[127, 127], start=0, end=255, step=1, orientation="vertical", bar_color=color, grid=False)

    red   = color_slider("R", "red")
    green = color_slider("G", "green")
    blue  = color_slider("B", "blue")

    div = Div(width=100, height=100, style=dict(backgroundColor="rgb(127, 127, 127"))

    cb = CustomJS(args=dict(red=red, green=green, blue=blue, div=div), code="""
        var color = "rgb(" + red.value[0] + ", " + green.value[0] + ", " + blue.value[0] + ")";
        div.style = {backgroundColor: color};
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

def color_picker_python():
    def color_slider(title, color):
        return IonRangeSlider(title=title, show_value=False, height=300, value=[127, 127], start=0, end=255, step=1, orientation="vertical", bar_color=color, grid=False)

    red   = color_slider("R", "red")
    green = color_slider("G", "green")
    blue  = color_slider("B", "blue")

    div = Div(width=100, height=100, style=dict(backgroundColor="rgb(127, 127, 127"))

    cb = CustomJS(args=dict(red=red, green=green, blue=blue, div=div), code="""
        var color = "rgb(" + red.value[0] + ", " + green.value[0] + ", " + blue.value[0] + ")";
        div.style = {backgroundColor: color};
    """)
    def callback(attr, old, new):
        #color = slider._property_values['bar_color']
        div.style['backgroundColor'] = 'rgb({:d},{:d},{:d})'.format(red.value[0], green.value[0], blue.value[0])
        return

    red.on_change('value', callback)
    green.on_change('value', callback)
    blue.on_change('value', callback)

    return Column(children=[
        Div(text="Only works with 'bokeh serve'"),
        Row(children=[
            WidgetBox(width=50, children=[red]),
            WidgetBox(width=50, children=[green]),
            WidgetBox(width=50, children=[blue]),
            div,
        ])
    ])
test_slider = IonRangeSlider(slider_type='double', start=0, end=77, values=[1,2,3.123123,40.1234], prettify=round)

sliders = Row(children=[
    Column(children=[
        slider,
        duo_slider,
        disabled_slider,
        range_slider,
        only_value_slider,
        no_title_slider,
        prettified_slider,
        string_slider
    ]),
   Column(children=[
        color_picker(),
        color_picker_python(),
    ])
])

doc = curdoc()
doc.add_root(sliders)
save(doc)

#if __name__ == "__main__":
#    doc.validate()
#    filename = "ion_range_sliders.html"
#    with open(filename, "w") as f:
#        f.write(file_html(doc, INLINE, "ion_range_sliders"))
#    print("Wrote %s" % filename)
#    view(filename)
