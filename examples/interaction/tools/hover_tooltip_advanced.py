import numpy as np

from bokeh.models import BoxAnnotation, CustomJS, HoverTool, Styles
from bokeh.models.dom import HTML, Index, ValueRef
from bokeh.palettes import Spectral11
from bokeh.plotting import figure, show

N = 1000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.random.choice(Spectral11, size=N)

p = figure(
    title="Demonstrates hover tool with advanced and regular tooltip\nformatting and filtering side-by-side",
    tools="pan,wheel_zoom,box_select,crosshair",
)

p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

x_filter = CustomJS(code="""export default (args, tool, {value: x}) => 20 <= x && x <= 80""")
y_filter = CustomJS(code="""export default (args, tool, {value: y}) => 20 <= y && y <= 80""")

x_ref = ValueRef(style=dict(background_color="cyan"), field="x", filter=x_filter)
y_ref = ValueRef(style=dict(background_color="lime"), field="y", filter=y_filter)

def span(name: str, color: str):
    return f"""<span style="background-color: {color};">{name}</span>"""

html = HTML(
    style=Styles(
        display="grid",
        grid_template_columns="auto auto",
        column_gap="10px",
    ),
    html=[
        """<div>index:</div><div style="font-weight: bold;">#""", Index(), "</div>",
        f"<div>({span('x', 'cyan')}, {span('y', 'lime')}):</div><div>(", x_ref, ", ", y_ref, ")</div>",
        "<div>radius:</div>", ValueRef(field="radius", format="%.2f", formatter="printf"),
    ],
)

hover_advanced = HoverTool(
    description="Advanced hover",
    tooltips=html,
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
    filters={
        "@x": x_filter,
        "@y": y_filter,
    },
)
p.add_tools(hover_regular)

p.add_layout(BoxAnnotation(left=20, right=80, top=20, bottom=80, level="underlay"))

show(p)
