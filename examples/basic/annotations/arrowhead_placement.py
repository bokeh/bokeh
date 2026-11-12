''' Compare a named endpoint with a fractional arrowhead at the same tip.

.. bokeh-example-metadata::
    :apis: bokeh.models.GlyphRenderer.add_arrowheads, bokeh.models.NormalHead, bokeh.plotting.figure.line
    :refs: :ref:`ug_basic_annotations_path_markings`
    :keywords: arrowheads, endpoints, fractional positions, paths

'''
from bokeh.layouts import row
from bokeh.models import Label, NormalHead, Span
from bokeh.plotting import figure, show

x_tip, y_tip = 280, 0
plots = []
for at, title in (
    ("end", '"end" · shaft meets the back of the head'),
    (1.0, "1.0 · shaft reaches the tip"),
):
    plot = figure(width=340, height=120, x_range=(0, 320), y_range=(-40, 40),
                  title=title, toolbar_location=None, tools="", min_border=8)
    plot.axis.visible = False
    plot.grid.visible = False
    plot.add_layout(Span(location=x_tip, dimension="height", level="underlay",
                         line_color="#8895a5", line_dash="dotted"))
    plot.add_layout(Label(x=x_tip, y=23, text=f"Tip ({x_tip}, {y_tip})",
                          text_align="center", text_font_size="10px", background_fill_color="white"))
    path = plot.line([30, x_tip], [y_tip, y_tip], line_color="#0072b2", line_width=4)
    path.add_arrowheads(at=at, head=NormalHead(size=32, line_color="#9c4100",
                                             fill_color="#ffc46b", fill_alpha=0.45))
    plots.append(plot)

show(row(*plots))
