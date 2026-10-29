''' A scatter plot with a text label next to each marker. This example
demonstrates using the ``text`` glyph method to draw labels from data source
columns, with screen offsets, anchoring, and a background box.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.text, bokeh.plotting.figure.scatter, bokeh.models.ColumnDataSource
    :refs: :ref:`ug_basic_text_labels`
    :keywords: text, labels, scatter

'''
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show

source = ColumnDataSource(data=dict(
    height=[66, 71, 72, 68, 58, 62],
    weight=[165, 189, 220, 141, 260, 174],
    names=["Mark", "Amir", "Matt", "Greg", "Owen", "Juan"],
))

p = figure(title="Dist. of 10th Grade Students", x_range=(140, 275))
p.xaxis.axis_label = "Weight (lbs)"
p.yaxis.axis_label = "Height (in)"

p.scatter(x="weight", y="height", size=8, source=source)

p.text(x="weight", y="height", text="names", source=source,
       x_offset=6, y_offset=-6, anchor="top_left", padding=3, border_radius=3,
       text_font_size="12px", background_fill_color="white",
       border_line_color="lightgray")

show(p)
