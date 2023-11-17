from bokeh import palettes
from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import PaletteSelect

items0 = [
    ("Magma", palettes.Magma[256]),
    ("Inferno", palettes.Inferno[256]),
    ("Plasma", palettes.Plasma[256]),
    ("Viridis", palettes.Viridis[256]),
    ("Cividis", palettes.Cividis[256]),
    ("Turbo", palettes.Turbo[256]),
]

items1 = [
    ("YlGn", palettes.YlGn[9]),
    ("YlGnBu", palettes.YlGnBu[9]),
    ("GnBu", palettes.GnBu[9]),
    ("BuGn", palettes.BuGn[9]),
    ("PuBuGn", palettes.PuBuGn[9]),
    ("PuBu", palettes.PuBu[9]),
    ("BuPu", palettes.BuPu[9]),
    ("RdPu", palettes.RdPu[9]),
    ("PuRd", palettes.PuRd[9]),
    ("OrRd", palettes.OrRd[9]),
    ("YlOrRd", palettes.YlOrRd[9]),
    ("YlOrBr", palettes.YlOrBr[9]),
    ("Purples", palettes.Purples[256]),
    ("Blues", palettes.Blues[256]),
    ("Greens", palettes.Greens[256]),
    ("Oranges", palettes.Oranges[256]),
    ("Reds", palettes.Reds[256]),
    ("Greys", palettes.Greys[256]),
    ("PuOr", palettes.PuOr[11]),
    ("BrBG", palettes.BrBG[11]),
    ("PRGn", palettes.PRGn[11]),
    ("PiYG", palettes.PiYG[11]),
    ("RdBu", palettes.RdBu[11]),
    ("RdGy", palettes.RdGy[11]),
    ("RdYlBu", palettes.RdYlBu[11]),
    ("Spectral", palettes.Spectral[11]),
    ("RdYlGn", palettes.RdYlGn[11]),
    ("Accent", palettes.Accent[8]),
    ("Dark2", palettes.Dark2[8]),
    ("Paired", palettes.Paired[12]),
    ("Pastel1", palettes.Pastel1[9]),
    ("Pastel2", palettes.Pastel2[8]),
    ("Set1", palettes.Set1[9]),
    ("Set2", palettes.Set2[8]),
    ("Set3", palettes.Set3[12]),
]

color_map0 = PaletteSelect(title="Choose palette:", value="Turbo", items=items0)
color_map1 = PaletteSelect(title="Choose palette (grid):", value="PuBu", items=items1, ncols=3)
color_map2 = PaletteSelect(title="Choose palette (disabled):", value="PuBu", items=items1, disabled=True)

layout = column(color_map0, color_map1, color_map2)
show(layout)
