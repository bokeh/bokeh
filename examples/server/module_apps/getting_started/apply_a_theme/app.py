"""Style plots with an explicitly selected document theme."""

import numpy as np

from bokeh.plotting import figure
from bokeh.server.asgi import BokehASGI


def modify_document(doc):
    p = figure(width=800)
    props = dict(line_width=4, line_alpha=0.7)
    x = np.arange(-np.pi, np.pi, np.pi / 16)
    p.line(x, np.sin(x), color='yellow', legend_label='sin', **props)
    p.line(x, np.cos(x), color='red', legend_label='cos', **props)
    doc.add_root(p)
    doc.theme = 'dark_minimal'


app = BokehASGI(modify_document)
