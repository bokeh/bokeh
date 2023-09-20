from bokeh.io import show
from bokeh.layouts import row
from bokeh.models import BoxAnnotation, Node
from bokeh.plotting import figure

frame_left = Node(target="frame", symbol="left", offset=20)
frame_right = Node(target="frame", symbol="right", offset=-20)
frame_top = Node(target="frame", symbol="top", offset=20)
frame_bottom = Node(target="frame", symbol="bottom", offset=-20)

box0 = BoxAnnotation(
    editable=True,
    symmetric=False,
    left=4,
    right=6,
    top=4,
    bottom=6,
    left_limit=2,
    right_limit=8,
    top_limit=8,
    bottom_limit=2,
)

limits_box0 = BoxAnnotation(
    left=2,
    right=8,
    top=8,
    bottom=2,
    line_color="black",
    line_dash="dashed",
    fill_color=None,
)

box1 = BoxAnnotation(
    editable=True,
    symmetric=False,
    left=4,
    right=6,
    top=4,
    bottom=6,
    left_limit=frame_left,
    right_limit=frame_right,
    top_limit=frame_top,
    bottom_limit=frame_bottom,
)

limits_box1 = BoxAnnotation(
    left=frame_left,
    right=frame_right,
    top=frame_top,
    bottom=frame_bottom,
    line_color="black",
    line_dash="dashed",
    fill_color=None,
)

plot0 = figure(
    width=400, height=400,
    title="Editable BoxAnnotation with data limits",
    toolbar_location=None,
    renderers=[box0, limits_box0],
    x_range=(0, 10), y_range=(0, 10),
)

plot1 = figure(
    width=400, height=400,
    title="Editable BoxAnnotation with frame limits (20px offset)",
    toolbar_location=None,
    renderers=[box1, limits_box1],
    x_range=(0, 10), y_range=(0, 10),
)

show(row(plot0, plot1))
