"Supporting objects and functions to convert Matplotlib objects into Bokeh."
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from __future__ import absolute_import

from warnings import warn

import matplotlib.pyplot as plt

from .bokeh_exporter import BokehExporter
from .bokeh_renderer import BokehRenderer

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

def to_bokeh(fig=None, name=None, server=None, notebook=None, pd_obj=True, xkcd=False):
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
        this HTML file, and then a web browser will be used to display it.

    server: str (default=None)
        Fully specified URL of bokeh plot server. Default bokeh plot server
        URL is "http://localhost:5006" or simply "deault"

    notebook: bool (default=False)
        Return an output value from this function which represents an HTML
        object that the IPython notebook can display. You can also use it with
        a bokeh plot server just specifying the URL.

    pd_obj: bool (default=True)
        The implementation asumes you are plotting using the pandas.
        You have the option to turn it off (False) to plot the datetime xaxis
        with other non-pandas interfaces.

    xkcd: bool (default=False)
        If this option is True, then the Bokeh figure will be saved with a
        xkcd style.
    """

    if name is not None:
        warn("Use standard output_file(...) from bokeh.io")
    if server is not None:
        warn("Use standard output_server(...) from bokeh.io")
    if notebook is not None:
        warn("Use standard output_notebook() from bokeh.io")

    if fig is None:
        fig = plt.gcf()

    renderer = BokehRenderer(pd_obj, xkcd)
    exporter = BokehExporter(renderer)

    exporter.run(fig)

    return renderer.fig
