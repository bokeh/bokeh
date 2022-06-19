from bokeh.io import show
from bokeh.palettes import Cividis, Cividis256, cividis
from bokeh.plotting import figure, from_contour
import numpy as np

x, y = np.meshgrid(np.linspace(0, 10, 20), np.linspace(0, 6, 10))
z = np.sin(x)*np.cos(y)
nlevels = 11 #9
levels = np.linspace(-1.0, 1.0, nlevels)


def colors(n):
    ret = ["darkorange", "wheat"]*(n // 2)
    if n % 2 == 1:
        ret.append(ret[0])
    return ret


# All of these work.
#fill_color = "orange"  # Single color
#fill_color = Cividis[nlevels-1]  # Correct number of colors
#fill_color = Cividis256  # Fixed number of colors to interpolate
#fill_color = Cividis  # Palette collection, dict that is indexed by int
fill_color = cividis  # Function that takes an int and returns a Palette
#fill_color = colors  # Callback that takes int and returns sequence of colors (or one color)


fig = figure(width=600, height=400)
contour_renderer = from_contour(
    x, y, z, levels,
    fill_color=fill_color,
    #fill_alpha=0.7,
    #fill_color=["blue"]*(nlevels-1), fill_alpha=np.linspace(0.3, 1.0, nlevels-1).tolist(),
    #line_color="green",
    line_color=["oldlace"]*5 + ["black"] + ["red"]*5,
    #line_color=colors(nlevels),
    line_width=2,
    line_dash=["solid"]*6 + ["dashed"]*5,
    hatch_pattern=["x"]*5 + [""]*5,
    hatch_color="white",
    hatch_alpha=0.3,
)
fig.renderers.append(contour_renderer)

colorbar = contour_renderer.color_bar() #extra kwargs?????)
fig.add_layout(colorbar, 'right')

show(fig)
