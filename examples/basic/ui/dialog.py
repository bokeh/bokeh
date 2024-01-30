import numpy as np

from bokeh.io import show
from bokeh.models import Button, Column, CustomJS, Dialog, OpenDialog
from bokeh.plotting import figure


def plot(N: int):
    x = np.random.random(size=N) * 100
    y = np.random.random(size=N) * 100
    radii = np.random.random(size=N) * 1.5
    colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype="uint8")

    p = figure(active_scroll="wheel_zoom", lod_threshold=None, title=f"Plot with N={N} circles", sizing_mode="stretch_both")
    p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

    return p

show_plot = Button(label="Show plot ...")

close_dialog = Button(label="Close")
dialog = Dialog(
    title="Dialog with a plot",
    content=Column(
        sizing_mode="stretch_both",
        children=[
            plot(500),
            close_dialog,
        ],
    ),
)
show_plot.js_on_click(OpenDialog(dialog=dialog))
close_dialog.js_on_click(
    CustomJS(
        args=dict(dialog=dialog),
        code="export default ({dialog}, _obj, _data, {index}) => index.get_one(dialog).close()",
    ),
)

show(show_plot)
