import bokeh.server
from bokeh.plotting import line, circle, curdoc
from bokeh.server.app import bokeh_app
from bokeh.server.utils.plugins import object_page
from bokeh.widgetobjects import (VBoxForm, HBox,
                                 BokehApplet, TextInput, PreText,
                                 Select, Slider)
from bokeh.objects import Plot, ColumnDataSource, Range1d
from bokeh.plot_object import PlotObject
from bokeh.properties import (Dict, Float, String, Instance)
import numpy as np
import logging
logging.basicConfig(level=logging.DEBUG)

class MyApp(HBox):
    extra_generated_classes = [["MyApp", "MyApp", "HBox"]]

    inputs = Instance(VBoxForm)
    text = Instance(TextInput)
    offset_widget = Instance(Slider)
    scale_widget = Instance(Slider)

    plot = Instance(Plot)
    source = Instance(ColumnDataSource)

    @classmethod
    def create(cls):
        """
        This function is called once, and is responsible for
        creating all objects (plots, datasources, etc)
        """
        obj = cls()
        obj.text = TextInput(title="title", name='title', value='my sin save')
        obj.offset_widget = Slider(title="offset",
                                   name='offset', value=1.0, start=0.0, end=5.0)
        obj.scale_widget = Slider(title="scale",
                                  name='scale', value=1.0, start=-5.0, end=5.0)
        obj.source = ColumnDataSource(data={'x':[], 'y':[]})
        obj.update_data()
        x_range = Range1d(start=0, end=4*np.pi)
        y_range = Range1d(start=-0.5, end=2.5)
        obj.plot = line('x', 'y', source=obj.source,
                        plot_width=400, plot_height=400,
                        title=obj.text.value,
                        x_range=x_range, y_range=y_range
        )
        obj.inputs = VBoxForm(
            children=[obj.text, obj.offset_widget, obj.scale_widget]
        )
        obj.children.append(obj.inputs)
        obj.children.append(obj.plot)
        return obj

    def setup_events(self):
        super(MyApp, self).setup_events()
        if self.text:
            self.text.on_change('value', self, 'input_change')
        if self.offset_widget:
            self.offset_widget.on_change('value', self, 'input_change')
        if self.scale_widget:
            self.scale_widget.on_change('value', self, 'input_change')

    def input_change(self, obj, attrname, old, new):
        """
        This function is called whenever the input form changes
        This is responsible for updating the plot, or whatever
        you want.  The signature is
        obj : the object that changed
        attrname : the attr that changed
        old : old value of attr
        new : new value of attr
        """
        self.update_data()
        self.plot.title = self.text.value

    def update_data(self):
        N = 80
        x = np.linspace(0, 4*np.pi, N)
        y = np.sin(x)
        logging.debug ("PARAMS %s %s", self.offset_widget.value,
                       self.scale_widget.value)
        y = self.offset_widget.value + y * self.scale_widget.value
        self.source.data = {'x' : x.tolist(), 'y' : y.tolist()}

# the following addes "/exampleapp" as a url which renders MyApp

@bokeh_app.route("/bokeh/sin/")
@object_page("sin")
def make_object():
    app = MyApp.create()
    return app
