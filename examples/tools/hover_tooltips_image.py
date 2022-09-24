import numpy as np

from bokeh.plotting import figure, output_file, show

output_file("tools_hover_tooltip_image.html")

ramp = np.array([np.linspace(0, 10, 200)]*20)
steps = np.array([np.linspace(0, 10, 10)]*20)
bitmask = np.random.rand(25, 10) > 0.5

data = dict(image=[ramp, steps, bitmask],
            squared=[ramp**2, steps**2, bitmask**2],
            pattern=['smooth ramp', 'steps', 'bitmask'],
            x=[0, 0, 25],
            y=[5, 20, 5],
            dw=[20,  20, 10],
            dh=[10,  10, 25])

TOOLTIPS = [
    ('name', "$name"),
    ('index', "$index"),
    ('pattern', '@pattern'),
    ("x", "$x"),
    ("y", "$y"),
    ("value", "@image"),
    ('squared', '@squared')
]

p = figure(x_range=(0, 35), y_range=(0, 35), tools='hover,wheel_zoom', tooltips=TOOLTIPS)
p.image(source=data, image='image', x='x', y='y', dw='dw', dh='dh', palette="Inferno256", name="Image Glyph")

show(p)
