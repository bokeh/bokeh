from bokeh.events import SelectionGeometry
from bokeh.models import ColumnDataSource, CustomJS, Quad
from bokeh.plotting import figure, show

source = ColumnDataSource(data=dict(left=[], right=[], top=[], bottom=[]))

callback = CustomJS(args=dict(source=source), code="""
    const geometry = cb_obj.geometry
    const data = source.data

    // quad is forgiving if left/right or top/bottom are swappeed
    source.data = {
        left: data.left.concat([geometry.x0]),
        right: data.right.concat([geometry.x1]),
        top: data.top.concat([geometry.y0]),
        bottom: data.bottom.concat([geometry.y1])
    }
""")

p = figure(width=400, height=400, title="Select below to draw rectangles",
           tools="box_select", x_range=(0, 1), y_range=(0, 1))

# using Quad model directly to control (non)selection glyphs more carefully
quad = Quad(left='left', right='right',top='top', bottom='bottom',
            fill_alpha=0.3, fill_color='#009933')

p.add_glyph(source, quad, selection_glyph=quad, nonselection_glyph=quad)

p.js_on_event(SelectionGeometry, callback)

show(p)
