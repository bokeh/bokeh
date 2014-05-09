""" Compatilibity layer for matplotlib.pyplot objects

This file defines the `show_bokeh` function used by Bokeh to display Matplotlib
figures. For more information about how to use it, just check the relevant
docstring.
"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENCE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import numpy as np

from .mplexporter.exporter import Exporter

from .mpl import BokehRenderer
from .objects import GridPlot
from .plotting import (
    curdoc, output_file, output_notebook, output_server, show
)

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def show_bokeh(fig=None, name=None, server=None, notebook=False, xkcd=False):
    """ Uses bokeh to display a Matplotlib Figure.

    You can store a bokeh plot in a standalone HTML file, as a document in
    a Bokeh plot server, or embedded directly into an IPython Notebook
    output cell.

    Parameters
    ----------

    fig: matplotlib.figure.Figure
        The figure to display. If None or not specified, then the current figure
        will be used.

    name: str (default=None)
        If this option is provided, then the Bokeh figure will be saved into
        this HTML file, and then a web browser will used to display it.

    server: str (default=None)
        Fully specified URL of bokeh plot server. Default bokeh plot server
        URL is "http://localhost:5006" or simply "deault"

    notebook: bool (default=False)
        Return an output value from this function which represents an HTML
        object that the IPython notebook can display. You can also use it with
        a bokeh plot server just specifying the URL.

    xkcd: bool (default=False)
        If this option is True, then the Bokeh figure will be saved with a
        xkcd style.
    """

    if fig is None:
        import matplotlib.pyplot as plt
        fig = plt.gcf()

    if any([name, server, notebook]):
        if name:
            if not server:
                filename = name + ".html"
                output_file(filename)
            else:
                output_server(name, url=server)
        elif server:
            if not notebook:
                output_server("unnameuuuuuuuuuuuuuud", url=server)
            else:
                output_notebook(url=server)
        elif notebook:
            output_notebook()
    else:
        output_file("Unnamed.html")

    doc = curdoc()

    renderer = BokehRenderer(xkcd)
    exporter = Exporter(renderer)

    exporter.run(fig)

    doc._current_plot = renderer.fig # TODO (bev) do not rely on private attrs
    doc.add(renderer.fig)

    show()