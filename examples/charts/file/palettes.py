import numpy as np

from collections import OrderedDict

from bokeh.charts import Area, show
from bokeh.layouts import gridplot
from bokeh.palettes import (Blues9, BrBG9, BuGn9, BuPu9, GnBu9, Greens9,
                            Greys9, OrRd9, Oranges9, PRGn9, PiYG9, PuBu9,
                            PuBuGn9, PuOr9, PuRd9, Purples9, RdBu9, RdGy9,
                            RdPu9, RdYlBu9, RdYlGn9, Reds9, Spectral9, YlGn9,
                            YlGnBu9, YlOrBr9, YlOrRd9, Inferno9, Magma9,
                            Plasma9, Viridis9)

standard_palettes = OrderedDict([("Blues9", Blues9), ("BrBG9", BrBG9),
                                 ("BuGn9", BuGn9), ("BuPu9", BuPu9),
                                 ("GnBu9", GnBu9), ("Greens9", Greens9),
                                 ("Greys9", Greys9), ("OrRd9", OrRd9),
                                 ("Oranges9", Oranges9), ("PRGn9", PRGn9),
                                 ("PiYG9", PiYG9), ("PuBu9", PuBu9),
                                 ("PuBuGn9", PuBuGn9), ("PuOr9", PuOr9),
                                 ("PuRd9", PuRd9), ("Purples9", Purples9),
                                 ("RdBu9", RdBu9), ("RdGy9", RdGy9),
                                 ("RdPu9", RdPu9), ("RdYlBu9", RdYlBu9),
                                 ("RdYlGn9", RdYlGn9), ("Reds9", Reds9),
                                 ("Spectral9", Spectral9), ("YlGn9", YlGn9),
                                 ("YlGnBu9", YlGnBu9), ("YlOrBr9", YlOrBr9),
                                 ("YlOrRd9", YlOrRd9), ("Inferno9", Inferno9),
                                 ("Magma9", Magma9), ("Plasma9", Plasma9),
                                 ("Viridis9", Viridis9)])


def create_area_chart(data, palette):
    return Area(data,
                title=palette,
                stack=True,
                palette=standard_palettes.get(palette),
                legend=None,
                xlabel='',
                ylabel='',
                xgrid=False,
                ygrid=False,
                tools='')

data = np.random.random_integers(low=5, high=13, size=[9, 20])
area_charts = [create_area_chart(data, palette) for palette in standard_palettes.keys()]
grid = gridplot(area_charts, ncols=3, plot_width=300, plot_height=300)
show(grid)
