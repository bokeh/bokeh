from functools import lru_cache
from functools import partial
import pdb

from bokeh.crossfilter.models import CrossFilter
from bokeh.sampledata.autompg import autompg
from bokeh.models import ColumnDataSource, GridPlot, Panel, Tabs, Range

from bokeh.models.widgets import HBox, VBox, PreText, Select
from bokeh.properties import Dict, Enum, Instance, List, String, Any, Int
from bokeh.plotting import Figure
from bokeh.model import Model
from bokeh.sampledata.autompg import autompg
from bokeh.io import curdoc

class CrossFilterModel(Model):
    columns = List(Dict(String, Any))
    col_names = List(String)
    data = Instance(ColumnDataSource)
    filtered_data = Instance(ColumnDataSource)
    plot_type_options = List(String, ['line', 'scatter', 'bar'])
    agg_options = List(String, ['sum', 'mean', 'last', 'count', 'percent'])
    x = String
    y = String
    plot_type = String
    agg = String
    color = String
    title = String
    height = Int()
    width = Int()

    @classmethod
    def create(cls, **kwargs):
        obj = cls()
        obj.data = ColumnDataSource(kwargs.get('df'))
        obj.col_names = obj.data.column_names
        obj.x = obj.col_names[0]
        obj.y= obj.col_names[1]
        return obj

class CrossFilterController(object):

    def __init__(self, data_model):
        self.model = data_model

    def plot_type_change(self, attr, old, new):
        self.model.plot_type = new
        
    def x_axis_change(self, attr, old, new):
        self.model.x = new
        
    def y_axis_change(self, attr, old, new):
        self.model.y = new

    def agg_change(self, attr, old, new):
        self.model.agg = new

class CrossFilterView(object):

    def __init__(self, data_model, app_controller):
        self.model = data_model
        self.controller = app_controller
        self.create_children()
        self.attach_handlers()
        self.update()

    def on_control_change(self, attr, old, new, component=None):
        pdb.set_trace()

    def update(self):
        self.layout_elements()

    def create_children(self):

        self.plot_selector = Select.create(
            title="Plot Type",
            name="plot_type",
            value=self.model.plot_type,
            options=self.model.plot_type_options,
        )

        self.x_selector = Select.create(
            name="x",
            value=self.model.x,
            options=self.model.col_names,
        )

        self.y_selector = Select.create(
            name="y",
            value=self.model.y,
            options=self.model.col_names,
        )

        self.agg_selector = Select.create(
            name='agg',
            value=self.model.agg,
            options=self.model.agg_options,
        )

        self.figure = Figure(tools='pan,wheel_zoom')
        self.figure.scatter(self.model.x, self.model.y, source=self.model.data)

    def attach_handlers(self):
        self.plot_selector.on_change('value', partial(self.on_control_change, component=self.plot_selector))
        self.x_selector.on_change('value', partial(self.on_control_change, component=self.x_selector))
        self.y_selector.on_change('value', partial(self.on_control_change, component=self.y_selector))
        self.agg_selector.on_change('value', partial(self.on_control_change, component=self.agg_selector))

    def layout_elements(self):
        plot_area = VBox(self.figure)
        controls = VBox(self.plot_selector, self.x_selector, self.y_selector, self.agg_selector)
        self.layout = HBox(controls, plot_area)

def main():
    model = CrossFilterModel.create(df=autompg)
    controller = CrossFilterController(model)
    view = CrossFilterView(model, controller)
    curdoc().add_root(view.layout)

main()
