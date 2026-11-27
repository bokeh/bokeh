''' Style the bounding boxes of text labels differently when hovered,
selected or muted.

.. bokeh-example-metadata::
    :title: Style text bounding boxes by state
    :keywords: glyph, text, hover, selection, mute
    :apis: bokeh.plotting.figure.text, bokeh.models.HoverTool, bokeh.models.TapTool
    :gallery: Text labels in boxes that highlight on hover, fade when not selected and dim when muted from the legend.
'''

from typing import Any

from bokeh.models import HoverTool
from bokeh.plotting import figure, show

p = figure(
    width=500, height=300, x_range=(0, 4), y_range=(0, 3), tools="tap,reset",
    title="Hover, click labels to select them, click the legend to mute",
)
p.axis.visible = False
p.grid.visible = False

# TODO style = TextArgs(text_font_size="16px", ...) when pyi files are dropped
style: dict[str, Any] = dict(
    text_font_size="16px", text_align="center", text_baseline="middle", padding=6,
    background_fill_color="white", border_line_color="gray", border_line_width=2, border_radius=6,
    # highlighted on hover
    hover_background_fill_color="lightyellow", hover_border_line_color="orange",
    # selected labels get a colored border; unselected and muted labels fade
    # entirely, including their boxes
    selection_border_line_color="firebrick",
)

fruits = p.text(
    x=[0.7, 2.0, 3.3], y=[2.2, 2.4, 2.1], text=["apple", "banana", "cherry"],
    legend_label="fruits", **style,
)
vegetables = p.text(
    x=[0.8, 2.1, 3.2], y=[0.9, 0.6, 1.0], text=["carrot", "leek", "potato"],
    legend_label="vegetables", **style,
)

p.add_tools(HoverTool(renderers=[fruits, vegetables], tooltips=None))
p.legend.location = "center"
p.legend.click_policy = "mute"

show(p)
