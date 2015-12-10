from functools import partial

from bokeh.sampledata.autompg import autompg
from bokeh.models import ColumnDataSource, Panel, Tabs, Range

from bokeh.models.widgets import HBox, VBox, PreText, Select
from bokeh.properties import Dict, Enum, Instance, List, String, Any, Int
from bokeh.plotting import Figure
from bokeh.model import Model
from bokeh.sampledata.autompg import autompg
from bokeh.io import curdoc

from bokeh.charts import Bar, Scatter

import pdb

class AppModel(object):

    def __init__(self, df):
        self.df = df
        self.data = ColumnDataSource(df)
        self.columns = []
        self.col_names = self.data.column_names
        self.filtered_data = None
        self.plot_type_options = ['scatter', 'bar']
        self.agg_options = ['sum', 'mean', 'last', 'count', 'percent']
        self.x_field = self.col_names[0]
        self.y_field = self.col_names[1]
        self.plot_type = self.plot_type_options[0]
        self.agg_type = self.agg_options[0]

    def get_plot_args(self):
        d = {}
        d['tools'] = 'pan,wheel_zoom'
        d['x'] = self.x_field
        d['y'] = self.y_field
        d['xlabel'] = self.x_field
        d['ylabel'] = self.y_field
        return d

class AppController(object):

    def __init__(self, data_model):
        self.model = data_model
        self.views = []

    def add_view(self, view):
        self.views.append(view)

    def bind_to_model(self, widget, widget_field, model_field):
        widget.on_change(widget_field, partial(self.on_change, model_field=model_field))

    def on_change(self, attr, old, new, model_field):
        setattr(self.model, model_field, new)
        self.update_views()

    def update_views(self):
        for v in self.views:
            v.update()

class AppView(object):
    '''Main all-encompassing view class for example'''

    def __init__(self, app_model, app_controller):
        self.model = app_model
        self.controller = app_controller
        self.layout = VBox()
        self.create_children()

    def create_children(self):
        self.controls_view = ControlsView(self.model, self.controller)
        self.plot_view = PlotView(self.model, self.controller)
        self.controller.add_view(self.plot_view)
        self.controller.add_view(self)
        self.update()

    def update(self):
        self.layout.children = [self.controls_view.layout, self.plot_view.layout]

class PlotView(object):

    def __init__(self, app_model, app_controller):
        self.model = app_model
        self.controller = app_controller
        self.layout = HBox()
        self.plots = []
        self.create_children()

    def on_plot_change(self, attr, old, new):
        pdb.set_trace()
        pass

    def create_children(self):
        del self.plots[:]
        if self.model.plot_type == 'scatter':
            pdb.set_trace()
            scatter = Scatter(self.model.df, **self.model.get_plot_args())
            scatter.on_change('value', self.on_plot_change)
            self.plots.append(scatter)

        elif self.model.plot_type == 'bar':
            self.plots.append(Bar(**self.model.get_plot_args()))

        self.layout.children = self.plots

    def update(self):
        self.create_children()

class ControlsView(object):

    def __init__(self, app_model, app_controller):
        self.model = app_model
        self.controller = app_controller
        self.layout = HBox()
        self.create_children()

    def create_children(self):
        self.plot_selector = Select.create(name="plot_type", value=self.model.plot_type, options=self.model.plot_type_options)
        self.controller.bind_to_model(self.plot_selector, 'value', 'plot_type')

        self.x_selector = Select.create(name="x", value=self.model.x_field, options=self.model.col_names)
        self.controller.bind_to_model(self.x_selector, 'value', 'x_field')

        self.y_selector = Select.create(name="y", value=self.model.y_field, options=self.model.col_names)
        self.controller.bind_to_model(self.y_selector, 'value', 'y_field')

        self.agg_selector = Select.create(name='agg', value=self.model.agg_type, options=self.model.agg_options)
        self.controller.bind_to_model(self.agg_selector, 'value', 'agg_type')

        self.layout.children = [self.plot_selector, self.x_selector, self.y_selector, self.agg_selector]

    def update(self):
        pass


model = AppModel(autompg)
controller = AppController(model)
view = AppView(model, controller)
doc = curdoc().add_root(view.layout)

