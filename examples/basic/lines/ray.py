from bokeh.plotting import field, figure, show

p = figure(width=400, height=400)
p.ray(
    x="x", y="y", length=45, angle=field("angle", units="deg"),
    source=dict(x=[1, 2, 3], y=[1, 2, 3], angle=[30, 45, 60]),
    color="#FB8072", line_width=2,
)

show(p)
