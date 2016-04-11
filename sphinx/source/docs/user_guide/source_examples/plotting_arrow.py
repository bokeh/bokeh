from bokeh.plotting import figure, output_file, show
from bokeh.models import Arrow

output_file("arrow.html", title="arrow.py example")

p = figure(plot_width=600, plot_height=600, x_range=(-0.1,1.1), y_range=(-0.1,0.8))

p.circle(x=[0, 1, 0.5], y=[0, 0, 0.7], radius=0.1, color=["navy", "yellow", "red"], fill_alpha=0.1)

p.add_annotation(Arrow(head_style='vee', tail_x=0, tail_y=0, head_x=1, head_y=0))
p.add_annotation(Arrow(head_style='normal', tail_x=1, tail_y=0, head_x=0.5, head_y=0.7))
p.add_annotation(Arrow(head_style='open', tail_x=0.5, tail_y=0.7, head_x=0, head_y=0))

show(p)
