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

from .mpl import MPLExporter
from .objects import GridPlot
from .plotting import (get_config, output_file, output_notebook, output_server,
                       session, show)

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
                output_server("unnamed", url=server)
            else:
                output_notebook(url=server)
        elif notebook:
            output_notebook()
    else:
        output_file("Unnamed.html")

    sess = session()

    plots = []

    mplexporter = MPLExporter()

    for axes in fig.axes:
        plot = mplexporter.axes2plot(axes, xkcd)
        plots.append(plot)

    if len(fig.axes) <= 1:
        get_config()["curplot"] = plots[0]
        sess.add_plot(plots[0])
    else:
        (a, b, c) = fig.axes[0].get_geometry()
        p = np.array(plots)
        n = np.resize(p, (a, b))
        grid = GridPlot(children=n.tolist())
        get_config()["curplot"] = grid
        sess.add_plot(grid)

    show()
