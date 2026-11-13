''' Animate arrowheads along paths by updating their positions in a source column.

.. bokeh-example-metadata::
    :apis: bokeh.models.GlyphRenderer.add_arrowheads, bokeh.models.ColumnDataSource, bokeh.models.NormalHead
    :refs: :ref:`ug_basic_annotations_path_markings`
    :keywords: arrowheads, fractional positions, data source, paths, animation

'''
from math import sin, tau

from bokeh.core.properties import field
from bokeh.events import DocumentReady
from bokeh.io import curdoc
from bokeh.models import ColumnDataSource, CustomJS, NormalHead
from bokeh.plotting import figure, show

t = [i/100 for i in range(101)]
source = ColumnDataSource(dict(
    xs=[[6*u for u in t] for _ in range(4)],
    ys=[[-1 + row*0.8 + 0.25*sin(tau*u + row*0.6) for u in t] for row in range(4)],
    arrow_positions=[[0, 0.25, 0.5, 0.75], [0.15, 0.55, 0.85], [], [0.2, 0.8]],
    color=["#56b4e9", "#ffb454", "#cc79a7", "#4dd9b4"],
))

p = figure(width=480, height=300, x_range=(-0.6, 6.6), y_range=(-1.6, 2.6),
           title="Animated streamlines", tools="", toolbar_location=None,
           background_fill_color="#202a36", border_fill_color="#f6f7f9")
p.axis.visible = False
p.grid.grid_line_color = "#536779"
p.grid.grid_line_alpha = 0.3
p.outline_line_color = None

renderer = p.multi_line("xs", "ys", source=source, line_color="#c0ceda", line_width=3)
renderer.add_arrowheads(
    at=field("arrow_positions"),
    head=NormalHead(size=14, fill_color="color", line_color="color"),
)

curdoc().js_on_event(DocumentReady, CustomJS(args=dict(source=source), code="""
    const initial = source.data.arrow_positions
    let start = null
    let last = -Infinity

    function frame(now) {
        if (source.document == null) {
            return
        }
        start ??= now
        if (now - last >= 50) {
            last = now
            const offset = (now - start)/10000
            source.data = {...source.data,
                arrow_positions: initial.map((positions, i) =>
                    positions.map(fraction => (fraction + offset*(1 + i*0.15)) % 1))}
        }
        requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
"""))

curdoc().config.color_scheme = "light"

show(p)
