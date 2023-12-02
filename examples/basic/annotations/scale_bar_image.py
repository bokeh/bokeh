from pathlib import Path

from bokeh.io import show
from bokeh.models import MetricLength, ScaleBar
from bokeh.plotting import figure

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select"

p = figure(
    title="Scale bar on an image",
    tools=TOOLS,
    active_scroll="wheel_zoom",
)

p.x_range.range_padding = 0
p.y_range.range_padding = 0

p.x_range.bounds = (0, 1)
p.y_range.bounds = (0, 1)

pollen_png = Path(__file__).parent / "assets" / "pollen.png"
img = pollen_png.read_bytes()

p.image_url(x=0, y=0, w=1, h=1, url=[img], anchor="bottom_left")

scale_bar = ScaleBar(
    range=p.x_range,
    unit="mm",
    dimensional=MetricLength(),
    orientation="horizontal",
    location="top_right",
    label="@{value} @{unit}",
    label_location="above",
    label_align="center",
    bar_length=0.2,
    bar_line_width=2,
    background_fill_alpha=0.8,
)
p.add_layout(scale_bar)

show(p)
