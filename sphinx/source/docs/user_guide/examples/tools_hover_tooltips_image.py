import numpy as np
from bokeh.plotting import figure, output_file, show, ColumnDataSource
from bokeh.models import HoverTool

output_file("tools_hover_tooltip_image.html")

img1 = np.array([np.linspace(0, 10, 200)]*20)
img2 = np.array([np.linspace(0, 10, 10)]*20)
img3 = np.random.rand(25, 10) > 0.5


data = dict(image=[img1, img2, img3],
            pattern=['smooth ramp', 'steps', 'bit mask'],
            tenfold=[img1*10, img2*10, img3*10],
            x=[0, 0, 25],
            y=[5, 20, 5],
            dw=[20,  20, 10],
            dh=[10,  10, 25])

cds = ColumnDataSource(data=data)
hover = HoverTool(tooltips=[
    ('index', "$index"),
    ("x", "$x"),
    ("y", "$y"),
    ('pattern', '@pattern'),
    ('10x', '@tenfold'),
    ("value", "@image")], )

p = figure( x_range=(0, 35), y_range=(0, 35), tools=[hover, 'wheel_zoom'])
p.image(source=cds, image='image', x='x', y='y', dw='dw', dh='dh', palette="Inferno256")
show(p)
