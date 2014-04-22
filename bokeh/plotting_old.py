""" Command-line driven plotting functions, a la Matplotlib  / Matlab / etc.
"""
from __future__ import absolute_import, print_function

from functools import wraps
import itertools
import os
import requests
import time
import warnings
import logging
logger = logging.getLogger(__name__)

from six import iteritems

from . import glyphs, browserlib, serverconfig
from .objects import (ColumnDataSource, Glyph, Grid, GridPlot, Legend, Axis,
                      ServerDataSource)

from .plotting_helpers import (get_default_color, get_default_alpha,
        _glyph_doc, _match_data_params, _update_plot_data_ranges,
        _materialize_colors_and_alpha, _get_legend, _make_legend,
        _get_select_tool, _new_xy_plot, _handle_1d_data_args, _list_attr_splat)
from .session import (HTMLFileSession, PlotServerSession, NotebookSession,
        NotebookServerSession)
from . import  settings
from .palettes import brewer

DEFAULT_SERVER_URL = "http://localhost:5006/"

class _AttrDict(dict):
    def _bad_attr(self, name):
        raise ValueError("'%s' is not a valid configuration option, allowed options are %s" % (name, ", ".join(self.keys())))

    def __getattr__(self, name):
        if name in self:
            return self[name]
        else:
            self._bad_attr(name)

    def __setattr__(self, name, value):
        if name in self:
            self[name] = value
        else:
            self._bad_attr(name)

_config = _AttrDict()

def get_config():
    try:
        from flask import request
        config = request.bokeh_config
        logger.debug("returning config from flask request")
        return config
    except (ImportError, RuntimeError, AttributeError):
        logger.debug("returning global config from bokeh.plotting")
        return _config
def make_config():
    return _AttrDict(
        # The current output mode.  Valid combinations:
        #   type       | url
        #   -----------+--------------
        #   "file"     | output_file = filename
        #   "server"   | output_url = server URL
        #   "notebook" | output_url = (None, server_URL)
        output_type = None,
        output_url = None,
        output_file = None,
        plotserver_url = DEFAULT_SERVER_URL,

        # Configuration options for "file" output mode
        autosave = False,
        file_resources = "inline",
        file_rootdir = None,

        #Configuration options for "server" mode
        autostore = True,

        # The currently active Session object
        session = None,

        # Current plot or "figure"
        curplot = None,

        # hold state
        hold = False)

def _set_config():
    global _config
    _config = make_config()
_set_config()

def _get_plot(kwargs):
    plot = kwargs.pop("plot", None)
    if not plot:
        if get_config().hold and get_config().curplot:
            plot = get_config().curplot
        else:
            plot_kwargs = get_config().pop('figure_kwargs', {})
            plot_kwargs.update(kwargs)
            plot = _new_xy_plot(**plot_kwargs)
    return plot

def plothelp():
    """ Prints out a list of all plotting functions.  Information on each
    function is available in its docstring, and can be accessed via the
    normal Python help() function, e.g. help(rect).
    """

    helpstr = """

    Plotting
    --------
    scatter(data, marker="circle", ...)
        scatter plot of some data, with a particular marker type

    get_plot()
        returns the current :class:`Plot <bokeh.objects.Plot>` object

    Other Renderers
    ---------------
    annular_wedge
    annulus
    arc
    bezier
    circle
    line
    multi_line
    oval
    patch
    patches
    quad
    quadratic
    rect
    segment
    square
    wedge

    Axes, Annotations, Legends
    --------------------------
    get_legend(plot)
        returns the Legend object for the given plot, whose attributes can
        then be manipulated directly

    make_legend(plot)
        creates a new legend for the plot, and also returns it

    xaxis
        returns the X axis or list of X axes on the current plot

    yaxis
        returns the Y axis or list of Y axes on the current plot

    Display & Session management
    ----------------------------
    output_notebook(url=None, docname=None)
        sets IPython Notebook output mode

    output_server(docname, url="default", ...)
        sets plot server output mode

    output_file(filename, ...)
        sets HTML file output mode

    hold()
        turns "hold" on or off. When hold is on, each new plotting call
        adds the renderer to the existing plot.

    figure()
        clears the "current plot" object on the session

    show(browser=None, new="tab")
        forces the plot to be rendered to the currently set output device
        or mode (e.g. static HTML file, IPython notebook, plot server)

    save(filename=None)
        Updates the output HTML file or forces an upload of plot data
        to the server
    """
    print(helpstr)

def session():
    """ Get the current session.

    Returns:
        session : the current :class:`session <bokeh.session.Session>` object
    """
    return get_config().session

###NEEDS A BOKEH CLOUD VERSION AS WELL
def output_notebook(url=None, server=None, name=None, docname=None):
    """ Sets the output mode to emit HTML objects suitable for embedding in
    IPython notebook.  If URL is "default", then uses the default plot
    server URLs etc. for Bokeh.  If URL is explicitly set to None, then data,
    scripts, and CSS are all embedded into the notebook.

    Generally, this should be called at the beginning of an interactive session
    or the top of a script.
    """

    notebook = False
    try:
        from IPython import get_ipython
        notebook = 'notebook' in get_ipython().config['IPKernelApp']['parent_appname']
    except:
        pass
    if not notebook:
        raise RuntimeError('output_notebook() called outside of IPython notebook 1.x. When not running inside an IPython notebook 1.x, please use output_file() or output_server()')

    if url is None and name is None and server is None:
        session = NotebookSession()
        session.notebooksources()
    else:
        if url == "default":
            real_url = get_config().plotserver_url
        else:
            real_url = url
        if name is None:
            name = real_url
        if not server:
            server = serverconfig.Server(name=name, root_url=real_url)
        get_config().output_url = server.root_url
        get_config().output_type = "server"
        get_config().output_file = None
        try:
            session = NotebookServerSession(server_config=server)
        except requests.exceptions.ConnectionError:
            print("Cannot connect to Bokeh server. (Not running?) To start the "
                  "Bokeh server execute 'bokeh-server'")
            import sys
            sys.exit(1)
        if docname is None:
            docname = "IPython Session at %s" % time.ctime()
        session.use_doc(docname)
        session.notebook_connect()
    get_config().output_type = "notebook"
    get_config().output_file = None
    get_config().session = session

def output_cloud(docname):
    output_server(docname, server=serverconfig.Cloud())

def output_server(docname, server=None, name=None, url="default", **kwargs):
    """ Sets the output mode to upload to a Bokeh plot server.

    Default bokeh server address is defined in DEFAULT_SERVER_URL.  Docname is
    the name of the document to store in the plot server.  If there is an
    existing document with this name, it will be overwritten.

    Additional keyword arguments like **username**, **userapikey**,
    and **base_url** can be supplied.
    Generally, this should be called at the beginning of an interactive session
    or the top of a script.

    if server is provided, use server
    otherwise use name
    finally fallback on url
    """
    if url == "default":
        real_url = get_config().plotserver_url
    else:
        real_url = url
    if name is None:
        name = real_url
    if not server:
        server = serverconfig.Server(name=name, root_url=real_url)
    get_config().output_url = server.root_url
    get_config().output_type = "server"
    get_config().output_file = None
    try:
        get_config().session = PlotServerSession(server_config=server)
    except requests.exceptions.ConnectionError:
        print("Cannot connect to Bokeh server. (Not running?) To start the "
              "Bokeh server execute 'bokeh-server'")
        import sys
        sys.exit(1)
    get_config().session.use_doc(docname)
    real_url = get_config().output_url
    print("Using plot server at", real_url + "bokeh;", "Docname:", docname)

def output_file(filename, title="Bokeh Plot", autosave=True, resources="inline", rootdir=None):
    """ Outputs to a static HTML file. WARNING: This file will be overwritten
    each time show() is invoked.

    If **autosave** is True, then every time plot() or one of the other
    visual functions is called, this causes the file to be saved. If it
    is False, then the file is only saved upon calling show().

    **resources** can be 'inline', 'cdn', 'relative(-dev)' or 'absolute(-dev)'.
    In the 'relative(-dev)' case, **rootdir** can be specified to indicate the
    base directory from which the path to the various static files should be
    computed.

    Generally, this should be called at the beginning of an interactive session
    or the top of a script.
    """
    _set_config()
    if os.path.isfile(filename):
        print("Session output file '%s' already exists, will be overwritten." % filename)
    session = HTMLFileSession(filename, title=title)
    get_config().update(dict(
        output_type = "file", output_file = filename, output_url = None,
        file_resources = resources, file_rootdir = rootdir, session = session))

def figure(**kwargs):
    """ Creates a new plot. All subsequent plotting commands will affect
    the new plot.
    """
    get_config().curplot = None
    get_config()["figure_kwargs"] = kwargs

def hold(value=True):
    """ Turns hold on or off

    When on, plotting functions do not create a new figure, but rather
    add renderers to the current existing plot.  (If no current plot exists,
    then a new one is created.

    Args:
        value (bool, optional) :  set the hold state, default is True
    """
    get_config().hold = value

def curplot():
    """ Returns a reference to the current plot, i.e. the most recently
    created plot

    Returns:
        plot: the current :class:`Plot <bokeh.objects.Plot>`
    """
    return get_config().curplot

def show(browser=None, new="tab", url=None):
    """ 'shows' the current plot, by auto-raising the window or tab
    displaying the current plot (for file/server output modes) or displaying
    it in an output cell (IPython notebook).

    Args:
        browser (str or None, optional) : browser to show with, defaults to None

            For systems that support it, the **browser** argument allows specifying
            which browser to display in, e.g. "safari", "firefox", "opera",
            "windows-default".  (See the webbrowser module documentation in the
            standard lib for more details.)
        new (str, optional) : new file output mode, defaults to "tab"

            For file-based output, opens or raises the browser window
            showing the current output file.  If **new** is 'tab', then
            opens a new tab. If **new** is 'window', then opens a new window.
    """
    output_type = get_config().output_type
    session = get_config().session

    # Map our string argument to the webbrowser.open argument
    new_param = {'tab': 2, 'window': 1}[new]
    controller = browserlib.get_browser_controller(browser=browser)
    if output_type == "file":
        session.save(resources=get_config().file_resources, rootdir=get_config().file_rootdir)
        controller.open("file://" + os.path.abspath(get_config().output_file), new=new_param)
    elif output_type == "server":
        session.store_all()
        if url:
            controller.open(url, new=new_params)
        else:
            controller.open(get_config().output_url + "/bokeh", new=new_param)
    elif output_type == "notebook":
        session.show(curplot())

def save(filename=None):
    """ Updates the file or plot server that contains this plot.

    For file-based output, this will save the plot to the given filename.
    For plot server-based output, this will upload all the plot objects
    up to the server.

    Args:
        filename (str or None, optional) : filename to save document under, defaults to None
            if `filename` is None, the current session filename is used.

    """
    session = get_config().session
    if get_config().output_type == "file":
        if filename is not None:
            oldfilename = session.filename
            session.filename = filename
        try:
            session.save(resources=get_config().file_resources, rootdir=get_config().file_rootdir)
        finally:
            if filename is not None:
                session.filename = oldfilename
    elif get_config().output_type == "server":
        session.plotcontext._dirty = True
        session.store_all()
    else:
        warnings.warn("save() only performs on file- and server-based output modes.")



_marker_types = {
    "asterisk": asterisk,
    "circle": circle,
    "circle_cross": circle_cross,
    "circle_x": circle_x,
    "cross": cross,
    "diamond": diamond,
    "diamond_cross": diamond_cross,
    "inverted_triangle": inverted_triangle,
    "square": square,
    "square_x": square_x,
    "square_cross": square_cross,
    "triangle": triangle,
    "x": x,
    "*": asterisk,
    "+": cross,
    "o": circle,
    "ox": circle_x,
    "o+": circle_cross,
}

def markers():
    """ Prints a list of valid marker types for scatter()
    """
    print(list(sorted(_marker_types.keys())))

_color_fields = set(["color", "fill_color", "line_color"])
_alpha_fields = set(["alpha", "fill_alpha", "line_alpha"])

def scatter(*args, **kwargs):
    """ Creates a scatter plot of the given x and y items.

    Args:
        *args : The data to plot.  Can be of several forms:

            (X, Y)
                Two 1D arrays or iterables
            (XNAME, YNAME)
                Two bokeh DataSource/ColumnsRef

        marker (str, optional): a valid marker_type, defaults to "circle"
        color (color value, optional): shorthand to set both fill and line color

    All the :ref:`userguide_line_properties` and :ref:`userguide_fill_properties` are
    also accepted as keyword parameters.

    Examples:

            >>> scatter([1,2,3],[4,5,6], fill_color="red")
            >>> scatter("data1", "data2", source=data_source, ...)

    """
    session_objs = []   # The list of objects that need to be added

    ds = kwargs.get("source", None)
    names, datasource = _handle_1d_data_args(args, datasource=ds)
    if datasource != ds:
        session_objs.append(datasource)

    markertype = kwargs.get("marker", "circle")

    # TODO: How to handle this? Just call curplot()?
    if not len(_color_fields.intersection(set(kwargs.keys()))):
        kwargs['color'] = get_default_color()
    if not len(_alpha_fields.intersection(set(kwargs.keys()))):
        kwargs['alpha'] = get_default_alpha()

    plots = []
    for yname in names[1:]:
        if markertype not in _marker_types:
            raise RuntimeError("Invalid marker type '%s'. Use markers() to see a list of valid marker types." % markertype)
        plots.append(_marker_types[markertype](*args, **kwargs))
    if len(plots) == 1:
        return plots[0]
    else:
        return plots

@visual
def gridplot(plot_arrangement, name=False):
    """ Generate a plot that arranges several subplots into a grid.

    Args:
        plot_arrangement (list[:class:`Plot <bokeh.objects.Plot>`]) : plots to arrange in a grid
        name (str) : name for this plot

    .. note:: `plot_arrangement` can be nested

    Returns:
        grid_plot: the current :class:`GridPlot <bokeh.objects.GridPlot>`
    """
    grid = GridPlot(children=plot_arrangement)
    if name:
        grid._id = name
    # Walk the plot_arrangement and remove them from the plotcontext,
    # so they don't show up twice
    session = get_config().session
    session.plotcontext.children = list(set(session.plotcontext.children) - \
                set(itertools.chain.from_iterable(plot_arrangement)))
    return grid, [grid]

def xaxis():
    """ Get the current axis objects

    Returns:
        Returns axis object or splattable list of axis objects on the current plot
    """
    p = curplot()
    if p is None:
        return None
    axis = [obj for obj in p.renderers if isinstance(obj, Axis) and obj.dimension==0]
    return _list_attr_splat(axis)

def yaxis():
    """ Get the current `y` axis object(s)

    Returns:
        Returns y-axis object or splattable list of y-axis objects on the current plot
    """
    p = curplot()
    if p is None:
        return None
    axis = [obj for obj in p.renderers if isinstance(obj, Axis) and obj.dimension==1]
    return _list_attr_splat(axis)

def axis():
    """ Get the current `x` axis object(s)

    Returns:
        Returns x-axis object or splattable list of x-axis objects on the current plot
    """
    return _list_attr_splat(xaxis() + yaxis())

def legend():
    """ Get the current :class:`legend <bokeh.objects.Legend>` object(s)

    Returns:
        Returns legend object or splattable list of legend objects on the current plot
    """
    p = curplot()
    if p is None:
        return None
    legends = [obj for obj in p.renderers if isinstance(obj, Legend)]
    return _list_attr_splat(legends)

def xgrid():
    """ Get the current `x` :class:`grid <bokeh.objects.Grid>` object(s)

    Returns:
        Returns legend object or splattable list of legend objects on the current plot
    """
    p = curplot()
    if p is None:
        return None
    grid = [obj for obj in p.renderers if isinstance(obj, Grid) and obj.dimension==0]
    return _list_attr_splat(grid)

def ygrid():
    """ Get the current `y` :class:`grid <bokeh.objects.Grid>` object(s)

    Returns:
        Returns y-grid object or splattable list of y-grid objects on the current plot
    """
    p = curplot()
    if p is None:
        return None
    grid = [obj for obj in p.renderers if isinstance(obj, Grid) and obj.dimension==1]
    return _list_attr_splat(grid)

def grid():
    """ Get the current :class:`grid <bokeh.objects.Grid>` object(s)

    Returns:
        Returns grid object or splattable list of grid objects on the current plot
    """
    return _list_attr_splat(xgrid() + ygrid())


if settings.pythonlib():
    logger.debug("importing %s", settings.pythonlib())
    __import__(settings.pythonlib())
