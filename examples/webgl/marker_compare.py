""" Compare WebGL markers with canvas markers.

This covers all markers supported by scatter. The plots are put in tabs,
so that you can easily switch to compare positioning and appearance.

"""
from bokeh.plotting import show, output_file, figure
from bokeh.models.widgets import Tabs, Panel
from bokeh.sampledata.iris import flowers

def make_tab(title, marker, webgl):
    p = figure(title=title, webgl=webgl)
    p.scatter(flowers["petal_length"], flowers["petal_width"],
              color='blue', fill_alpha=0.2, size=12, marker=marker)
    return Panel(child=p, title=title)

markers = ['asterisk', 'circle', 'square', 'diamond',
           'triangle', 'inverted_triangle',
           'cross', 'circle_cross', 'square_cross', 'diamond_cross',
           'x', 'square_x',  'circle_x']

tabs = []
for marker in markers:
    tabs.append(make_tab(marker, marker, False))
    tabs.append(make_tab(marker + ' GL', marker, True))

output_file("marker_compare.html", title="Compare regular and WebGL markers")

show(Tabs(tabs=tabs))
