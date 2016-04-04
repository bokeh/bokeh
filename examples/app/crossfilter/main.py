import math
import numpy as np
import pandas as pd

from functools import partial

from bokeh import palettes
from bokeh.io import curdoc
from bokeh.models import HBox, Select
from bokeh.plotting import Figure
from bokeh.sampledata.autompg import autompg

from models import StyleableBox, StatsBox
from models.helpers import load_component

class AppModel(object):

    def __init__(self, df):
        self.df = df
        self.columns = []
        self.color_field = None
        self.size_field = None
        self.palette_name = 'Spectral5'
        self.palettes = [v for v in vars(palettes) if '_' not in v and 'brewer' not in v]
        self.background_fill = '#2F2F2F'
        self.default_color = "#31AADE"
        self.default_size = 9
        self.scatter_sizes = list(range(6, 22, 3))
        self.stats_box_style = load_component('stats_box.css')
        self.columns = self.describe_df()
        self.x_field = self.continuous_columns[0]['name']
        self.y_field = self.continuous_columns[1]['name']

    def describe_df(self):
        descriptors = []
        for col in self.df.columns:
            desc = self.df[col].describe()
            unique = len(self.df[col].unique())
            if self.df[col].dtype == object:
                descriptors.append({
                    'type': "DiscreteColumn", 'name': col,
                    'count': desc['count'], 'unique': unique,
                    'top': desc['top'], 'freq': desc['freq'],
                })
            elif self.df[col].dtype == np.datetime64:
                descriptors.append({
                    'type': "TimeColumn", 'name': col,
                    'unique': unique, 'count': desc['count'],
                    'unique': desc['unique'], 'first': desc['first'],
                    'last': desc['last'],
                })
            else:
                descriptors.append({
                    'type': "ContinuousColumn", 'name': col,
                    'count': desc['count'], 'unique': unique,
                    'mean': "%.2f" % desc['mean'], 'std': "%.2f" % desc['std'],
                    'min': "%.2f" % desc['min'], 'max': "%.2f" % desc['max'],
                })
        return descriptors

    @property
    def continuous_columns(self):
        return [x for x in self.columns if x['type'] != 'DiscreteColumn']

    @property
    def continuous_column_names(self):
        return [x.get('name') for x in self.columns if x['type'] != 'DiscreteColumn']

    @property
    def discrete_column_names(self):
        return [x.get('name') for x in self.columns if x['type'] == 'DiscreteColumn']

    @property
    def quantileable_column_names(self):
        return [x.get('name') for x in self.columns if x['type'] != 'DiscreteColumn' and x['unique'] > 20]

    def get_axes_values(self):
        xs = self.df[self.x_field].tolist()
        ys = self.df[self.y_field].tolist()

        if self.color_field:
            scatter_colors = list(reversed(getattr(palettes, self.palette_name)))
            bins = len(scatter_colors)
            groups = pd.qcut(self.df[self.color_field].tolist(), bins)
            color = [scatter_colors[l] for l in groups.codes]
        else:
            color = self.default_color

        if self.size_field:
            bins = len(self.scatter_sizes)
            groups = pd.qcut(self.df[self.size_field].tolist(), bins)
            size = [self.scatter_sizes[l] for l in groups.codes]
        else:
            size = self.default_size

        return xs, ys, color, size

def bind_on_change(attr, old, new, model_field):
    global plot_view
    setattr(model, model_field, None) if new == 'None' else setattr(model, model_field, new)
    plot_view.children = [create_figure()]

def create_figure():
    xs, ys, colors, sizes = model.get_axes_values()
    fig_args = dict(tools='pan', plot_height=600, plot_width=800)

    if model.x_field in model.discrete_column_names and model.y_field in model.discrete_column_names:
        figure = Figure(x_range=xs, y_range=ys, **fig_args)
        figure.axis.major_label_orientation = math.pi / 4
    elif model.x_field in model.discrete_column_names:
        figure = Figure(x_range=xs, **fig_args)
        figure.xaxis.major_label_orientation = math.pi / 4
    elif model.y_field in model.discrete_column_names:
        figure = Figure(y_range=ys, **fig_args)
        figure.yaxis.major_label_orientation = math.pi / 4
    else:
        figure = Figure(**fig_args)

    figure.circle(x=xs, y=ys, color=colors, size=sizes, line_color="white", alpha=0.8)
    figure.toolbar_location = None
    figure.xaxis.axis_label = model.x_field
    figure.yaxis.axis_label = model.y_field
    figure.background_fill_color = model.background_fill
    figure.border_fill_color = model.background_fill
    figure.axis.axis_line_color = "white"
    figure.axis.axis_label_text_color = "white"
    figure.axis.major_label_text_color = "white"
    figure.axis.major_tick_line_color = "white"
    figure.axis.minor_tick_line_color = "white"
    figure.axis.minor_tick_line_color = "white"
    figure.grid.grid_line_dash = [6, 4]
    figure.grid.grid_line_alpha = .3
    return figure

model = AppModel(autompg)

controls_view = HBox(width=800)

x_select = Select.create(name='X-Axis', value=model.x_field, options=model.df.columns)
x_select.on_change('value', partial(bind_on_change, model_field='x_field'))

y_select = Select.create(name='Y-Axis', value=model.y_field, options=model.df.columns)
y_select.on_change('value', partial(bind_on_change, model_field='y_field'))

color_select = Select.create(name='Color', value=model.color_field, options=['None'] + model.quantileable_column_names)
color_select.on_change('value', partial(bind_on_change, model_field='color_field'))

palette_select = Select.create(name='Palette', options=sorted(model.palettes))
palette_select.on_change('value', partial(bind_on_change, model_field='palette_name'))

size_select = Select.create(name='Size', value=model.size_field, options=['None'] + model.quantileable_column_names)
size_select.on_change('value', partial(bind_on_change, model_field='size_field'))

controls_view.children = [x_select, y_select, color_select, palette_select, size_select]

plot_view = HBox(width=900)
plot_view.children = [create_figure()]

side_container = StyleableBox()
side_container.children = [StatsBox(display_items=c, styles=model.stats_box_style) for c in model.continuous_columns]
side_container.css_properties = dict(
 position='absolute', overflow='scroll', top='1em', left='1em', bottom='1em'
)

main_container = StyleableBox()
main_container.children = [controls_view, plot_view]
main_container.css_properties = dict(
 position='absolute', top='1em', right='1em', left='12.5em', bottom='1em'
)

doc = curdoc().add_root(HBox(children=[side_container, main_container]))
