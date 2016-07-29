from bokeh.plotting import output_file, show
from bokeh.models import Arrow, OpenHead, NormalHead, VeeHead, Label, Plot, Range1d

output_file("arrow_styles.html")

ARROW_HEADS = [OpenHead, NormalHead, VeeHead]
HEIGHT = 35 * len(ARROW_HEADS)

p = Plot(plot_width=150, plot_height=HEIGHT,
         x_range=Range1d(0,1), y_range=Range1d(-0.5, len(ARROW_HEADS) - 0.5),
         toolbar_location=None, outline_line_color=None, min_border_left=0,
         min_border_right=0, min_border_top=0, min_border_bottom=0)

for i, style in enumerate(ARROW_HEADS):
    p.add_layout(Arrow(x_start=0.2, y_start=i, x_end=0.2, y_end=i, end=style()))
    p.add_layout(Label(x=0.2, x_offset=20, y=i, text=style.__name__, text_baseline='middle', text_align='left'))

show(p)
