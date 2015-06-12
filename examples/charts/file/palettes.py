from collections import OrderedDict

import numpy as np

from bokeh.charts import Area, output_file, gridplot, show
from bokeh.palettes import (Blues9, BrBG9, BuGn9, BuPu9, GnBu9, Greens9,
                            Greys9, OrRd9, Oranges9, PRGn9, PiYG9, PuBu9,
                            PuBuGn9, PuOr9, PuRd9, Purples9, RdBu9, RdGy9,
                            RdPu9, RdYlBu9, RdYlGn9, Reds9, Spectral9, YlGn9,
                            YlGnBu9, YlOrBr9, YlOrRd9)

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
                                ("YlOrRd9", YlOrRd9)])

def create_area_chart(data, palette):
    _chart_styling = dict(height=300,
                          width=300,
                          xgrid=False,
                          ygrid=False,
                          tools=None)
    return Area(data,
                title=palette,
                stacked=True,
                palette=standard_palettes.get(palette),
                **_chart_styling)

data = np.random.random_integers(low=5, high=13, size=[9,20])

area_charts = [create_area_chart(data, palette)
               for palette
               in standard_palettes.keys()]

area_charts = np.reshape(area_charts, newshape=[9,3]).tolist()

output_file('palettes.html', title='palettes.py example')
show(gridplot(area_charts))
