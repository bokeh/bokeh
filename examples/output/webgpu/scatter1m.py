""" Scatter plot with 1M points comparing WebGL and WebGPU backends.

Note: WebGPU requires browser support. In Chrome, you may need to enable
WebGPU via chrome://flags/#enable-unsafe-webgpu or use Chrome 113+.

"""
import numpy as np

from bokeh.io import output_file
from bokeh.layouts import row
from bokeh.plotting import figure, show

# Use inline resources to ensure we use the local BokehJS build
output_file("scatter1m.html", mode="inline")

N = 1_000_000

x = np.random.normal(0, np.pi, N)
y = np.sin(x) + np.random.normal(0, 0.2, N)

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select"

p_webgl = figure(tools=TOOLS, output_backend="webgl", title="WebGL")
p_webgl.circle(x, y, radius=0.02, alpha=0.1, nonselection_alpha=0.001)

p_webgpu = figure(tools=TOOLS, output_backend="webgpu", title="WebGPU")
p_webgpu.circle(x, y, radius=0.02, alpha=0.1, nonselection_alpha=0.001)

show(row(p_webgl, p_webgpu))
