import math
from functools import partial
from collections import OrderedDict

import numpy as np
import pandas as pd


from bokeh.sampledata.autompg import autompg
from bokeh.models import ColumnDataSource

from bokeh.models.widgets import HBox, Select
from bokeh.plotting import Figure
from bokeh.io import curdoc

import bokeh.palettes as palettes

from examples.app.crossfilter.models import StyleableBox
from examples.app.crossfilter.models import StatsBox
from examples.app.crossfilter.models.helpers import load_component

from bokeh.sampledata.iris import flowers


class AppModel(object):
    '''todo: add docs'''

    def __init__(self, df):
        self.doc = None
        self.df = df
        self.data = ColumnDataSource(df)
        self.columns = []
        self.col_names = self.df.columns
        self.filtered_data = None
        self.plot_type_options = ['scatter', 'histogram']
        self.x_field = self.col_names[0]
        self.y_field = self.col_names[1]
        self.color_field = None
        self.size_field = None
        self.palette_name = 'Spectral5'
        self.palettes = [v for v in vars(palettes) if '_' not in v and 'brewer' not in v]
        self.plot_type = self.plot_type_options[0]

        self.agg_options = OrderedDict()
        self.agg_options['Sum'] = np.sum
        self.agg_options['Mean'] = np.mean
        self.agg_options['Count'] = len
        self.agg_type = list(self.agg_options.keys())[0]

        self.set_metadata()
        self.set_defaults()
        self.filter_states = ['Summary Stats', 'Filters', 'Facets']
        self.active_filter_state = 0
        self.tools = 'pan, wheel_zoom'
        self.plot_width = 800
        self.plot_height = 600
        self.background_fill = '#2F2F2F'
        self.default_scatter_color = "#31AADE"
        self.default_scatter_size = 9
        self.scatter_sizes = list(range(6, 22, 3))
        self.stats_box_style = load_component('stats_box.css')

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
        for col in columns:
            desc = self.df[col].describe()
            unique = len(self.df[col].unique())
            if self.df[col].dtype == object:
                descriptors.append({
                    'type': "DiscreteColumn",
                    'name': col,
                    'count': desc['count'],
                    'unique': unique,
                    'top': desc['top'],
                    'freq': desc['freq'],
                })
            elif self.df[col].dtype == np.datetime64:
                descriptors.append({
                    'type': "TimeColumn",
                    'name': col,
                    'unique': unique,
                    'count': desc['count'],
                    'unique': desc['unique'],
                    'first': desc['first'],
                    'last': desc['last'],
                })
            else:
                descriptors.append({
                    'type': "ContinuousColumn",
                    'name': col,
                    'count': desc['count'],
                    'unique': unique,
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

    @property
    def aggregate_function(self):
        return self.agg_options.get(self.agg_type)

    @property
    def quantileable_column_names(self):
        return [x.get('name') for x in self.columns if x['type'] != 'DiscreteColumn' and x['unique'] > 20]

    @property
    def axes_are_continuous(self):
        return self.x_field in self.continuous_column_names and self.y_field in self.continuous_column_names

    @property
    def axes_dict(self):
        '''helper to retrieve axes values from AppModel as single dictionary'''

        # x/y
        xs = self.df[self.x_field].tolist()
        ys = self.df[self.y_field].tolist()

        # color
        if self.color_field:
            scatter_colors = list(reversed(getattr(palettes, self.palette_name)))
            bins = len(scatter_colors)
            groups = pd.qcut(self.df[self.color_field].tolist(), bins)
            color = [scatter_colors[l] for l in groups.codes]
        else:
            color = self.default_scatter_color

        # size
        if self.size_field:
            bins = len(self.scatter_sizes)
            groups = pd.qcut(self.df[self.size_field].tolist(), bins)
            size = [self.scatter_sizes[l] for l in groups.codes]
        else:
            size = self.default_scatter_size

        return dict(x=xs, y=ys, color=color, size=size)

class AppController(object):
    '''mediate views -> model updates'''

    def __init__(self, data_model):
        self.model = data_model
        self.views = []

    def register_view_for_update(self, view):
        '''any view instance registered for update will have its
        .update() method called on any on_change event
        '''
        self.views.append(view)

    def on_change(self, attr, old, new, model_field):
        '''on_change handler which can used with functools.partial
        to setup simple binding between selector values and AppModel properties

        Ex:

          widget.on_change('value', partial(self.controller.on_change, 'my_model_field_to_bind'))
        '''

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
    '''abstract base for simple view class'''

    def __init__(self, app_model, app_controller, layout_class=None):
        self.model = app_model
        self.controller = app_controller
        self.layout = layout_class() if layout_class else None
        self.create_children()

    def create_children(self):
        raise NotImplementedError

    def update(self):
        raise NotImplementedError

class AppView(BaseView):
    '''Main all-encompassing view class which in-turn instantiates sub-views (e.g. controls, summary stats)'''

    def create_children(self):
        '''implementing simple view interface'''
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
        self.controller.register_view_for_update(self.controls_view)
        self.controller.register_view_for_update(self)

        self.update()

    def update(self):
        '''TODO: add docs'''
        self.layout = HBox(children=[self.side_container, self.main_container])

class FilterView(BaseView):

    def create_children(self):
        '''implementing simple view interface'''
        self.layout = StyleableBox()
        self.update()

    def update(self):
        '''implementing simple view interface'''
        self.layout.children = [StatsBox(display_items=c, styles=self.model.stats_box_style) for c in self.model.continuous_columns]


class PlotView(BaseView):
    '''View class which constructs main `plot` area.'''

    def create_children(self):
        '''implementing simple view interface'''
        self.layout = HBox(width=900)
        self.update()

    def update(self):
        '''implementing simple view interface'''
        if self.model.plot_type == 'scatter':
            plot = self.create_scatter()
        elif self.model.plot_type == 'histogram':
            plot = self.create_bar()

        self.layout.children = [plot]

    def style_figure(self):
        '''set generic styles on self.figure'''
        self.figure.toolbar_location = None
        self.figure.xaxis.axis_label = self.model.x_field
        self.figure.yaxis.axis_label = self.model.y_field
        self.figure.background_fill_color = self.model.background_fill
        self.figure.border_fill_color = self.model.background_fill
        self.figure.axis.axis_line_color = "white"
        self.figure.axis.axis_label_text_color = "white"
        self.figure.axis.major_label_text_color = "white"
        self.figure.axis.major_tick_line_color = "white"
        self.figure.axis.minor_tick_line_color = "white"
        self.figure.axis.minor_tick_line_color = "white"
        self.figure.grid.grid_line_dash = [6, 4]
        self.figure.grid.grid_line_alpha = .3

    def create_scatter(self):
        '''handles figure creation and axes configuration for discrete vs. continuous dimensions'''
        axes = self.model.axes_dict
        xs, ys, sizes, colors = axes['x'], axes['y'], axes['size'], axes['color']

        if self.model.x_field in self.model.discrete_column_names and self.model.y_field in self.model.discrete_column_names:
            self.figure = Figure(tools=self.model.tools,
                                 plot_width=self.model.plot_width,
                                 plot_height=self.model.plot_height,
                                 x_range=xs,
                                 y_range=ys)
            self.figure.axis.major_label_orientation = math.pi / 4

        elif self.model.x_field in self.model.discrete_column_names:
            self.figure = Figure(tools=self.model.tools,
                                 plot_width=self.model.plot_width,
                                 plot_height=self.model.plot_height,
                                 x_range=xs)
            self.figure.xaxis.major_label_orientation = math.pi / 4

        elif self.model.y_field in self.model.discrete_column_names:
            self.figure = Figure(tools=self.model.tools,
                                 plot_width=self.model.plot_width,
                                 plot_height=self.model.plot_height,
                                 y_range=ys)
            self.figure.yaxis.major_label_orientation = math.pi / 4
        else:
            self.figure = Figure(tools=self.model.tools, plot_width=self.model.plot_width, plot_height=self.model.plot_height)

        self.scatter = self.figure.circle(xs, ys, color=colors, size=sizes, line_color="white", alpha=0.8)
        self.style_figure()
        self.layout.children = [self.figure]
        return self.figure

    def create_bar(self):
        '''main logic for creating bar figure'''
        if self.model.x_field in self.model.discrete_column_names:
            self.model.x_field = self.model.continuous_column_names[0]

        if self.model.y_field in self.model.discrete_column_names:
            self.model.y_field = self.model.continuous_column_names[1]

        grouped = self.model.df.groupby(self.model.x_field)
        aggregate = grouped.aggregate(self.model.aggregate_function)
        xs = aggregate.index

        # temporary fix for bar chart when x and y fields are the same
        if self.model.x_field == self.model.y_field:
            ys = aggregate.index
        else:
            ys = aggregate[self.model.y_field]

        bar_size = math.ceil((xs.max() - xs.min()) / len(xs))
        self.figure = Figure(tools=self.model.tools, plot_width=self.model.plot_width, plot_height=self.model.plot_height)
        self.figure.quad(left=xs, right=xs+bar_size, bottom=0, top=ys, line_color="white", alpha=0.8)
        self.style_figure()
        self.figure.yaxis.axis_label = '{}({})'.format(self.model.agg_type, self.model.y_field)
        self.layout.children = [self.figure]
        return self.figure


class ControlsView(BaseView):

    def create_children(self):
        '''implementing simple view interface'''
        self.layout = HBox(width=800)
        self.update()

    def update(self):
        '''implementing simple view interface'''
        if self.model.plot_type == 'scatter':
            self.create_scatter_controls()
        elif self.model.plot_type == 'histogram':
            self.create_bar_controls()

    def create_scatter_controls(self):
        '''instantiates control specific for scatter plot type'''
        cols = self.model.col_names
        children = []

        plot_type_selector = Select.create(name='Plot Type', value=self.model.plot_type, options=self.model.plot_type_options)
        plot_type_selector.on_change('value', partial(self.controller.on_change, model_field='plot_type'))
        children.append(plot_type_selector)

        x_axis_selector = Select.create(name='X-Axis', value=self.model.x_field, options=cols)
        x_axis_selector.on_change('value', partial(self.controller.on_change, model_field='x_field'))
        children.append(x_axis_selector)

        y_axis_selector = Select.create(name='Y-Axis', value=self.model.y_field, options=cols)
        y_axis_selector.on_change('value', partial(self.controller.on_change, model_field='y_field'))
        children.append(y_axis_selector)

        color_selector = Select.create(name='Color', value=self.model.color_field, options=['None'] + self.model.quantileable_column_names)
        color_selector.on_change('value', partial(self.controller.on_change, model_field='color_field'))
        children.append(color_selector)

        if self.model.color_field:
            palette_selector = Select.create(name='Palette', value=self.model.palette_name, options=sorted(self.model.palettes))
            palette_selector.on_change('value', partial(self.controller.on_change, model_field='palette_name'))
            children.append(palette_selector)

        size_selector = Select.create(name='Size', value=self.model.color_field, options=['None'] + self.model.quantileable_column_names)
        size_selector.on_change('value', partial(self.controller.on_change, model_field='size_field'))
        children.append(size_selector)

        self.layout.children = children

    def create_bar_controls(self):
        '''instantiates control specific for scatter bar type'''
        continuous = self.model.continuous_column_names
        children = []

        plot_type_selector = Select.create(name='Plot Type', value=self.model.plot_type, options=self.model.plot_type_options)
        plot_type_selector.on_change('value', partial(self.controller.on_change, model_field='plot_type'))
        children.append(plot_type_selector)

        x_axis_selector = Select.create(name='X-Axis', value=self.model.x_field, options=continuous)
        x_axis_selector.on_change('value', partial(self.controller.on_change, model_field='x_field'))
        children.append(x_axis_selector)

        y_axis_selector = Select.create(name='Y-Axis', value=self.model.y_field, options=continuous)
        y_axis_selector.on_change('value', partial(self.controller.on_change, model_field='y_field'))
        children.append(y_axis_selector)

        aggregation_selector = Select.create(name='Aggregation', value=self.model.agg_type, options=self.model.agg_options.keys())
        aggregation_selector.on_change('value', partial(self.controller.on_change, model_field='agg_type'))
        children.append(aggregation_selector)

        self.layout.children = children

# entry point - 
model = AppModel(flowers)
controller = AppController(model)
view = AppView(model, controller)
doc = curdoc().add_root(view.layout)
