import numpy as np

from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import Paragraph, Dialog
from bokeh.plotting import figure

x = np.linspace(0, 10, 500)
y = np.sin(x)
plot = figure(y_range=(-10, 10), plot_width=400, plot_height=400)
plot.line(x=x, y=y, line_width=3, line_alpha=0.6)

content = Paragraph(text='Content loading...')
dialog = Dialog(title='Loading', content="content", visible=True)

layout = column(
    plot,
    dialog,
)

show(dialog)
