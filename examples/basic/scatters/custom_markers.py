''' A scatter plot showing every marker type.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.scatter, bokeh.plotting.figure.text
    :refs: :ref:`ug_basic_scatters_markers`
    :keywords: scatter, markers

'''
from numpy.random import random

from bokeh.core.enums import MarkerType
from bokeh.models import CustomJS
from bokeh.plotting import figure, show

# custom marker producing a Path2D object
bowtie = CustomJS(code="""
const SQ3 = Math.sqrt(3)

export default (args, obj, {r}) => {
    const h = r*SQ3
    const a = h/3

    const path = new Path2D()
    path.moveTo(0, 0)
    path.lineTo(-h, a)
    path.lineTo(-h, -a)
    path.lineTo(h, a)
    path.lineTo(h, -a)
    path.closePath()

    return path
}
""")

# custom marker painting using Context2d and visuals
wheel = CustomJS(code="""
const {PI} = Math

export default (args, obj, {ctx, i, r, visuals}) => {
    ctx.arc(0, 0, r, 0, 2*Math.PI, false)

    for (let j = 0; j < 4; j++) {
        ctx.moveTo(0, r)
        ctx.lineTo(0, -r)
        ctx.rotate(PI/3)
    }
    ctx.rotate(-4*PI/3)

    visuals.fill.apply(ctx, i)
    visuals.hatch.apply(ctx, i)
    visuals.line.apply(ctx, i)
}
""")

p = figure(title="Bokeh & Custom Markers", toolbar_location=None, width=600, height=800)
p.grid.grid_line_color = None
p.background_fill_color = "#eeeeee"
p.axis.visible = False
p.y_range.flipped = True

N = 10

for i, marker in enumerate([*MarkerType, "@bowtie", "@wheel"]):
    x = i % 4
    y = (i // 4) * 4 + 1

    p.scatter(
        random(N)+2*x, random(N)+y, marker=marker, size=14,
        line_color="navy", fill_color="orange", alpha=0.5,
        defs={
            "@bowtie": bowtie,
            "@wheel": wheel,
        },
    )

    p.text(
        2*x+0.5, y+2.5, text=[marker],
        text_color="firebrick", text_align="center", text_font_size="13px",
    )

show(p)
