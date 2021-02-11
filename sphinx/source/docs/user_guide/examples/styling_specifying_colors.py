import numpy as np

from bokeh.plotting import figure, show, output_file

output_file("specifying_colors.html")

x = [1, 2, 3]
y1 = [1, 4, 2]
y2 = [2, 1, 4]
y3 = [4, 3, 2]

# use a single RGBA color
single_color = (255, 0, 0, 0.5)

# use a list of HSL colors
list_of_colors = [
    "hsl(60deg 100% 50% / 1.0)",
    "hsl(0deg 100% 50% / 0.4)",
    "hsl(120deg 100% 50% / 1.0)",
]

# use a series of color values as numpy array
numpy_array_of_colors = np.array(
    [
        0xFFFF00FF,
        0x00FF00FF,
        0xFF000088,
    ],
    np.uint32,
)

p = figure(title="Specifying colors")

# plot glyphs
p.line(x, y1, line_color=single_color)
p.circle(x, y2, radius=0.12, color=list_of_colors)
p.triangle(x, y3, size=30, fill_color=numpy_array_of_colors)

show(p)
