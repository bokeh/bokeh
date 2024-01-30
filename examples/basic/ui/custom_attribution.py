import numpy as np

from bokeh.io import show
from bokeh.models import Node, Panel
from bokeh.models.dom import HTML
from bokeh.plotting import figure


def plot(N: int):
    x = np.random.random(size=N) * 100
    y = np.random.random(size=N) * 100
    radii = np.random.random(size=N) * 1.5
    colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype="uint8")

    p = figure(active_scroll="wheel_zoom", lod_threshold=None, title=f"Plot with N={N} circles")
    p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

    return p

p = plot(500)

attribution = Panel(
    position=Node(target="frame", symbol="bottom_left"),
    anchor="bottom_left",
    css_variables={
        "--max-width": Node(target="frame", symbol="width"),
    },
    stylesheets=["""
:host {
  padding: 2px;
  background-color: rgba(211, 211, 211, 0.7);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: var(--max-width);
}
"""],
    elements=[
        HTML("&copy; np.<b>random</b>()"),
    ],
)
p.elements.append(attribution)

show(p)
