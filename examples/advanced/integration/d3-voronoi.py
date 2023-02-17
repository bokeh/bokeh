import numpy as np
from bokeh.plotting import figure
from bokeh.models import CustomESM, ColumnDataSource, PointDrawTool, Slider, ColorBar
from bokeh.palettes import Sunset8
from bokeh.transform import linear_cmap
from bokeh.io import curdoc, show
from bokeh.layouts import column

x =  np.random.random(100)*3
y  = np.random.random(100)*2

z = 1.3*np.exp(-2.5*((x-1.3)**2 + (y-0.8)**2)) - 1.2*np.exp(-2*((x-1.8)**2 + (y-1.3)**2))

source = ColumnDataSource(data=dict(
    x=x,
    y=y,
    z=z,
    pxs=[[] for _ in range(100)],
    pys=[[] for _ in range(100)],
))

p = figure(width=800, height=400, x_range=(-.5, 3.5), y_range=(-0.5, 2.5), title="Move some points!")
cmap = linear_cmap(field_name="z", palette=Sunset8, low=-1, high=1)
r = p.scatter(x="x", y="y", fill_color=cmap, line_alpha=cmap, size=8, source=source)

color_bar = ColorBar(color_mapper=cmap.transform, label_standoff=12)
p.add_layout(color_bar, "right")

et = PointDrawTool(renderers=[r], num_objects=50)
p.add_tools(et)

vr = p.patches(xs="pxs", ys="pys", fill_color=cmap, line_color="black", fill_alpha=0.5, source=source)

slider = Slider(title="Buffer extent", value=0, start=0, end=1, step=0.1)

cb = CustomESM(args=dict(source=source, slider=slider), code="""
    import {Delaunay} from "https://cdn.skypack.dev/d3-delaunay@6"
    const {min, max, transpose} = Bokeh.require("core/util/array")

    export default function({source, slider}) {
        const px = source.data["x"]
        const py = source.data["y"]
        const ext = [
            min(px) - slider.value,
            min(py) - slider.value,
            max(px) + slider.value,
            max(py) + slider.value,
        ]

        // Create the delaunay/voronoi object using d3, and iterate through its polygons
        // populating arrays storing polygon geometries as we go.
        const delaunay = Delaunay.from(transpose([px, py]))
        const vor = delaunay.voronoi(ext)
        const polyxs = []
        const polyys = []
        const inds = []
        for (const vp of vor.cellPolygons()) {
            // It's possible that a polygon with less than 3 points will be produced.
            // In that case, we want to assign an empty geometry instead.
            if (vp.length > 3) {
                inds.push(vp.index)
                const tp = transpose(vp)
                polyxs.push(tp[0])
                polyys.push(tp[1])
            } else {
                polyxs.push([])
                polyys.push([])
            }
        }
        source.data["pxs"] = polyxs
        source.data["pys"] = polyys
        source.change.emit()
    }
    """,
)

source.js_on_change("data", cb)
slider.js_on_change("value", cb)

curdoc().js_on_event("document_ready", cb)

show(column([p, slider]))
