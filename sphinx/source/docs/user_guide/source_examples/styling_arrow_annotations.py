from bokeh.plotting import figure, output_file, show
from bokeh.models import Arrow, Label, Plot, Range1d
from bokeh.core.enums import ArrowStyle

output_file("arrow_styles.html")

NUM_STYLES = sum(1 for _ in ArrowStyle)
HEIGHT = 35 * NUM_STYLES

p = Plot(plot_width=120, plot_height=HEIGHT,
         x_range=Range1d(0,1), y_range=Range1d(-0.5, NUM_STYLES - 0.5),
         toolbar_location=None, outline_line_color=None, min_border_left=0,
         min_border_right=0, min_border_top=0, min_border_bottom=0)

for i, style in enumerate(ArrowStyle):
    p.add_annotation(Arrow(tail_x=0.2, tail_y=i, head_x=0.2, head_y=i,
                           head_style=style))
    p.add_annotation(Label(x=0.2, x_offset=20, y=i, text=[str(style)],
                           text_baseline='middle', text_align='left'))

show(p)
