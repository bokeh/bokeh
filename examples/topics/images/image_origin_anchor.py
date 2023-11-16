''' An interactive explorer for image anchor and origin properties.

The anchor property can shift the image vertically or horizontally.

The origin property flip the image vertically or horizontally.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.image_rgba
    :keywords: image, anchor, origin

'''
import numpy as np

from bokeh.core.enums import Anchor, ImageOrigin
from bokeh.models import ColumnDataSource, Select
from bokeh.palettes import Sunset4
from bokeh.plotting import column, figure, show

Sunset4_RGBA = [[0xff9a4b36, 0xffe5d2a5], [0xff72c0fd, 0xff2600a5]]
img = np.array(Sunset4_RGBA, dtype=np.uint32)

p = figure(
    title="Different anchors and origins for image placed at coordinates (0, 0)",
    tools="", toolbar_location=None,
    x_range=(-10, 10), y_range=(-10, 10),
    background_fill_color="#efefef",
)
r = p.image_rgba(image=[img], x=0, y=0, dw=8.5, dh=8.5)
p.scatter(0, 0, size=12, fill_color="black", line_color="white", line_width=3)

# a legend to identify the image pixel i, j coordinates
source = ColumnDataSource(data=dict(
    color=Sunset4,
    coord=["img[0,0]", "img[0,1]", "img[1,0]", "img[1,1]"],
))
p.scatter(0, 0, marker="square", color="color", legend_group="coord", source=source, visible=False)
p.legend.location = "bottom_center"
p.legend.orientation = "horizontal"
p.legend.glyph_height = 30
p.legend.glyph_width = 30
p.legend.padding = 3
p.legend.margin = 5
p.legend.label_standoff = 0
p.legend.spacing = 25
p.legend.background_fill_color = None
p.legend.border_line_color = None

anchor = Select(title="anchor", options=list(Anchor), value=r.glyph.anchor)
anchor.js_link("value", r.glyph, "anchor")

origin = Select(title="origin", options=list(ImageOrigin), value=r.glyph.origin)
origin.js_link("value", r.glyph, "origin")

show(column(p, anchor, origin))
