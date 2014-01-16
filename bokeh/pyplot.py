""" Compatilibity layer for matplotlib.pyplot objects
"""

from . import plotting

from . import mplsupport

def show_bokeh(figure=None, filename=None, server=None, notebook=False):
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
        plotting.output_file(filename, js="relative", css="relative")

    session = plotting.session()

    for axes in figure.axes:
        plot = mplsupport.axes2plot(axes)
        plotting._config["curplot"] = plot  # need a better way to do this
        session.plotcontext.children.append(plot)
        # TODO: this should be obviated once Mateusz's auto-add PR is merged
        objects = [plot, plot.x_range, plot.y_range] + plot.data_sources + plot.renderers + \
                  plot.renderers + plot.tools + plot.axes
        session.add(*objects)

    if filename:
        plotting.save()
    plotting.show()
