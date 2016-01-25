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
from bokeh.models import ColumnDataSource
from bokeh.sampledata.autompg import autompg
from bokeh.sampledata.iris import flowers
from bokeh.io import curdoc
from bokeh.document import Document

from bokeh.charts import Histogram, Scatter
import bokeh.palettes as palettes

from examples.app.crossfilter.models import StyleableBox
from examples.app.crossfilter.models import StatsBox

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
        self.color_field = None
        self.size_field = None
        self.palette_name = 'Spectral5'
        self.palettes = [v for v in vars(palettes) if '_' not in v and 'brewer' not in v]
        self.plot_type = self.plot_type_options[0]
        self.agg_type = self.agg_options[0]
        self.set_metadata()
        self.set_defaults()
        self.filter_states = ['Summary Stats', 'Filters', 'Facets']
        self.active_filter_state = 0
        self.tools = 'pan, wheel_zoom'
        self.plot_width = 800
        self.plot_height = 600

        self.default_scatter_color = "#900000"

        self.default_scatter_size = 9
        self.scatter_sizes = list(range(6, 22, 3))

    def set_defaults(self):
        '''todo: add docs'''
        self.x_field = self.continuous_columns[0]['name']
        self.y_field = self.continuous_columns[1]['name']

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

    @property
    def continuous_columns(self):
        return [x for x in self.columns if x['type'] != 'DiscreteColumn']

    @property
    def continuous_column_names(self):
        return [x.get('name') for x in self.columns if x['type'] != 'DiscreteColumn']

    @property
    def discrete_columns(self):
        return [x for x in self.columns if x['type'] == 'DiscreteColumn']

    @property
    def discrete_column_names(self):
        return [x.get('name') for x in self.columns if x['type'] == 'DiscreteColumn']

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
        if new == 'None':
            setattr(self.model, model_field, None)
        else:
            setattr(self.model, model_field, new)
        self.update_app()

    def update_app(self):
        '''TODO: add docs'''
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
        self.controller.register_view_for_update(self.controls_view)
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

    def create_scatter(self):
        self.figure = Figure(tools=self.model.tools, plot_width=self.model.plot_width, plot_height=self.model.plot_height)
        self.figure.xaxis.axis_label = self.model.x_field
        self.figure.yaxis.axis_label = self.model.y_field

        if self.model.color_field:
            scatter_colors = list(reversed(getattr(palettes, self.model.palette_name)))
            bins = len(scatter_colors)
            groups = pd.qcut(self.model.df[self.model.color_field].tolist(), bins)
            colors = [scatter_colors[l] for l in groups.labels]
        else:
            colors = self.model.default_scatter_color

        if self.model.size_field:
            bins = len(self.model.scatter_sizes)
            groups = pd.qcut(self.model.df[self.model.size_field].tolist(), bins)
            sizes = [self.model.scatter_sizes[l] for l in groups.labels]
        else:
            sizes = self.model.default_scatter_size

        self.scatter = self.figure.scatter(source=ColumnDataSource(self.model.df),
                                            x=self.model.x_field, 
                                            y=self.model.y_field,
                                            color=colors,
                                            size=sizes,
                                            alpha=0.8)
 
        self.layout.children = [self.figure]
        return self.figure

    def create_bar(self):
        self.figure = Figure(tools=self.model.tools, plot_width=self.plot_width, height=self.plot_height)
        self.bar = self.figure.quad(source=self.model.df, bottom=0, top=self.model.y_field, left='left', right='right', color=colors[0], alpha=0.5, line_color="black", legend="Actual")

    def create_children(self):
        '''TODO: add docs'''
        self.layout = HBox(width=900)
        self.update()

    def update(self):
        '''TODO: add docs'''
        if self.model.plot_type == 'scatter':
            plot = self.create_scatter()
        elif self.model.plot_type == 'bar':
            plot = self.create_bar()

        self.layout.children = [plot]

class ControlsView(BaseView):

    def create_children(self):
        '''TODO: add docs'''
        self.layout = HBox(width=800)
        self.update()

    def update(self):
        if self.model.plot_type == 'scatter':
            self.create_scatter_controls()
        elif self.model.plot_type == 'bar':
            self.create_bar_controls()

    def create_scatter_controls(self):
        cols = self.model.col_names
        continuous = self.model.continuous_column_names
        children = []
        children.append(self.add_select('Plot Type', self.model.plot_type_options, 'plot_type'))
        children.append(self.add_select('X-Axis', cols, 'x_field'))
        children.append(self.add_select('Y-Axis', cols, 'y_field'))
        children.append(self.add_select('Color', ['None'] + continuous, 'color_field'))

        if self.model.color_field:
            children.append(self.add_select('Palette', sorted(self.model.palettes), 'palette_name'))

        children.append(self.add_select('Size', ['None'] + continuous, 'size_field'))
        self.layout.children = children

    def create_bar_controls(self):
        cols = self.model.col_names
        continuous = self.model.continuous_column_names
        children = []
        self.plot_selector = self.add_select('plot_type', self.model.plot_type_options, 'plot_type')
        self.x_selector = self.add_select('x', cols, 'x_field')
        self.y_selector = self.add_select('y', cols, 'y_field')
        self.agg_selector = self.add_select('agg', self.model.agg_options, 'agg_type')

model = AppModel(autompg)
controller = AppController(model)
view = AppView(model, controller)
doc = curdoc().add_root(view.layout)
