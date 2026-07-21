"""Exercise queued composition and cross-renderer draw batching."""

import numpy as np

from bokeh.plotting import figure, show

rng = np.random.default_rng(23)
p = figure(
    width=1000,
    height=650,
    output_backend="webgl",
    title="160 renderers: two ordered WebGL batches separated by a Canvas text barrier",
)

x = np.linspace(0, 20, 512)
for i in range(80):
    phase = i*0.07
    p.line(x, np.sin(x + phase) + i*0.035, line_alpha=0.18, line_color="#2563eb")

# Text currently uses Canvas. The compositor flushes the first WebGL batch
# before painting it, then starts another batch for the remaining lines.
p.text(
    x=[10], y=[1.4], text=["Canvas ordering barrier"],
    text_align="center", text_font_size="22px", text_color="#dc2626",
)

for i in range(80):
    phase = rng.uniform(0, 2*np.pi)
    p.line(x, np.cos(0.7*x + phase) - 1.8 - i*0.025, line_alpha=0.18, line_color="#059669")

show(p)
