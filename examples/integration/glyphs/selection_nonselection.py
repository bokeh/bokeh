from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure
from bokeh.models import Selection

p = figure(x_range=(0, 6), y_range=(0, 7), width=600, height=600, toolbar_location=None)

def mkglyph(x, y, selection):
    r = p.circle(
        x, y,
        color='green',
        size=40,
        selection_color='red',
        selection_alpha=0.2,
        nonselection_color='black')
    r.data_source.selected = Selection(indices=selection)
    return r

mkglyph([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], selection=[1, 3, 4])
mkglyph([1, 2, 3, 4, 5], [2, 3, 4, 5, 6], selection=[])

save(p)
