from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.layouts import column
from bokeh.models import Slider
from bokeh.plotting import figure


def modify_document(doc):
    slider = Slider(start=1, end=10, value=4, step=1, title="Power")
    plot = figure(height=300, sizing_mode="stretch_width")
    source = plot.line([], []).data_source

    def update(attr=None, old=None, new=None):
        x = list(range(11))
        source.data = {"x": x, "y": [value**slider.value for value in x]}

    slider.on_change("value", update)
    update()
    doc.add_root(column(slider, plot, sizing_mode="stretch_width"))
    doc.title = "Embedded ASGI Bokeh application"


application = Application(FunctionHandler(modify_document))
