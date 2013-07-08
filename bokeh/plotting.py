""" Command-line driven plotting functions, a la Matplotlib  / Matlab / etc.
"""
from collections import Iterable
from functools import wraps
from numbers import Number
import numpy as np
import os
import warnings

from .objects import (ColumnDataSource, DataSource, ColumnsRef, DataRange1d,
        Plot, GlyphRenderer, LinearAxis, Rule, PanTool, ZoomTool,
        PreviewSaveTool, ResizeTool, SelectionTool, BoxSelectionOverlay)
from .session import HTMLFileSession, PlotServerSession, NotebookSession
from . import glyphs

# A bunch of this stuff is copied from chaco.shell, because that layout is
# pretty reasonable.

def plothelp():
    """ Prints out a list of all plotting functions.  Information on each
    function is available in its docstring.
    """

    helpstr = """
    Renderers
    ---------
    scatter, line, bar, candle, hbar, imshow, contour, contourf

    Plotting
    --------
    plot
        plots some data, with options for line, scatter, bar
    pcolor
        plots some scalar data as a pseudocolor image
    loglog
        plots an x-y line or scatter plot on log-log scale
    semilogx
        plots an x-y line or scatter plot with a log x-scale
    semilogy
        plots an x-y line or scatter plot with a log y-scale
    #imread
    #    creates an array from an image file on disk

    Axes, Annotations, Legends
    --------------------------
    xaxis
        toggles the horizontal axis, sets the interval
    yaxis
        toggles the vertical axis, sets the interval
    xgrid
        toggles the grid running along the X axis
    ygrid
        toggles the grid running along the Y axis
    xtitle
        sets the title of a horizontal axis
    ytitle
        sets the title of a vertical axis
    xscale
        sets the tick scale system of the X axis
    yscale
        sets the tick scale system of the Y axis
    title
        sets the title of the plot

    Layout
    ------
    grid
        configures a grid plot

    Display & Session management
    ----------------------------
    show
        forces the plot to be rendered to the currently set output device
        or mode (e.g. static HTML file, IPython notebook, plot server)
    setoutput
        sets the output mode
    hold
        turns "hold" on or off
    """
    print helpstr


DEFAULT_SERVER_URL = "http://localhost:5006/"

_config = {
    # The current output mode.  Valid combinations:
    #   type       | url
    #   -----------+--------------
    #   "file"     | output_file = filename
    #   "server"   | output_url = server URL
    #   "notebook" | output_url = (None, server_URL)
    "output_type": None,
    "output_url": None,
    "output_file": None,
    "plotserver_url": DEFAULT_SERVER_URL,

    # Configuration options for "file" output mode
    "autosave": True,
    "file_js": "inline",
    "file_css": "inline",
    "file_rootdir": None,

    # The currently active Session object
    "session": None,

    # Current plot or "figure"
    "curplot": None,

    # hold state
    "hold": False,
    }


def output_notebook(url="default"):
    """ Sets the output mode to emit HTML objects suitable for embedding in
    IPython notebook.  If URL is "default", then uses the default plot
    server URLs etc. for Bokeh.  If URL is explicitly set to None, then data,
    scripts, and CSS are all embedded into the notebook.

    Generally, this should be called at the beginning of an interactive session
    or the top of a script.
    """
    if url == "default":
        _config["output_url"] = _config["plotserver_url"]
    else:
        _config["output_url"] = url
    _config["output_file"] = None
    _config["session"] = NotebookSession()

def output_server(docname, url="default", **kwargs):
    """ Sets the output mode to upload to a Bokeh plot server.

    Default bokeh server address is defined in DEFAULT_SERVER_URL.  Docname is
    the name of the document to store in the plot server.  If there is an
    existing document with this name, it will be overwritten.

    Additional keyword arguments like **username**, **userapikey**, 
    and **base_url** can be supplied.
    Generally, this should be called at the beginning of an interactive session
    or the top of a script.
    """
    if url == "default":
        _config["output_url"] = _config["plotserver_url"]
        url = _config["output_url"]
    else:
        _config["output_url"] = url
    _config["output_type"] = "server"
    _config["output_file"] = None
    kwargs.setdefault("username", "defaultuser")
    kwargs.setdefault("serverloc", url)
    kwargs.setdefault("userapikey", "nokey")
    _config["session"] = PlotServerSession(**kwargs)
    _config["session"].use_doc(docname)

def output_file(filename, autosave=True, js="inline", css="inline", 
                rootdir=None):
    """
    Outputs to a static HTML file. WARNING: This file will be overwritten
    each time show() is invoked.

    If **autosave** is True, then every time plot() or one of the other
    visual functions is called, this causes the file to be saved.  If it
    is False, then the file is only saved upon calling show().

    **js** and **css** can be "inline" or "relative". In the latter case,
    **rootdir** can be specified to indicate the base directory from which
    the path to the various static files should be computed.

    Generally, this should be called at the beginning of an interactive session
    or the top of a script.
    """
    
    if os.path.isfile(filename):
        warnings.warn("Session output file '%s' already exists, will be overwritten." % filename)
    session = HTMLFileSession(filename)
    if js == "relative":
        session.inline_js = False
    if css == "relative":
        session.inline_css = False
    if rootdir:
        session.rootdir = rootdir
    _config.update(dict(
        output_type = "file", output_file = filename, output_url= None,
        session = session))

def hold(val=None):
    """ Turns hold on or off.  When on, then does not create a new figure
    with each plotting command, but rather adds renderers to the current
    existing plot.  (If no "current figure" exists, then a new one is
    created.
    """
    if val is None:
        val = not _config["hold"]
    _config["hold"] = val

def show():
    output_type = _config["output_type"]
    session = _config["session"]
    if output_type == "file":
        session.save()
    elif output_type == "server":
        session.plotcontext._dirty = True
        session.store_all()

def save():
    """ Identical to show() for file based output mode.  Has no effect
    for other output backends.
    """
    if _config["output_type"] == "file":
        _config["session"].save()

def visual(func):
    """ Decorator to wrap functions that might create visible plot objects
    and need to be displayed or cause a refresh of the output.
    This takes care of updating the output whenever the function is changed.
    """
    @wraps(func)
    def wrapper(*args, **kw):
        output_type = _config["output_type"]
        output_url = _config["output_url"]
        session = _config["session"]

        retvals = func(*args, **kw)
        if len(retvals) == 1:
            plot = retvals
            session_objs = []
        else:
            plot, session_objs = retvals

        if (output_type == "notebook" and output_url is None):
            # embed it inline in IPython
            pass

        elif (output_type == "server") or \
                (output_type == "notebook" and output_url is not None):
            # push the plot data to a plot server
            if plot is not None:
                session.add(plot)
            if session_objs:
                session.add(*session_objs)
            session.plotcontext.children.append(plot)
            session.plotcontext._dirty = True
            session.store_all()

        else: # File output mode
            # Store plot into HTML file
            session.add(plot)
            if session_objs:
                session.add(*session_objs)
            if _config["autosave"]:
                session.save()
    return wrapper

@visual
def plot(*data, **kwargs):
    """ Create simple X vs. Y type of plots

    If data items are actual data containers, then new data sources will be
    created around them.  In order to share selection, pan & zoom, etc., 
    pass in previously-created datasource objects, or manually create data-
    source objects and pass those in to the call to plot().

    """

marker_glyph_map = {
        "circle": glyphs.Circle,
        "square": glyphs.Square,
        }

@visual
def scatter(*args, **kwargs):
    """ Creates a scatter plot of the given x & y items

    Parameters
    ----------
    *data : The data to plot.  Can be of several forms:
        (X, Y1, Y2, ...)
            A series of 1D arrays, iterables, or bokeh DataSource/ColumnsRef
        [[x1,y1], [x2,y2], .... ]
            An iterable of tuples
        NDarray (NxM)
            The first column is treated as the X, and all other M-1 columns
            are treated as separate Y series

    Style Parameters (specified by keyword)
    ---------------------------------------
    type : "circle", "square"
    color : color  # same as "fill"
    fill : color
    fill_alpha : 0.0 - 1.0
    line_color : color
    line_width : int >= 1
    line_alpha : 0.0 - 1.0
    line_cap : "butt", "join", "miter"

    Colors can be either one of the 147 named SVG colors, or a string
    representing a Hex color (e.g. "#FF32D0"), or a a 3-tuple of integers
    between 0 and 255.  (The latter will be converted into a hex color string.)

    Examples
    --------
        scatter([1,2,3,4,5,6])
        scatter([1,2,3],[4,5,6], fill="red")
        scatter(x_array, y_array, type="circle")
        scatter("data1", "data2", source=data_source, ...)

    """
    session_objs = []   # The list of objects that need to be added

    ds = kwargs.pop("source",None)
    names, datasource = _handle_1d_data_args(args, datasource=ds)
    if datasource != ds:
        session_objs.append(datasource)

    # If hold is on, then we will reuse the ranges of the current plot
    if _config["hold"]:
        plot = _config["curplot"]
    else:
        plot = _new_xy_plot(**kwargs)

    plot.x_range.sources.append(datasource.columns(names[0]))
    plot.y_range.sources.append(datasource.columns(*names[1:]))
    
    # TODO: Clean this up to handle dataspecs in general
    if "radius" in kwargs:
        r_data = kwargs.pop("radius")
        if isinstance(r_data, Iterable):
            r_name = datasource.add(r_data)
            kwargs["radius"] = r_name
    if "color" in kwargs:
        kwargs["fill"] = kwargs.pop("color")
    style = kwargs

    marker = kwargs.get("type", "circle")
    glyph_class = marker_glyph_map[marker]
    x_name = names[0]
    for name in names[1:]:
        glyph = glyph_class(x=x_name, y=name, **style)
        glyph_renderer = GlyphRenderer(data_source=datasource,
                            xdata_range = plot.x_range,
                            ydata_range = plot.y_range,
                            glyph = glyph)
        plot.renderers.append(glyph_renderer)

    # TODO: Figure out a better way to keep track of which objects on the
    # session need to be added to the session.
    session_objs.extend(plot.tools)
    session_objs.extend(plot.renderers)
    session_objs.extend([plot.x_range, plot.y_range])
    return plot, session_objs


def _new_xy_plot(x_range=None, y_range=None, tools="pan,zoom,save,resize,select", **kw):
    # Accept **kw to absorb other arguments which the actual factory functions
    # might pass in, but that we don't care about
    p = Plot()
    if x_range is None:
        x_range = DataRange1d()
    p.x_range = x_range
    if y_range is None:
        y_range = DataRange1d()
    p.y_range = y_range
    xaxis = LinearAxis(plot=p, dimension=0)
    yaxis = LinearAxis(plot=p, dimension=1)
    xgrid = Rule(plot=p, dimension=0)
    ygrid = Rule(plot=p, dimension=1)
    p.renderers.extend([xaxis, yaxis, xgrid, ygrid])

    tool_objs = []
    if "pan" in tools:
        tool_objs.append(PanTool(dataranges=[p.x_range, p.y_range], dimensions=["width","height"]))
    if "zoom" in tools:
        tool_objs.append(ZoomTool(dataranges=[p.x_range, p.y_range], dimensions=["width","height"]))
    if "save" in tools:
        tool_objs.append(PreviewSaveTool(plot=p))
    if "resize" in tools:
        tool_objs.append(ResizeTool(plot=p))
    if "select" in tools:
        select_tool = SelectionTool()
        tool_objs.append(select_tool)
        overlay = BoxSelectionOverlay(tool=select_tool)
        plot.renderers.append(overlay)
    p.tools.extend(tool_objs)
    return p


def _handle_1d_data_args(args, datasource=None):
    """ Returns a datasource and a list of names corresponding (roughly)
    to the input data.  If only a single array was given, and an index
    array was created, then the index's name is returned first.
    """
    arrays = []
    if datasource is None:
        datasource = ColumnDataSource()
    # First process all the arguments to homogenize shape.  After this
    # process, "arrays" should contain a uniform list of string/ndarray/iterable
    # corresponding to the inputs.
    for arg in args:
        if isinstance(arg, basestring):
            # This has to be handled before our check for Iterable
            arrays.append(arg)

        elif isinstance(arg, np.ndarray):
            if arg.ndim == 1:
                arrays.append(arg)
            else:
                arrays.extend(arg)
        
        elif isinstance(arg, Iterable):
            arrays.append(arg)

        elif isinstance(arg, Number):
            arrays.append([arg])

    # Now handle the case when they've only provided a single array of
    # inputs (i.e. just the values, and no x positions).  Generate a new
    # dummy array for this.
    if len(arrays) == 1:
        arrays.insert(0, np.arange(len(arrays[0])))

    # Now put all the data into a DataSource, or insert into existing one
    names = []
    for i, ary in enumerate(arrays):
        if isinstance(ary, basestring):
            name = ary
        else:
            if i == 0:
                name = datasource.add(ary, name="_autoindex")
            else:
                name = datasource.add(ary)
        names.append(name)
    return names, datasource

@visual
def semilogx(*data, **kwargs):
    # TODO: figure out the right kwarg to set
    kwargs["index_scale"] = "log"
    return plot(*data, **kwargs)

@visual
def semilogy(*data, **kwargs):
    # TODO: figure out the right kwarg to set
    kwargs["value_scale"] = "log"
    return plot(*data, **kwargs)


