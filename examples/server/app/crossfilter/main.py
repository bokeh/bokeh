''' A crossfilter plot map that uses the `Auto MPG dataset`_. This example
demonstrates the relationship of datasets together. A hover tooltip displays
information on each dot.

.. note::
    This example needs the Pandas package to run.

.. _Auto MPG dataset: https://archive.ics.uci.edu/ml/datasets/auto+mpg

'''
import numpy as np
import pandas as pd

from bokeh.layouts import column, row
from bokeh.models import Select
from bokeh.palettes import Spectral5
from bokeh.plotting import curdoc, figure
from bokeh.sampledata.autompg import autompg_clean as df

df = df.copy()

SIZES = list(range(6, 22, 3))
COLORS = Spectral5
N_SIZES = len(SIZES)
N_COLORS = len(COLORS)

# data cleanup
df.cyl = df.cyl.astype(str)
df.yr = df.yr.astype(str)
del df['name']

columns = sorted(df.columns)
discrete = [x for x in columns if df[x].dtype == object]
continuous = [x for x in columns if x not in discrete]


def create_figure():
    xs = df[x.value].values
    ys = df[y.value].values
    x_title = x.value.title()
    y_title = y.value.title()

    kw = dict()
    if x.value in discrete:
        kw['x_range'] = sorted(set(xs))
    if y.value in discrete:
        kw['y_range'] = sorted(set(ys))
    kw['title'] = f"{x_title} vs {y_title}"

    p = figure(height=600, width=800, tools='pan,box_zoom,hover,reset', **kw)
    p.xaxis.axis_label = x_title
    p.yaxis.axis_label = y_title

    if x.value in discrete:
        p.xaxis.major_label_orientation = np.pi / 4

    sz = 9
    if size.value != 'None':
        if len(set(df[size.value])) > N_SIZES:
            groups = pd.qcut(df[size.value].values, N_SIZES, duplicates='drop')
        else:
            groups = pd.Categorical(df[size.value])
        sz = [SIZES[xx] for xx in groups.codes]

    c = "#31AADE"
    if color.value != 'None':
        if len(set(df[color.value])) > N_COLORS:
            groups = pd.qcut(df[color.value].values, N_COLORS, duplicates='drop')
        else:
            groups = pd.Categorical(df[color.value])
        c = [COLORS[xx] for xx in groups.codes]

    p.scatter(x=xs, y=ys, color=c, size=sz, line_color="white", alpha=0.6, hover_color='white', hover_alpha=0.5)

    return p


def update(attr, old, new):
    layout.children[1] = create_figure()


x = Select(title='X-Axis', value='mpg', options=columns)
x.on_change('value', update)

y = Select(title='Y-Axis', value='hp', options=columns)
y.on_change('value', update)

size = Select(title='Size', value='None', options=['None', *continuous])
size.on_change('value', update)

color = Select(title='Color', value='None', options=['None', *continuous])
color.on_change('value', update)

controls = column(x, y, color, size, width=200)
layout = row(controls, create_figure())

curdoc().add_root(layout)
curdoc().title = "Crossfilter"
