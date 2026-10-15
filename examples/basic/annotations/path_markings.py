''' Fractional arrowhead positions and animated streamlines.

.. bokeh-example-metadata::
    :apis: bokeh.models.GlyphRenderer.add_path_markings, bokeh.models.NormalHead, bokeh.models.CustomJS
    :refs: :ref:`ug_basic_annotations_path_markings`
    :keywords: arrows, fractional positions, paths, streamlines, animation

'''
from math import sin, tau

from bokeh.events import DocumentReady
from bokeh.io import curdoc
from bokeh.layouts import column, gridplot
from bokeh.models import ColumnDataSource, CustomJS, Div, NormalHead
from bokeh.plotting import figure, show

positions = [
    (0, "#cc79a7"), (0.25, "#56b4e9"), (0.5, "#ffb454"),
    (0.75, "#4dd9b4"), (1, "#f0e442"),
]
plots = []
for kind in ["Segment", "Line", "MultiLine", "Bezier", "Per-path positions", "Animated streamlines"]:
    p = figure(width=480, height=300, x_range=(-0.6, 6.6), y_range=(-1.6, 2.6),
               title=kind, tools="", toolbar_location=None,
               background_fill_color="#202a36", border_fill_color="#f6f7f9")
    p.axis.visible = False
    p.grid.grid_line_color = "#536779"
    p.grid.grid_line_alpha = 0.3
    p.outline_line_color = None
    style = dict(line_color="#c0ceda", line_width=3)
    t = [i/100 for i in range(101)]

    if kind in ("Per-path positions", "Animated streamlines"):
        source = ColumnDataSource(dict(
            xs=[[6*u for u in t] for _ in range(4)],
            ys=[[-1 + j*0.8 + 0.25*sin(tau*u + j*0.6) for u in t] for j in range(4)],
            arrow_positions=[[0, 0.25, 0.5, 0.75, 1], [0.15, 0.55, 0.85], [], [0.2, 0.8]],
            color=["#56b4e9", "#ffb454", "#cc79a7", "#4dd9b4"],
        ))
        renderer = p.multi_line("xs", "ys", source=source, **style)
        renderer.add_path_markings(
            NormalHead(size=14, fill_color="color", line_color="color"),
            positions="arrow_positions",
        )
        if kind == "Animated streamlines":
            animated_source = source
        plots.append(p)
        continue

    if kind == "Segment":
        renderer = p.segment(x0=0, y0=-0.5, x1=6, y1=1.5, **style)
    elif kind == "Line":
        renderer = p.line([6*u for u in t], [0.5 + sin(tau*u) for u in t], **style)
    elif kind == "MultiLine":
        renderer = p.multi_line(
            xs=[[6*u for u in t], [6*u for u in t]],
            ys=[[0.8 + 4*u*(1-u) for u in t], [-0.7 - 2*u*(1-u) + 0.4*u for u in t]],
            **style,
        )
    else:
        renderer = p.bezier(x0=0, y0=0, x1=6, y1=1, cx0=1, cy0=4, cx1=3, cy1=-3, **style)

    for fraction, color in positions:
        renderer.add_path_markings(
            NormalHead(size=17, fill_color=color, line_color=color),
            positions=[fraction],
        )
    plots.append(p)

legend = Div(
    text='Pink: <b>0</b> · Blue: <b>0.25</b> · Orange: <b>0.5</b> · '
         'Green: <b>0.75</b> · Yellow: <b>1</b>.<br>'
         'Positions measure screen-space path length. The bottom row uses a column of position lists, '
         'including an empty list for a path with no arrows. The bottom-right panel animates those positions.',
    width=950,
    styles={"color": "#243244", "background-color": "#f6f7f9", "font-size": "15px"},
)
layout = column(legend, gridplot([
    [plots[0], plots[1]],
    [plots[2], plots[3]],
    [plots[4], plots[5]],
], toolbar_location=None))

curdoc().config.color_scheme = "light"
curdoc().js_on_event(DocumentReady, CustomJS(args=dict(source=animated_source), code="""
    const bases = [[0, 0.25, 0.5, 0.75], [0.15, 0.55, 0.85], [], [0.2, 0.8]]
    let start = null
    let last = 0
    function frame(now) {
        if (source.document == null) {
            return
        }
        // Use the animation clock for both timestamps, including the first frame.
        start ??= now
        if (now - last >= 50) {
            last = now
            const offset = (now - start)/10000
            source.data = {...source.data,
                arrow_positions: bases.map((positions, i) =>
                    positions.map(p => ((p + offset*(1 + i*0.15))%1 + 1)%1))}
        }
        requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
"""))

show(layout)
