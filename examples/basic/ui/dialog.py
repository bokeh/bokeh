import numpy as np

from bokeh.core.enums import OutputBackendType
from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import Button, CloseDialog, Column, Dialog, OpenDialog
from bokeh.models.dom import HTML
from bokeh.plotting import figure


def ui(N: int, output_backend: OutputBackendType):
    x = np.random.random(size=N) * 100
    y = np.random.random(size=N) * 100
    radii = np.random.random(size=N) * 1.5
    colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype="uint8")

    plot = figure(
        title=f"Plot with N={N} circles",
        output_backend=output_backend,
        lod_threshold=None,
        active_scroll="wheel_zoom",
        sizing_mode="stretch_both",
    )
    plot.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

    show_plot = Button(
        label=HTML(f"Show plot using <b>{output_backend}</b> backend ..."),
        sizing_mode="stretch_width",
    )

    close_plot = Button(label="Close")
    dialog = Dialog(
        title=HTML(f"Dialog with a plot using <b>{output_backend}</b> backend"),
        content=Column(
            sizing_mode="stretch_both",
            children=[
                plot,
                close_plot,
            ],
        ),
    )
    show_plot.js_on_click(OpenDialog(dialog=dialog))
    close_plot.js_on_click(CloseDialog(dialog=dialog))

    # Alternatively a CustomJS callback can be used to achieve the same effect:
    #
    # from bokeh.models import CustomJS
    # close_plot.js_on_click(
    #     CustomJS(
    #         args=dict(dialog=dialog),
    #         code="export default ({dialog}, _obj, _data, {index}) => index.get_one(dialog).close()",
    #     ),
    # )

    return show_plot

layout = column([
    ui(1000, "canvas"),
    ui(1000, "svg"),
    ui(1000, "webgl"),
])

show(layout)
