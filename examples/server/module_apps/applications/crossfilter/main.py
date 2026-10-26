"""Explore linked selections across views of the same dataset."""

from pathlib import Path

import numpy as np
import pandas as pd
from jinja2 import Environment, FileSystemLoader

from bokeh.layouts import column, row
from bokeh.models import Select
from bokeh.palettes import Spectral5
from bokeh.plotting import figure
from bokeh.sampledata.autompg import autompg_clean as autompg_data
from bokeh.server.asgi import BokehASGI
from bokeh.themes import Theme


def modify_document(doc):
    df = autompg_data.copy()
    doc.theme = Theme(filename=Path(__file__).with_name("theme.yaml"))
    doc.template = Environment(loader=FileSystemLoader(Path(__file__).parent / "templates")).get_template("index.html")
    df = df.copy()

    SIZES = list(range(6, 22, 3))

    COLORS = Spectral5

    N_SIZES = len(SIZES)

    N_COLORS = len(COLORS)

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

    doc.add_root(layout)

    doc.title = "Crossfilter"


app = BokehASGI(modify_document)
