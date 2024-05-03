import numpy as np

from bokeh.palettes import Spectral11
from bokeh.plotting import figure, show

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.random.choice(Spectral11, size=N)

p = figure(width=400, height=400)
p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

p.stylesheets.append("""
:host {
    /* plot background */
    --bk-background-fill-color: azure;

    /* common axis line dash */
    --bk-axis-line-dash: dotted;

    /* common axis tick colors */
    --tick-color: red;
    --bk-major-tick-line-color: var(--tick-color);
    --bk-minor-tick-line-color: var(--tick-color);
}
""")
p.xaxis.stylesheets.append("""
:host {
    /* x-axis background color */
    --bk-background-fill-color: yellow;

    /* x-axis major label styling */
    --bk-major-label-text-font-style: bold;
}
""")
p.yaxis.stylesheets.append("""
:host {
    /* y-axis background color */
    --bk-background-fill-color: pink;

    /* y-axis major label styling */
    --bk-major-label-text-font-size: 1.25em;
}
""")

show(p)
