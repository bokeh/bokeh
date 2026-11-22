''' Drag a source and sink or change their strengths to update a vector field in JavaScript.

.. bokeh-example-metadata::
    :title: Move a source and sink
    :keywords: vector field, source, sink, drag, PointDrawTool, slider, CustomJS
    :categories: topics/vector_fields, interaction/js_callbacks
    :apis: bokeh.models.PointDrawTool, bokeh.models.CustomJS, bokeh.plotting.figure.arrow
    :gallery: Red and blue draggable points in a dark vector field, with two strength sliders.

'''
import numpy as np

from bokeh.layouts import column, row
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    Div,
    HoverTool,
    NormalHead,
    PointDrawTool,
    Slider,
)
from bokeh.palettes import Turbo256
from bokeh.plotting import curdoc, figure, show
from bokeh.transform import linear_cmap

x, y = np.meshgrid(np.linspace(-3, 3, 29), np.linspace(-2, 2, 21))
x, y = x.ravel(), y.ravel()
field = ColumnDataSource(dict(x=x, y=y, **{
    name: np.zeros_like(x) for name in ("u", "v", "speed", "distance", "alpha", "x_end", "y_end")
}))
poles = ColumnDataSource(dict(x=[-1, 1], y=[0, 0], name=["Source", "Sink"], color=["#ef7754", "#56b4e9"]))

color = linear_cmap("speed", Turbo256[50:210], low=0, high=2)

p = figure(width=900, height=580, x_range=(-3.3, 3.3), y_range=(-2.3, 2.3), match_aspect=True,
           title="Drag the source and sink", tools="pan,wheel_zoom,reset", x_axis_label="x", y_axis_label="y")
p.background_fill_color = "#172330"
p.grids.grid_line_color = "white"
p.grids.grid_line_alpha = 0.07

arrows = p.arrow(x_start="x", y_start="y", x_end="x_end", y_end="y_end", source=field, level="glyph",
                 line_color=color, line_alpha="alpha", line_width=1.5,
                 end=NormalHead(size=5, fill_color=color, fill_alpha="alpha", line_color=None))
points = p.scatter("x", "y", source=poles, size=22, color="color", line_color="white", line_width=2)

draw = PointDrawTool(renderers=[points], add=False)
p.add_tools(draw)
p.add_tools(HoverTool(renderers=[arrows], limit=1, tooltips=[
    ("position", "(@x{0.00}, @y{0.00})"),
    ("vector", "(@u{0.00}, @v{0.00})"),
    ("speed", "@speed{0.00}"),
], filters={"@distance": CustomJS(code="""
    export default (args, tool, {value}) => value > 0.4
""")}))
p.add_tools(HoverTool(renderers=[points], tooltips=[("Drag to move", "@name")]))
p.toolbar.active_drag = draw

source_strength = Slider(title="Source strength", start=0, end=2, step=0.05, value=1, width=440)
sink_strength = Slider(title="Sink strength", start=0, end=2, step=0.05, value=1, width=440)

callback = CustomJS(args=dict(field=field, poles=poles, source_strength=source_strength, sink_strength=sink_strength), code="""
    const d = field.data
    const strengths = [source_strength.value, -sink_strength.value]
    for (let i = 0; i < d.x.length; i++) {
        let u = 0, v = 0, distance = Infinity
        for (let j = 0; j < 2; j++) {
            const dx = d.x[i] - poles.data.x[j]
            const dy = d.y[i] - poles.data.y[j]
            distance = Math.min(distance, Math.hypot(dx, dy))
            const r2 = Math.max(dx*dx + dy*dy, 0.005)
            u += strengths[j]*dx/r2
            v += strengths[j]*dy/r2
        }
        const speed = Math.hypot(u, v)
        const length = Math.min(0.28*speed/(0.3 + speed), Math.max(distance - 0.12, 0))
        const scale = speed > 0 ? length/speed : 0
        d.distance[i] = distance
        d.alpha[i] = distance > 0.14 && speed > 1e-8 ? 1 : 0
        d.u[i] = u
        d.v[i] = v
        d.speed[i] = speed
        d.x_end[i] = d.x[i] + scale*u
        d.y_end[i] = d.y[i] + scale*v
    }
    field.change.emit()
""")

curdoc().js_on_event("document_ready", callback)

# PointDrawTool emits a general change while dragging and a data change on release.
poles.js_on_change("change", callback)
source_strength.js_on_change("value", callback)
sink_strength.js_on_change("value", callback)

show(column(Div(text="Drag the <b>red source</b> and <b>blue sink</b>. Arrows point away from the source and toward the sink."),
            row(source_strength, sink_strength), p))
