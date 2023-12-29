import numpy as np

from bokeh.models import CustomJS, Div, TapTool
from bokeh.plotting import figure, row, show

N = 26 * 26
x, y = np.mgrid[0:101:4, 0:101:4].reshape((2, N))
radii = np.random.random(N) * 0.4 + 1.7
colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype="uint8")

TOOLS = "crosshair,pan,wheel_zoom,box_zoom,reset,save"

p = figure(title="Tappy Scatter", tools=TOOLS)

cr = p.circle(x[:N//2], y[:N//2], radius=radii[:N//2],
              fill_color=colors[:N//2], fill_alpha=0.6, line_color=None)

rr = p.rect(x[N//2:], y[N//2:], width=3, height=3,
            fill_color=colors[N//2:], fill_alpha=0.6, line_color=None)

div = Div(stylesheets=[":host { white-space: pre; }"])

tap_tool = TapTool(
    description="Tap (requires Ctrl modifier key)",
    renderers=[cr],
    behavior="inspect",
    modifiers="ctrl",
    callback=CustomJS(
        args=dict(div=div),
        code="""
            div.text = `${div.text}\nInspected circle #${cb_data.source.inspected.indices}`
        """,
    ),
)
p.add_tools(tap_tool)

tap_tool = TapTool(
    description="Tap (shows modifiers used)",
    renderers=[rr],
    behavior="inspect",
    callback=CustomJS(
        args=dict(div=div),
        code="""
            const {shift, ctrl, alt} = cb_data.event.modifiers
            const modifiers = `shift = ${shift}, ctrl = ${ctrl}, alt = ${alt}`
            div.text = `${div.text}\nInspected rect #${cb_data.source.inspected.indices} using ${modifiers}`
        """,
    ),
)
p.add_tools(tap_tool)

show(row(p, div))
