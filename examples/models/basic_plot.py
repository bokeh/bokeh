''' A scatter plot of a smooth periodic oscillation. This example demonstrates red
circle scatter markers with black outlines, using the low-level ``bokeh.models``
API.

.. bokeh-example-metadata::
    :apis: bokeh.models.Scatter, bokeh.models.Plot, bokeh.models.ColumnDataSource, bokeh.models.LinearAxis, bokeh.models.PanTool, bokeh.models.WheelZoomTool
    :refs: :ref:`ug_basic_scatters_markers`
    :keywords: figure, scatter

'''
from numpy import arange, pi, sin

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (ColumnDataSource, LinearAxis, PanTool,
                          Plot, Scatter, WheelZoomTool)
from bokeh.util.browser import view

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)

source = ColumnDataSource(
    data=dict(x=x, y=y),
)

plot = Plot(min_border=80)

scatter = Scatter(x="x", y="y", fill_color="red", size=5, line_color="black")
plot.add_glyph(source, scatter)

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')

plot.add_tools(PanTool(), WheelZoomTool())

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "basic_plot.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, title="Basic Glyph Plot"))
    print(f"Wrote {filename}")
    view(filename)
