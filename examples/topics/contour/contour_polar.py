''' Contour plot with polar grid and many visual properties.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.contour, bokeh.models.ContourRenderer.add_labels, bokeh.models.ContourRenderer.construct_color_bar
    :refs: :ref:`ug_topics_contour_polar`
    :keywords: contour

'''
import numpy as np

from bokeh.palettes import Cividis
from bokeh.plotting import figure, show

# Data to contour is a 2D sin wave on a polar grid.
radius, angle = np.meshgrid(np.linspace(0, 1, 20), np.linspace(0, 2*np.pi, 120))
x = radius*np.cos(angle)
y = radius*np.sin(angle)
z = 1 + np.sin(3*angle)*np.sin(np.pi*radius)

p = figure(width=550, height=400)

levels = np.linspace(0, 2, 11)

contour_renderer = p.contour(
    x=x, y=y, z=z, levels=levels,
    fill_color=Cividis,
    hatch_pattern=["x"]*5 + [" "]*5,
    hatch_color="white",
    hatch_alpha=0.5,
    line_color=["white"]*5 + ["black"] + ["red"]*5,
    line_dash=["solid"]*6 + ["dashed"]*5,
    line_width=[1]*6 + [2]*5,
)

# Skip a contour between labels on each lobe and label one spoke.
label_positions = {2: [0.23], 4: [0.19], 5: [0.45], 6: [0.81], 8: [0.80]}
contour_renderer.line_renderer.data_source.data["label_positions"] = [
    label_positions.get(i, []) for i in range(len(levels))
]
contour_renderer.add_labels(positions="label_positions", text_color="black", text_font_style="bold")

colorbar = contour_renderer.construct_color_bar(title="Colorbar title")
p.add_layout(colorbar, "right")

show(p)
