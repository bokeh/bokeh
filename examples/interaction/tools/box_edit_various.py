from bokeh.io import show
from bokeh.models import BoxEditTool, HoverTool
from bokeh.palettes import Plasma256
from bokeh.plotting import figure

p = figure(
    x_range=(-3, 5), y_range=(-3, 10),
    title="Move, delete and draw new box-like glyphs",
)

palette = reversed(Plasma256[::20])

r_rect = p.rect(x=[0.5], y=[0.5], width=[1], height=[1], color=next(palette))
r_quad = p.quad(left=[0], bottom=[2], top=[3], right=[1], color=next(palette))
r_block = p.block(x=[0], y=[4], width=[1], height=[1], color=next(palette))
r_hbar = p.hbar(y=[6.5], height=[1], left=[0], right=[1], color=next(palette))
r_vbar = p.vbar(x=[0.5], width=[1], top=[9], bottom=[8], color=next(palette))
r_hstrip = p.hstrip(y0=[-1], y1=[-2], color=next(palette))
r_vstrip = p.vstrip(x0=[-1], x1=[-2], color=next(palette))

box_edit = BoxEditTool(renderers=[
    r_quad,
    r_rect,
    r_block,
    r_hbar,
    r_vbar,
    r_hstrip,
    r_vstrip,
])

hover = HoverTool(
    tooltips=[
        ("index", "$index"),
        ("type", "$type"),
    ],
)

p.add_tools(box_edit, hover)
p.toolbar.active_drag = box_edit

show(p)
