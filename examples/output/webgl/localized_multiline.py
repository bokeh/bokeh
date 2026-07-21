"""Show tight framebuffer accumulation for thousands of localized lines."""

import numpy as np

from bokeh.core.properties import value
from bokeh.plotting import figure, show

rng = np.random.default_rng(11)
nlines = 4_000
npoints = 32
centers = rng.uniform(-100, 100, size=(nlines, 2))
steps = rng.normal(scale=0.22, size=(nlines, npoints, 2)).cumsum(axis=1)
paths = centers[:, None, :] + steps

p = figure(width=1000, height=650, output_backend="webgl",
           title="4,000 localized dashed paths (bounded accumulation + high-precision phase)")
p.multi_line(
    xs=paths[:, :, 0].tolist(), ys=paths[:, :, 1].tolist(),
    line_color="#06b6d4", line_alpha=0.45, line_width=1.5,
    line_dash=value([1.5, 0.75, 0.25, 0.75]),
)

# A very long dashed path makes high-precision dash phase errors easy to spot.
x = np.linspace(-100, 100, 80_000)
p.line(x, 90 + 2*np.sin(x), line_color="#f97316", line_width=3, line_dash=[9, 4])

show(p)
