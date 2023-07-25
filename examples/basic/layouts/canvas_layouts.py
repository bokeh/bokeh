import numpy as np

from bokeh.plotting import figure, show
from bokeh.models import GridBox, CanvasBox, Canvas, PlotRenderer, GridRenderer, ColorBar, Legend

def plot(b: int):
    N = 2000
    x = np.random.random(size=N) * 100
    y = np.random.random(size=N) * 100
    radii = np.random.random(size=N) * 1.5
    colors = np.array([(r, g, b) for r, g in zip(50 + 2*x, 30 + 2*y)], dtype="uint8")

    from bokeh.models import GlyphRenderer, Circle, ColumnDataSource, LinearAxis, Grid, Toolbar, PanTool, CrosshairTool
    from bokeh.core.properties import field

    data_source = ColumnDataSource(data=dict(
        x=x,
        y=y,
        radii=radii,
        colors=colors,
    ))

    glyph = Circle(
        x=field("x"),
        y=field("y"),
        radius=field("radii"),
        fill_color=field("colors"),
        fill_alpha=0.6,
        line_color=None,
    )

    ax = LinearAxis()
    ay = LinearAxis()
    gx = Grid(axis=ax, dimension=0)
    gy = Grid(axis=ay, dimension=1)

    gr = GlyphRenderer(glyph=glyph, data_source=data_source)
    tb = Toolbar(tools=[PanTool(), CrosshairTool()])

    pr = PlotRenderer(renderers=[gx, gy, gr], below=[ax], left=[ay], toolbar=tb)

    return pr

pr00 = plot(100)
pr01 = plot(150)
pr10 = plot(200)
pr11 = plot(250)

#cb0 = ColorBar()

#lg0 = Legend()

gr = GridRenderer(items=[
    (pr00, 0, 0),
    (pr01, 0, 1),
    (pr10, 1, 0),
    (pr11, 1, 1),
#    (lg0, 2, 0, 1, 2),
#    (cb0, 0, 2, 2, 1),
])

canvas = Canvas(renderers=[gr])
canvas_box = CanvasBox(width=600, height=600, canvas=canvas)

show(canvas_box)
