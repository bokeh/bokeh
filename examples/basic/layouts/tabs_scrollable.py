""" Example demonstrating scrollable tabs when there are many tabs.
"""
from math import ceil

from bokeh.models import TabPanel
from bokeh.models.layouts import Tabs
from bokeh.palettes import Inferno256
from bokeh.plotting import figure, show

N = 20
step = ceil(len(Inferno256)/N)

tab_panels = []

for i in range(N):
    p = figure(width=400, height=400, title=f"Plot {i+1}")
    p.scatter(
        [1, 2, 3, 4, 5], [i+1, i+2, i+3, i+4, i+5],
        size=20, color=Inferno256[(N-1-i)*step], alpha=0.5, marker="circle",
    )

    tab = TabPanel(child=p, title=f"Tab {i+1}")
    tab_panels.append(tab)

tabs = Tabs(tabs=tab_panels, width=600, resizable=True)

show(tabs)
