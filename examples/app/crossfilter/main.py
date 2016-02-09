import math

from functools import partial

import numpy as np
import pandas as pd

from bokeh import palettes
from bokeh.io import curdoc
from bokeh.models import ColumnDataSource, HBox, Select
from bokeh.plotting import Figure
from bokeh.sampledata.autompg import autompg

from examples.app.crossfilter.models import StyleableBox
from examples.app.crossfilter.models import StatsBox
from examples.app.crossfilter.models.helpers import load_component

class AppModel(object):
    '''todo: add docs'''

    def __init__(self, df):
        self.doc = None
        self.df = df
        self.source = ColumnDataSource(df)
        self.columns = []
        self.col_names = self.df.columns
        self.filtered_data = None
        self.x_field = self.col_names[0]
        self.y_field = self.col_names[1]
        self.color_field = None
        self.size_field = None
        self.palette_name = 'Spectral5'
        self.palettes = [v for v in vars(palettes) if '_' not in v and 'brewer' not in v]
        self.set_metadata()
        self.set_defaults()
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

def bind_on_change(attr, old, new, model_field):
    '''on_change handler which can used with functools.partial
    to setup simple binding between selector values and AppModel properties
    Ex: widget.on_change('value', partial(bind_on_change, 'my_model_field_to_bind'))
    '''
    setattr(model, model_field, None) if new == 'None' else setattr(model, model_field, new)
    update()

def update():
    global plot_view
    plot_view.children = [create_scatter()]

def style_figure(fig):
    '''set generic styles on self.figure'''
    fig.toolbar_location = None
    fig.xaxis.axis_label = model.x_field
    fig.yaxis.axis_label = model.y_field
    fig.background_fill_color = model.background_fill
    fig.border_fill_color = model.background_fill
    fig.axis.axis_line_color = "white"
    fig.axis.axis_label_text_color = "white"
    fig.axis.major_label_text_color = "white"
    fig.axis.major_tick_line_color = "white"
    fig.axis.minor_tick_line_color = "white"
    fig.axis.minor_tick_line_color = "white"
    fig.grid.grid_line_dash = [6, 4]
    fig.grid.grid_line_alpha = .3

def create_scatter():
    '''handles figure creation and axes configuration for discrete vs. continuous dimensions'''
    axes = model.axes_dict
    xs, ys, sizes, colors = axes['x'], axes['y'], axes['size'], axes['color']

    if model.x_field in model.discrete_column_names and model.y_field in model.discrete_column_names:
        figure = Figure(tools=model.tools,
                        plot_width=model.plot_width,
                        plot_height=model.plot_height,
                        x_range=xs,
                        y_range=ys)
        figure.axis.major_label_orientation = math.pi / 4

    elif model.x_field in model.discrete_column_names:
        figure = Figure(tools=model.tools,
                        plot_width=model.plot_width,
                        plot_height=model.plot_height,
                        x_range=xs)
        figure.xaxis.major_label_orientation = math.pi / 4

    elif model.y_field in model.discrete_column_names:
        figure = Figure(tools=model.tools,
                        plot_width=model.plot_width,
                        plot_height=model.plot_height,
                        y_range=ys)
        figure.yaxis.major_label_orientation = math.pi / 4
    else:
        figure = Figure(tools=model.tools, plot_width=model.plot_width, plot_height=model.plot_height)

    figure.circle(x=xs, y=ys, color=colors, size=sizes, line_color="white", alpha=0.8)
    style_figure(figure)
    return figure

model = AppModel(autompg)

views = []

# controls -----------------------------------------------
controls_view = HBox(width=800)
controls = []

x_axis_selector = Select.create(name='X-Axis', value=model.x_field, options=model.col_names)
x_axis_selector.on_change('value', partial(bind_on_change, model_field='x_field'))
controls.append(x_axis_selector)

y_axis_selector = Select.create(name='Y-Axis', value=model.y_field, options=model.col_names)
y_axis_selector.on_change('value', partial(bind_on_change, model_field='y_field'))
controls.append(y_axis_selector)

color_selector = Select.create(name='Color', value=model.color_field, options=['None'] + model.quantileable_column_names)
color_selector.on_change('value', partial(bind_on_change, model_field='color_field'))
controls.append(color_selector)

palette_selector = Select.create(name='Palette', options=sorted(model.palettes))
palette_selector.on_change('value', partial(bind_on_change, model_field='palette_name'))
controls.append(palette_selector)

size_selector = Select.create(name='Size', value=model.size_field, options=['None'] + model.quantileable_column_names)
size_selector.on_change('value', partial(bind_on_change, model_field='size_field'))
controls.append(size_selector)

controls_view.children = controls

# plot view -----------------------------------------------
plot_view = HBox(width=900)
plot_view.children = [create_scatter()]

# summary stats -------------------------------------------
side_container = StyleableBox()
side_container.children = [StatsBox(display_items=c, styles=model.stats_box_style) for c in model.continuous_columns]
side_container.css_properties = {}
side_container.css_properties['position'] = 'absolute'
side_container.css_properties['overflow'] = 'scroll'
side_container.css_properties['top'] = '1em'
side_container.css_properties['left'] = '1em'
side_container.css_properties['bottom'] = '1em'

# main container ------------------------------------------
main_container = StyleableBox()
main_container.children = [controls_view, plot_view]
main_container.css_properties = {}
main_container.css_properties['position'] = 'absolute'
main_container.css_properties['top'] = '1em'
main_container.css_properties['right'] = '1em'
main_container.css_properties['left'] = '12.5em'
main_container.css_properties['bottom'] = '1em'

# create layout
layout = HBox(children=[side_container, main_container])

# add layout to current document
doc = curdoc().add_root(layout)
