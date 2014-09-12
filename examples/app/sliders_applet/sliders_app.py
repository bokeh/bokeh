"""
This file demonstrates a bokeh applet, which can be viewed directly
on a bokeh-server. See the README.md file in this directory for
instructions on running.
"""

import logging
logging.basicConfig(level=logging.DEBUG)

import numpy as np

from bokeh.plotting import line
from bokeh.objects import Plot, ColumnDataSource, Range1d
from bokeh.properties import Instance
from bokeh.server.app import bokeh_app
from bokeh.server.utils.plugins import object_page
from bokeh.widgets import HBox, Slider, TextInput, VBoxForm

class SlidersApp(HBox):
    extra_generated_classes = [["SlidersApp", "SlidersApp", "HBox"]]

    inputs = Instance(VBoxForm)

    text = Instance(TextInput)

    offset = Instance(Slider)
    amplitude = Instance(Slider)
    phase = Instance(Slider)
    freq = Instance(Slider)

    plot = Instance(Plot)
    source = Instance(ColumnDataSource)

    @classmethod
    def create(cls):
        """
        This function is called once, and is responsible for
        creating all objects (plots, datasources, etc)
        """
        obj = cls()

        obj.source = ColumnDataSource(data=dict(x=[], y=[]))

        obj.text = TextInput(
            title="title", name='title', value='my sin wave'
        )

        obj.offset = Slider(
            title="offset", name='offset',
            value=0.0, start=-5.0, end=5.0
        )
        obj.amplitude = Slider(
            title="amplitude", name='amplitude',
            value=1.0, start=-5.0, end=5.0
        )
        obj.phase = Slider(
            title="phase", name='phase',
            value=0.0, start=0.0, end=2*np.pi
        )
        obj.freq = Slider(
            title="frequency", name='frequency',
            value=1.0, start=0.1, end=5.1
        )

        obj.plot = line('x', 'y', source=obj.source,
                        plot_width=400, plot_height=400,
                        line_width=3, line_alpha=0.6,
                        title=obj.text.value,
                        x_range=[0, 4*np.pi], y_range=[-2.5, 2.5]
        )

        obj.update_data()

        obj.inputs = VBoxForm(
            children=[
                obj.text, obj.offset, obj.amplitude, obj.phase, obj.freq
            ]
        )

        obj.children.append(obj.inputs)
        obj.children.append(obj.plot)

        return obj

    def setup_events(self):
        super(SlidersApp, self).setup_events()
        if not self.text:
            return
        self.text.on_change('value', self, 'input_change')
        for w in ["offset", "amplitude", "phase", "freq"]:
            getattr(self, w).on_change('value', self, 'input_change')

    def input_change(self, obj, attrname, old, new):
        """
        This callback is executed whenever the input form changes. It is
        responsible for updating the plot, or anything else you want.
        The signature is:

        Args:
            obj : the object that changed
            attrname : the attr that changed
            old : old value of attr
            new : new value of attr

        """
        self.update_data()
        self.plot.title = self.text.value

    def update_data(self):
        N = 200
        a = self.amplitude.value
        b = self.offset.value
        w = self.phase.value
        k = self.freq.value

        x = np.linspace(0, 4*np.pi, N)
        y = a * np.sin(k*x + w) + b

        logging.debug(
            "PARAMS: offset: %s amplitude: %s", self.offset.value, self.amplitude.value
        )

        self.source.data = dict(x=x, y=y)

# The following code adds a "/bokeh/sliders/" url to the bokeh-server. This
# URL will render this StockApp. If you don't want to serve this applet from
# a Bokeh server (for instance if you are embedding in a separate Flask
# application), then just remove this block of code.
@bokeh_app.route("/bokeh/sliders/")
@object_page("sin")
def make_object():
    app = SlidersApp.create()
    return app
