""" A scatter plot that demonstrates different ways of adding labels.

.. bokeh-example-metadata::
    :apis: bokeh.models.ColumnDataSource, bokeh.models.Label, bokeh.plotting.figure.scatter, bokeh.plotting.figure.text
    :refs: :ref:`ug_basic_annotations_labels`
    :keywords: scatter, label

"""

from bokeh.models import ColumnDataSource, Label, Node
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

p.text(x="weight", y="height", text="names",
       x_offset=5, y_offset=5, anchor="bottom_left", source=source)

frame_left = Node(target="frame", symbol="left", offset=5)
frame_bottom = Node(target="frame", symbol="bottom", offset=-5)

citation = Label(
    x=frame_left,
    y=frame_bottom,
    anchor="bottom_left",
    text="Collected by Luke C. 2016-04-01",
    padding=10,
    border_radius=5,
    border_line_color="black", background_fill_color="white",
)

p.add_layout(citation)

show(p)
