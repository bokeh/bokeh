from functools import partial

import numpy as np
import pandas as pd

from bokeh.sampledata.autompg import autompg
from bokeh.models import ColumnDataSource, Panel, Tabs, Range

from bokeh.models.widgets import HBox, VBox, PreText, Select, Button
from bokeh.models.widgets import RadioButtonGroup, DataTable
from bokeh.properties import Dict, Enum, Instance, List, String, Any, Int
from bokeh.plotting import Figure
from bokeh.model import Model
from bokeh.models import Range1d
from bokeh.sampledata.autompg import autompg
from bokeh.io import curdoc

from bokeh.charts import Bar, Scatter
from bokeh.palettes import Blues4

from examples.app.crossfilter.models import StyleableBox
from examples.app.crossfilter.models import StatsBox

import pdb

class AppModel(object):
    '''todo: add docs'''

    def __init__(self, df):
        self.doc = None
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
        self.color_field = ''
        self.plot_type = self.plot_type_options[0]
        self.agg_type = self.agg_options[0]
        self.continuous_color_ramp = Blues4
        self.set_metadata()
        self.set_defaults()
        self.filter_states = ['Summary Stats', 'Filters', 'Facets']
        self.active_filter_state = 0
        self.update()

    def set_defaults(self):
        '''todo: add docs'''
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
                    'mean': "%.2f" % desc['mean'],
                    'std': "%.2f" % desc['std'],
                    'min': "%.2f" % desc['min'],
                    'max': "%.2f" % desc['max'],
                })

        self.columns = descriptors

    def update(self):
        '''TODO: add docs'''
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
    '''mediate views -> model updates'''

    def __init__(self, data_model):
        self.model = data_model
        self.views = []

    def register_view_for_update(self, view):
        '''TODO: add docs'''
        self.views.append(view)

    def bind_to_model(self, widget, widget_field, model_field):
        '''TODO: add docs'''
        widget.on_change(widget_field, partial(self.on_change, model_field=model_field))

    def on_change(self, attr, old, new, model_field):
        '''TODO: add docs'''
        setattr(self.model, model_field, new)
        self.update_app()

    def update_app(self):
        '''TODO: add docs'''
        self.model.update()
        for v in self.views:
            v.update()

class BaseView(object):
    '''TODO: add docs'''

    def __init__(self, app_model, app_controller, layout_class=None):
        self.model = app_model
        self.controller = app_controller
        self.layout = layout_class() if layout_class else None
        self.create_children()

    def add_select(self, name, options, model_field):
        '''TODO: add docs'''
        widget = Select.create(name=name, value=getattr(self.model, model_field), options=options)
        self.controller.bind_to_model(widget, 'value', model_field)
        self.layout.children.append(widget)
        return widget

    def update(self):
        '''TODO: add docs'''
        pass

class AppView(BaseView):
    '''TODO: add docs'''
    '''Main all-encompassing view class for example'''

    def create_children(self):
        self.layout = StyleableBox()
        self.controls_view = ControlsView(self.model, self.controller)
        self.plot_view = PlotView(self.model, self.controller)
        self.filter_view = FilterView(self.model, self.controller)

        # user defined model
        self.main_container = StyleableBox()
        self.main_container.children = [self.controls_view.layout, self.plot_view.layout]
        self.main_container.css_properties = {}
        self.main_container.css_properties['position'] = 'absolute'
        self.main_container.css_properties['top'] = '1em'
        self.main_container.css_properties['right'] = '1em'
        self.main_container.css_properties['left'] = '12.5em'
        self.main_container.css_properties['bottom'] = '1em'

        self.side_container = StyleableBox(self.filter_view.layout)
        self.side_container.css_properties = {}
        self.side_container.css_properties['position'] = 'absolute'
        self.side_container.css_properties['overflow'] = 'scroll'
        self.side_container.css_properties['top'] = '1em'
        self.side_container.css_properties['left'] = '1em'
        self.side_container.css_properties['bottom'] = '1em'

        # register view for update with contoller
        self.controller.register_view_for_update(self.plot_view)
        self.controller.register_view_for_update(self.filter_view)
        self.controller.register_view_for_update(self)

        self.update()

    def update(self):
        '''TODO: add docs'''
        self.layout = HBox(children=[self.side_container, self.main_container])

class FilterView(BaseView):

    def create_children(self):
        '''TODO: add docs'''
        self.layout = StyleableBox()
        self.radio_button_group = RadioButtonGroup(labels=self.model.filter_states, active=self.model.active_filter_state)
        self.controller.bind_to_model(self.radio_button_group, 'active', 'active_filter_state')
        self.update()

    def update(self):
        self.layout.children = [StatsBox(display_items=c) for c in self.model.continuous_columns]


class PlotView(BaseView):
    '''TODO: add docs'''

    def scatter_args(self):
        '''TODO: add docs'''
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
        '''TODO: add docs'''
        d = {}
        d['tools'] = 'pan,wheel_zoom'
        d['data'] = self.model.data
        d['label'] = self.model.x_field
        d['values'] = self.model.y_field
        d['xlabel'] = self.model.x_field
        d['ylabel'] = self.model.y_field
        d['agg'] = self.model.agg_type
        d['color'] = self.model.color_field
        return d

    def create_children(self):
        '''TODO: add docs'''
        self.layout = StyleableBox()

        self.layout.css_properties = {}
        self.layout.css_properties['position'] = 'absolute'
        self.layout.css_properties['top'] = '6em'
        self.layout.css_properties['bottom'] = '0'
        self.layout.css_properties['right'] = '0'
        self.layout.css_properties['left'] = '0'
        self.layout.css_properties['background'] = "#2F2F2F"

        self.update()

    def update(self):
        '''TODO: add docs'''
        if self.model.plot_type == 'scatter':
            self.scatter = Scatter(**self.scatter_args())
            self.layout.children = [self.scatter]
        elif self.model.plot_type == 'bar':
            self.bar = Bar(**self.bar_args)
            self.layout.children = [self.bar]

class ControlsView(BaseView):

    def create_children(self):
        '''TODO: add docs'''
        self.layout = StyleableBox(orientation='horizontal')

        self.layout.css_properties = {}
        self.layout.css_properties['position'] = 'relative'
        self.layout.css_properties['top'] = '0'
        self.layout.css_properties['left'] = '0'
        self.layout.css_properties['right'] = '0'
        self.layout.css_properties['height'] = '4em'
        self.layout.css_properties['background'] = "#31AADE"
        self.layout.css_properties['padding'] = ".5em"

        cols = self.model.col_names
        self.plot_selector = self.add_select('plot_type', self.model.plot_type_options, 'plot_type')
        self.x_selector = self.add_select('x', cols, 'x_field')
        self.y_selector = self.add_select('y', cols, 'y_field')
        self.color_selector = self.add_select('color', cols, 'color_field')
        self.agg_selector = self.add_select('agg', self.model.agg_options, 'agg_type')

model = AppModel(autompg)
controller = AppController(model)
view = AppView(model, controller)
doc = curdoc().add_root(view.layout)
