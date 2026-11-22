""" Draggable canvas and UI components, for comparing their behavior.

Includes editable annotations (box, span, label, polygon), the range tool,
dialogs, drawers and a range slider, with and without movement limits. In all
cases pressing Escape while dragging cancels the interaction and restores
the state from before it started. Changes are logged to the console.

"""
from bokeh.core.enums import DimensionType
from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.model import Committed
from bokeh.models import (
    BoxAnnotation,
    Button,
    CustomJS,
    Dialog,
    Div,
    Drawer,
    InlineStyleSheet,
    Label,
    Model,
    Node,
    OpenDialog,
    Plot,
    PolyAnnotation,
    RangeSlider,
    RangeTool,
    Renderer,
    Span,
)
from bokeh.plotting import figure

LOG = """
console.log(`${prefix}${this}: ${attr}=${JSON.stringify(this[attr])}`)
"""

def logged[T: Model](obj: T, *attrs: str, committed: bool = False) -> T:
    for attr in attrs:
        obj.js_on_change(attr, CustomJS(args=dict(attr=attr, prefix=""), code=LOG))
        if committed:
            obj.js_on_change(attr, CustomJS(args=dict(attr=attr, prefix="[committed] "), code=LOG), policy=Committed())
    return obj

def editable_box(**kwargs) -> BoxAnnotation:
    box = BoxAnnotation(editable=True, left=4, right=6, top=6, bottom=4, **kwargs)
    return logged(box, "left", "right", "top", "bottom")

def limits_box(left, right, top, bottom) -> BoxAnnotation:
    return BoxAnnotation(
        left=left, right=right, top=top, bottom=bottom,
        line_color="black", line_dash="dashed", fill_color=None,
    )

def limit_span(location: float, dimension: DimensionType) -> Span:
    return Span(location=location, dimension=dimension, line_color="black", line_dash="dashed")

def plot(title: str, renderers: list[Renderer], **kwargs) -> Plot:
    kwargs.setdefault("x_range", (0, 10))
    kwargs.setdefault("y_range", (0, 10))
    return figure(
        width=300, height=300,
        title=title,
        toolbar_location=None,
        renderers=renderers,
        **kwargs,
    )

#
# BoxAnnotation
#

box_no_limits = plot("Box: no limits", [editable_box()])

box_data_limits = plot("Box: data limits", [
    editable_box(left_limit=2, right_limit=8, top_limit=8, bottom_limit=2),
    limits_box(2, 8, 8, 2),
])

frame_left = Node(target="frame", symbol="left", offset=20)
frame_right = Node(target="frame", symbol="right", offset=-20)
frame_top = Node(target="frame", symbol="top", offset=20)
frame_bottom = Node(target="frame", symbol="bottom", offset=-20)

box_frame_limits = plot("Box: frame limits (20px inset)", [
    editable_box(left_limit=frame_left, right_limit=frame_right, top_limit=frame_top, bottom_limit=frame_bottom),
    limits_box(frame_left, frame_right, frame_top, frame_bottom),
])

box_one_sided_limits = plot("Box: one-sided limits (left, top)", [
    editable_box(left_limit=2, top_limit=8),
    limit_span(2, "height"),
    limit_span(8, "width"),
])

box_reversed_limits = plot("Box: data limits, reversed x", [
    editable_box(left_limit=2, right_limit=8, top_limit=8, bottom_limit=2),
    limits_box(2, 8, 8, 2),
], x_range=(10, 0))

box_constrained = plot("Box: movable=x, resizable=x, symmetric", [
    editable_box(movable="x", resizable="x", symmetric=True),
])

#
# Span, Label, PolyAnnotation
#

others = plot("Span, Label, PolyAnnotation", [
    logged(Span(location=3, dimension="width", editable=True, line_color="red", line_width=2), "location"),
    logged(Span(location=7, dimension="height", editable=True, line_color="blue", line_width=2), "location"),
    logged(Label(x=1, y=8, text="Drag me", editable=True, text_font_size="16px"), "x", "y"),
    logged(PolyAnnotation(xs=[5, 8, 9, 6], ys=[1, 2, 4, 3], editable=True, fill_alpha=0.3), "xs", "ys"),
])

#
# RangeTool
#

detail = figure(
    width=300, height=200,
    title="RangeTool: detail (pan tool not cancellable)",
    x_range=(30, 60), y_range=(0, 100),
    tools="pan,wheel_zoom,reset",
)
detail.line(x=list(range(100)), y=list(range(100)))

range_tool = RangeTool(x_range=detail.x_range)
logged(range_tool.overlay, "left", "right")
overview = figure(
    width=300, height=120,
    title="RangeTool: press Esc to cancel gesture\nand restore the state",
    x_range=(0, 100), y_range=(0, 100),
    toolbar_location=None,
    tools=[range_tool],
)
overview.line(x=list(range(100)), y=list(range(100)))

#
# Drawer (component and viewport)
#

with_drawer = plot("Drawer: resizable, attached to the plot", [editable_box()])
hatch = InlineStyleSheet(css="""
:host {
  background-image: repeating-linear-gradient(
    45deg,
    rgb(128 128 128 / 0.12) 0 1px,
    transparent 1px 8px
  );
}
""")

component_drawer = logged(Drawer(location="right", resizable=True, open=True, size=150, stylesheets=[hatch], elements=[
    Div(text="Resize me by the left edge"),
]), "size")
with_drawer.elements.append(component_drawer)

viewport_drawer = logged(Drawer(location="below", resizable=True, open=False, size=150, stylesheets=[hatch], elements=[
    Div(text="Viewport drawer: resize me by the top edge"),
]), "size")

#
# Dialog
#

def parent(symbol: str, offset: int) -> Node:
    return Node(target="parent", symbol=symbol, offset=offset)

def dialog(title: str, content: str, **kwargs) -> tuple[Dialog, Button]:
    dialog = Dialog(title=title, content=content, visible=False, close_action="hide", **kwargs)
    button = Button(label=title)
    button.js_on_click(OpenDialog(dialog=dialog))
    return dialog, button

dialogs = [
    dialog("Dialog: no limits", "Move or resize freely."),
    dialog(
        "Dialog: parent limits",
        "Limited to the page layout, inset by 50px.",
        left_limit=parent("left", 50),
        right_limit=parent("right", -50),
        top_limit=parent("top", 50),
        bottom_limit=parent("bottom", -50),
    ),
    dialog(
        "Dialog: one-sided limits",
        "Limited only on the left and the top, inset by 50px.",
        left_limit=parent("left", 50),
        top_limit=parent("top", 50),
    ),
    dialog(
        "Dialog: movable=x, resizable=x",
        "Moves and resizes only horizontally.",
        movable="x",
        resizable="x",
    ),
    dialog(
        "Dialog: symmetric",
        "Resizes around its center.",
        symmetric=True,
    ),
]

#
# RangeSlider
#

range_slider = logged(
    RangeSlider(start=10, end=100, value=(25, 50), step=1, title="RangeSlider"),
    "value", committed=True,
)

layout = column(
    Div(text="<b>Press Escape while dragging to cancel. Changes are logged to the console.</b>"),
    row(box_no_limits, box_data_limits, box_frame_limits),
    row(box_one_sided_limits, box_reversed_limits, box_constrained),
    row(others, column(detail, overview), with_drawer),
    row(*[button for _, button in dialogs]),
    range_slider,
)
layout.elements.extend(dialog for dialog, _ in dialogs)

show([layout, viewport_drawer])
