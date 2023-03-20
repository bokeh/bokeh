from bokeh.plotting import figure, show

p = figure(width=400, height=400)

glyphs = p.harea_step(
    y=[1, 2, 3, 4, 5],
    x1=[12, 16, 14, 13, 15],
    x2=[1, 4, 2, 1, 3],
    step_mode='after')

show(p)
