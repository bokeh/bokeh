''' Visualize stress concentration in a finite-element plate with a cutout.

.. bokeh-example-metadata::
    :apis: bokeh.models.MeshDataSource, bokeh.plotting.figure.polygons, bokeh.transform.linear_cmap
    :keywords: mesh, finite element, indexed geometry, polygon
'''

# Standard library imports
from math import (
    atan2,
    cos,
    hypot,
    pi,
    sin,
)

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import (
    ColorBar,
    Div,
    HoverTool,
    MeshDataSource,
    NormalHead,
    TapTool,
)
from bokeh.palettes import Turbo256
from bokeh.plotting import figure, show
from bokeh.transform import linear_cmap

HALF_WIDTH = 3.0
HALF_HEIGHT = 2.0
HOLE_RADIUS = 0.6
ANGULAR_STEPS = 48
RADIAL_STEPS = 7

# Ray-cast from the circular cutout to the rectangular plate boundary. Including
# the four corner angles makes the outer ring an exact rectangle.
corner_angles = [
    atan2(y, x) % (2*pi)
    for x, y in [
        (HALF_WIDTH, HALF_HEIGHT),
        (-HALF_WIDTH, HALF_HEIGHT),
        (-HALF_WIDTH, -HALF_HEIGHT),
        (HALF_WIDTH, -HALF_HEIGHT),
    ]
]
angles = sorted({
    round(2*pi*i/ANGULAR_STEPS, 12)
    for i in range(ANGULAR_STEPS)
} | {round(angle, 12) for angle in corner_angles})

vertices = []
for level in range(RADIAL_STEPS + 1):
    # Bias the rings toward the hole, where the stress gradient is highest.
    fraction = (level/RADIAL_STEPS)**1.6
    for angle in angles:
        x_direction = cos(angle)
        y_direction = sin(angle)
        outer_radius = min(
            HALF_WIDTH/max(abs(x_direction), 1e-12),
            HALF_HEIGHT/max(abs(y_direction), 1e-12),
        )
        radius = HOLE_RADIUS + fraction*(outer_radius - HOLE_RADIUS)
        vertices.append((radius*x_direction, radius*y_direction))

n_angles = len(angles)
cell_records = []

for ring in range(RADIAL_STEPS):
    for sector in range(n_angles):
        next_sector = (sector + 1) % n_angles
        inner = ring*n_angles + sector
        inner_next = ring*n_angles + next_sector
        outer = (ring + 1)*n_angles + sector
        outer_next = (ring + 1)*n_angles + next_sector

        for triangle in [(inner, outer, outer_next), (inner, outer_next, inner_next)]:
            points = [vertices[index] for index in triangle]
            centroid_x = sum(x for x, _ in points)/3
            centroid_y = sum(y for _, y in points)/3
            radius = hypot(centroid_x, centroid_y)
            angle = atan2(centroid_y, centroid_x)

            # A compact, illustrative approximation of the stress concentration
            # under horizontal tension. It is intentionally not an FEA solver.
            normalized_stress = 1 + 2*(HOLE_RADIUS/radius)**2*sin(angle)**2
            cell_records.append((triangle, {
                "stress": normalized_stress,
            }))

mesh = MeshDataSource(
    vertices=vertices,
    cells=cell_records,
)
stress = [attributes["stress"] for _, attributes in cell_records]

stress_color = linear_cmap(
    "stress",
    Turbo256,
    low=min(stress),
    high=max(stress),
)

p = figure(
    width=850,
    height=560,
    sizing_mode="scale_width",
    max_width=850,
    x_range=(-3.7, 3.7),
    y_range=(-2.35, 2.35),
    match_aspect=True,
    tools="pan,wheel_zoom,reset",
    toolbar_location="above",
    title="Finite-element stress around a circular cutout",
)
p.grid.visible = False
p.axis.visible = False

cells = p.polygons(
    mesh,
    fill_color=stress_color,
    fill_alpha=0.95,
    line_color="white",
    line_alpha=0.55,
    line_width=0.7,
    hover_line_color="#111827",
    hover_line_width=2,
    selection_line_color="#111827",
    selection_line_width=3,
    nonselection_fill_alpha=0.25,
)

# The small dots make the shared vertex representation apparent without
# overwhelming the computed field.
p.scatter(
    source=mesh.vertices,
    x="x",
    y="y",
    size=2.5,
    color="#172033",
    alpha=0.45,
)

p.ellipse(
    x=0, y=0, width=2*HOLE_RADIUS, height=2*HOLE_RADIUS,
    fill_color="white", line_color="#172033", line_width=2.5,
)

# Outward arrows indicate the horizontal tensile load used by the field above.
for y in [-1.35, 0, 1.35]:
    for x_start, x_end in [(-2.8, -3.45), (2.8, 3.45)]:
        p.arrow(
            end=NormalHead(size=10, fill_color="#475569", line_color="#475569"),
            x_start=x_start,
            y_start=y,
            x_end=x_end,
            y_end=y,
            line_color="#475569",
            line_width=1.5,
        )

p.add_layout(ColorBar(
    color_mapper=stress_color.transform,
    title="stress / nominal",
    title_text_font_size="12px",
    label_standoff=8,
), "right")

hover = HoverTool(
    renderers=[cells],
    tooltips=[
        ("element", "$index"),
        ("stress / nominal", "@stress{0.000}"),
        ("vertex indices", "@vertices"),
    ],
)
p.add_tools(hover, TapTool(renderers=[cells]))
p.toolbar.active_inspect = hover

description = Div(sizing_mode="stretch_width", max_width=850, text=f"""
<h2 style="margin: 0 0 0.35em">A plate with a circular cutout under tension</h2>
<p style="margin: 0; max-width: 850px">
  {len(vertices)} shared vertices define {len(cell_records)} triangular elements.
  The mesh is refined around the cutout, where the illustrative stress field
  concentrates. Hover for stress and connectivity; click to isolate a cell.
</p>
""")

layout = column(description, p, sizing_mode="stretch_width", max_width=900)
show(layout)
