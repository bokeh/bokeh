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

from . import plotting
from . import mpl
from . import objects

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def show_bokeh(figure=None, filename=None, server=None, notebook=False, xkcd=False):
    """ Uses bokeh to display a Matplotlib Figure.

    You can store a bokeh plot in a standalone HTML file, as a document in
    a Bokeh plot server, or embedded directly into an IPython Notebook
    output cell.

    If you specify:     Result:

    filename            store into HTML file, display HTML file
    server              store into plot server, display plot server
    notebook=True       store into IPython Notebook cell
    notebook=True & server
                        store into plot server, then display into NB cell

    Parameters
    ----------

    @type figure: matplotlib.figure.Figure
        The figure to display. If None, then the current figure will be used.

    @type filename: str (default=None)
        If this option is provided, then the Bokeh figure will be saved into
        this HTML file, and then a web browser will used to display it.
        Should end in ".html".

    @type server: str (default=None)
        Fully specified URI of bokeh plot server.  Default bokeh plot server
        URL is "http://localhost:5006"

    @type notebook: bool (default=False)
        Return an output value from this function which represents an HTML
        object that the IPython notebook can display.  If this argument
        is False, then a new browser tab will be opened to display the
        bokeh-generated plot.

    @type xkcd: bool (default=False)
        If this option is True, then the Bokeh figure will be saved with a
        xkcd style.

    @rtype None
    """

    if figure is None:
        import matplotlib.pyplot as plt
        figure = plt.gcf()

    if notebook:
        plotting.output_notebook(url=server)

    elif server:
        plotting.output_server(url=server)

    elif filename:
        plotting.output_file(filename, resources="relative")

    session = plotting.session()

    plots = []

    for axes in figure.axes:
        plot = mpl.axes2plot(axes, xkcd)
        plots.append(plot)

    if len(figure.axes) <= 1:
        plotting.get_config()["curplot"] = plots[0]
        session.add_plot(plots[0])
    else:
        (a, b, c) = figure.axes[0].get_geometry()
        p = np.array(plots)
        n = np.resize(p, (a, b))
        grid = objects.GridPlot(children=n.tolist())
        plotting.get_config()["curplot"] = grid
        session.add_plot(grid)

    if filename:
        plotting.save()
    plotting.show()
