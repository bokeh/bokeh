from bokeh.core.enums import MarkerType
from bokeh.plotting import figure, show

bases = [
    "asterisk",
    "circle",
    "cross",
    "dash",
    "diamond",
    "dot",
    "hex",
    "inverted_triangle",
    "plus",
    "square",
    "star",
    "triangle",
    "x",
    "y",
]

kinds = [
    "",
    "cross",
    "dot",
    "pin",
    "x",
    "y",
]

data = []

for base in bases:
    for kind in kinds:
        name = f"{base}_{kind}" if kind else base
        if name in MarkerType:
            data.append((name, base, kind))

marker, base, kind = zip(*data)

p = figure(
    x_range=kinds,
    y_range=list(reversed(bases)),
    width=400,
    toolbar_location=None,
    x_axis_location="above",
)
p.grid.grid_line_color = None
p.axis.major_tick_line_color = None

p.scatter(
    marker=marker,
    x=kind,
    y=base,
    size=25,
    fill_alpha=0.4,
    fill_color="orange",
)

show(p)
