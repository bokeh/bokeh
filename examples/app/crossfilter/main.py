from functools import partial

import numpy as np
import pandas as pd

from bokeh.sampledata.autompg import autompg
from bokeh.models import ColumnDataSource, Panel, Tabs, Range

from bokeh.models.widgets import HBox, VBox, PreText, Select
from bokeh.properties import Dict, Enum, Instance, List, String, Any, Int
from bokeh.plotting import Figure
from bokeh.model import Model
from bokeh.sampledata.autompg import autompg
from bokeh.io import curdoc

from bokeh.charts import Bar, Scatter
from bokeh.palettes import Blues4 

from .models import StyleableBox

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
        self.color_field = ''
        self.size_field = ''
        self.color_field = ''
        self.plot_type = self.plot_type_options[0]
        self.agg_type = self.agg_options[0]
        self.continuous_color_ramp = Blues4
        self.dot_sizes = [9, 12, 15, 18]
        self.set_metadata()
        self.set_defaults()
        self.update()

    def set_defaults(self):
        self.x_field = self.continuous_columns[0]['name']
        self.y_field = self.continuous_columns[1]['name']
        self.color_field = self.continuous_columns[2]['name']
        self.size_field = self.continuous_columns[3]['name']

    def set_metadata(self):
        """Creates a list of dicts, containing summary info for each column.
        The descriptions are stored in the ``columns`` property.
        """
        descriptors = []
        columns = self.df.columns
        for c in columns:
            desc = self.df[c].describe()
            if self.df[c].dtype == object:
                descriptors.append({
                    'type': "DiscreteColumn",
                    'name': c,
                    'count': desc['count'],
                    'unique': desc['unique'],
                    'top': desc['top'],
                    'freq': desc['freq'],
                })
            elif self.df[c].dtype == np.datetime64:
                descriptors.append({
                    'type': "TimeColumn",
                    'name': c,
                    'count': desc['count'],
                    'unique': desc['unique'],
                    'first': desc['first'],
                    'last': desc['last'],
                })
            else:
                descriptors.append({
                    'type': "ContinuousColumn",
                    'name': c,
                    'count': desc['count'],
                    'mean': "%.2f"%desc['mean'],
                    'std': "%.2f"%desc['std'],
                    'min': "%.2f"%desc['min'],
                    'max': "%.2f"%desc['max'],
                })

        self.columns = descriptors

    def update(self):
        pass

    @property
    def continuous_columns(self):
        return [x for x in self.columns if x['type'] != 'DiscreteColumn']

    @property
    def discrete_columns(self):
        return [x for x in self.columns if x['type'] == 'DiscreteColumn']

    @property
    def temporal_columns(self):
        return [x for x in self.columns if x['type'] == 'TimeColumn']

class AppController(object):

    def __init__(self, data_model):
        self.model = data_model
        self.views = []

    def register_view_for_update(self, view):
        self.views.append(view)

    def bind_to_model(self, widget, widget_field, model_field):
        widget.on_change(widget_field, partial(self.on_change, model_field=model_field))

    def on_change(self, attr, old, new, model_field):
        setattr(self.model, model_field, new)
        self.update_app()

    def update_app(self):
        self.model.update()
        for v in self.views:
            v.update()

class BaseView(object):

    def __init__(self, app_model, app_controller, layout_class=HBox):
        self.model = app_model
        self.controller = app_controller
        self.layout = layout_class()
        self.create_children()

    def add_select(self, name, options, model_field):
        widget = Select.create(name=name, value=getattr(self.model, model_field), options=options)
        self.controller.bind_to_model(widget, 'value', model_field)
        self.layout.children.append(widget)
        return widget

    def update(self):
        pass

class AppView(BaseView):
    '''Main all-encompassing view class for example'''

    def create_children(self):
        self.controls_view = ControlsView(self.model, self.controller)
        self.plot_view = PlotView(self.model, self.controller)
        self.controller.register_view_for_update(self.plot_view)
        self.controller.register_view_for_update(self)
        self.update()

    def update(self):
        self.layout.children = [self.controls_view.layout, self.plot_view.layout]

class PlotView(BaseView):

    @property
    def scatter_args(self):
        d = {}
        d['tools'] = 'pan,wheel_zoom'
        d['data'] = self.model.df
        d['x'] = self.model.x_field
        d['y'] = self.model.y_field
        d['xlabel'] = self.model.x_field
        d['ylabel'] = self.model.y_field
        d['color'] = self.model.color_field
        return d

    @property
    def bar_args(self):
        d = {}
        d['tools'] = 'pan,wheel_zoom'
        d['data'] = self.model.df
        d['label'] = self.model.x_field
        d['values'] = self.model.y_field
        d['xlabel'] = self.model.x_field
        d['ylabel'] = self.model.y_field
        d['agg'] = self.model.agg_type
        d['color'] = self.model.color_field
        return d

    def update(self):
        self.create_children()

    def create_children(self):
        self.plots = []
        if self.model.plot_type == 'scatter':
            scatter = Scatter(**self.scatter_args)
            self.plots.append(scatter)
        elif self.model.plot_type == 'bar':
            bar = Bar(**self.bar_args)
            self.plots.append(bar)
        self.layout.children = self.plots

class ControlsView(BaseView):

    def create_children(self):
        cols = self.model.col_names
        self.plot_selector = self.add_select('plot_type', self.model.plot_type_options, 'plot_type')
        self.x_selector = self.add_select('x', cols, 'x_field')
        self.y_selector = self.add_select('y', cols, 'y_field')
        self.color_selector = self.add_select('color', cols, 'color_field')
        self.size_selector = self.add_select('size', cols, 'size_field')
        self.agg_selector = self.add_select('agg', self.model.agg_options, 'agg_type')


model = AppModel(autompg)
controller = AppController(model)
view = AppView(model, controller, layout_class=VBox)
doc = curdoc().add_root(view.layout)
