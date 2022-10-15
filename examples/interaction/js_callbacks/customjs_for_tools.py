from bokeh.events import SelectionGeometry
from bokeh.models import ColumnDataSource, CustomJS, Rect
from bokeh.plotting import figure, show

source = ColumnDataSource(data=dict(x=[], y=[], width=[], height=[]))

callback = CustomJS(args=dict(source=source), code="""
    const geometry = cb_obj.geometry
    const data = source.data

    const width = geometry.x1 - geometry.x0
    const height = geometry.y1 - geometry.y0
    const x = geometry.x0 + width/2
    const y = geometry.y0 + height/2

    source.data = {
        x: data.x.concat([x]),
        y: data.y.concat([y]),
        width: data.width.concat([width]),
        height: data.height.concat([height])
    }
""")

p = figure(width=400, height=400, title="Select below to draw rectangles",
           tools="box_select", x_range=(0, 1), y_range=(0, 1))

rect = Rect(x='x', y='y', width='width', height='height',
            fill_alpha=0.3, fill_color='#009933')

p.add_glyph(source, rect, selection_glyph=rect, nonselection_glyph=rect)

p.js_on_event(SelectionGeometry, callback)

show(p)
