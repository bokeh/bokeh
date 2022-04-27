''' An interactive explorer for image anchor and origin properties.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.image_rgba
    :keywords: image, anchor, origin

'''
import numpy as np

from bokeh.core.enums import Anchor, ImageOrigin
from bokeh.models import Select
from bokeh.plotting import column, figure, show

Sunset4 = [[0xff9a4b36, 0xffe5d2a5], [0xff72c0fd, 0xff2600a5]]
img = np.array(Sunset4, dtype=np.uint32)

p = figure(
    title="Different anchors and origins for image placed at coordinates (0, 0)",
    tools="", toolbar_location=None,
    x_range=(-10, 10), y_range=(-10, 10),
    background_fill_color="#efefef"
)
r = p.image_rgba(image=[img], x=0, y=0, dw=9, dh=9)
p.circle(0, 0, size=12, fill_color="black", line_color="white", line_width=3)

anchor = Select(title="anchor", options=list(Anchor), value=r.glyph.anchor)
anchor.js_link("value", r.glyph, "anchor")

origin = Select(title="origin", options=list(ImageOrigin), value=r.glyph.origin)
origin.js_link("value", r.glyph, "origin")

show(column(p, anchor, origin))
