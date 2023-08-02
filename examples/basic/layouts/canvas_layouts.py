import numpy as np

from bokeh.plotting import show
from bokeh.models import (
    BoxAnnotation,
    Canvas,
    CanvasBox,
    CartesianFrame,
    Circle,
    #ColorBar,
    ColumnDataSource,
    GlyphRenderer,
    Grid,
    GridRenderer,
    #Legend,
    LinearAxis,
    PlotRenderer,
    Title,
    Toolbar,
    ToolbarPanel,
)
from bokeh.models import tools
from bokeh.core.properties import field

def plot(b: int):
    N = 2000
    x = np.random.random(size=N) * 100
    y = np.random.random(size=N) * 100
    radii = np.random.random(size=N) * 1.5
    colors = np.array([(r, g, b) for r, g in zip(50 + 2*x, 30 + 2*y)], dtype="uint8")

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

    cf = CartesianFrame(renderers=[gx, gy, gr])
    #return cf

    tl = Title(text=f"b = {b}")

    tb = Toolbar(tools=[
        tools.BoxSelectTool(persistent=True),
        tools.BoxZoomTool(),
        tools.CopyTool(),
        tools.CrosshairTool(),
        tools.FreehandDrawTool(),
        tools.FullscreenTool(),
        tools.HoverTool(),
        tools.LassoSelectTool(persistent=True),
        tools.PanTool(),
        tools.PointDrawTool(),
        tools.PolyDrawTool(),
        tools.PolySelectTool(persistent=True),
        tools.RedoTool(),
        tools.ResetTool(),
        tools.SaveTool(),
        tools.ExamineTool(),
        tools.TapTool(),
        tools.UndoTool(),
        tools.WheelPanTool(),
        tools.WheelZoomTool(),
        tools.ZoomInTool(),
        tools.ZoomOutTool(),
    ])

    tp = ToolbarPanel(toolbar=tb)

    pr = PlotRenderer(frame=cf, above=[tl], below=[ax], left=[ay], right=[tp])
    return pr

pr00 = plot(100)
pr01 = plot(150)
pr10 = plot(200)
pr11 = plot(250)

box = BoxAnnotation(
    left=100,
    right=500,
    top=100,
    bottom=500,
    left_units="screen",
    right_units="screen",
    top_units="screen",
    bottom_units="screen",
)

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

#canvas = Canvas(renderers=[pr00])
canvas = Canvas(renderers=[gr, box])#, output_backend="webgl")
canvas_box = CanvasBox(width=600, height=600, canvas=canvas)

show(canvas_box)
