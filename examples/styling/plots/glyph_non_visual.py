import numpy as np

from bokeh.core.properties import field
from bokeh.io import show
from bokeh.models import BoxAnnotation, Indexed, Rect, Tooltip
from bokeh.palettes import Spectral11
from bokeh.plotting import figure

N = 50

x = np.random.random(size=N)*100
y = np.random.random(size=N)*100
radii = np.random.uniform(1, 5, size=N)
radii_big = radii*2
colors = np.random.choice(Spectral11, size=N)

p = figure(tools=["hover", "box_select"], active_drag="box_select")

cr = p.circle(
    x, y, radius=radii,
    fill_color=colors, fill_alpha=0.8, line_color=None,
    hover_fill_alpha=0.5, # mix `hover_` attributes with manual setup below
)

# there is no `hover_radius` so we have set things manually
cr.data_source.data["radii_big"] = radii_big
cr.hover_glyph.radius = field("radii_big")

# make selection glyph unrelated while reusing existing data
cr.selection_glyph = Rect(
    line_color=None,
    fill_color=field("fill_color"),
    width=field("radii_big"),
    height=field("radius"),
)

p.hover.tooltips = None

tooltip = Tooltip(position=Indexed(renderer=cr, index=0), content="Hover over me!", visible=True)
p.elements.append(tooltip)

box = BoxAnnotation(left=40, right=80, top=80, bottom=40)
tooltip = Tooltip(position=box.nodes.top_center, content="Select me!", visible=True, attachment="above")
box.elements.append(tooltip)
p.renderers.append(box)

show(p)
