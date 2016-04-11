from bokeh.plotting import figure, output_file, show
from bokeh.models import Arrow, Label
from bokeh.core.enums import ArrowStyle

output_file("arrow_styles.html")

p = figure(plot_width=300, plot_height=300, x_range=(0,1), y_range=(-1.5,3), tools='')

p.add_annotation(Arrow(tail_x=0.1, tail_y=-1, head_x=0.9, head_y=-1,
                       head_style=None, tail_style=None))
p.add_annotation(Label(x=0.5, y=-1, text=[str(None),], text_align='center'))

for i, style in enumerate(ArrowStyle):
    p.add_annotation(Arrow(tail_x=0.1, tail_y=i, head_x=0.9, head_y=i,
                           head_style=style, tail_style=style))
    p.add_annotation(Label(x=0.5, y=i, text=['"{}"'.format(style)], text_align='center'))

show(p)
