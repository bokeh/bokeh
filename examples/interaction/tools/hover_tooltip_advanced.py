import numpy as np

from bokeh.models import HoverTool, Styles
from bokeh.models.dom import Div, Index, ValueRef
from bokeh.palettes import Spectral11
from bokeh.plotting import figure, show

N = 1000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.random.choice(Spectral11, size=N)

p = figure(
    title="Demonstrates hover tool with advanced and regular tooltip formatting side-by-side",
    tools="pan,wheel_zoom,box_select,crosshair",
)

p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

grid = Div(
    style=Styles(
        display="grid",
        grid_template_columns="auto auto",
        column_gap="10px",
    ),
    children=[
        "index:",  Div(children=["#", Index()]),
        "(x, y):", Div(children=["(", ValueRef(field="x"), ", ", ValueRef(field="y"), ")"]),
        "radius:", ValueRef(field="radius", format="%.2f", formatter="printf"),
    ],
)

hover_advanced = HoverTool(
    description="Advanced hover",
    tooltips=grid,
    attachment="left",
)
p.add_tools(hover_advanced)

hover_regular = HoverTool(
    description="Regular hover",
    tooltips=[
        ("index", "$index"),
        ("(x,y)", "(@x, @y)"),
        ("radius", "@radius{%.2f}"),
    ],
    formatters={
        "@radius": "printf",
    },
    attachment="right",

)
p.add_tools(hover_regular)

show(p)
