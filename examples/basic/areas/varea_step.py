from bokeh.plotting import figure, show

p = figure(width=400, height=400)

glyphs = p.varea_step(
    x=[1, 2, 3, 4, 5],
    y1=[12, 16, 14, 13, 15],
    y2=[1, 4, 2, 1, 3],
    step_mode='after')

show(p)
