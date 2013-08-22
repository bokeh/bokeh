""" Command-line driven plotting functions, a la Matplotlib  / Matlab / etc.
"""
import copy
from collections import Iterable
from functools import wraps
from numbers import Number
import numpy as np
import os
import time
import warnings
import webbrowser

from .objects import (ColumnDataSource, DataSource, ColumnsRef, DataRange1d,
        Plot, GlyphRenderer, LinearAxis, Rule, PanTool, ZoomTool,
        PreviewSaveTool, ResizeTool, SelectionTool, BoxSelectionOverlay,
        Legend)
from .session import (HTMLFileSession, PlotServerSession, NotebookSession,
        NotebookServerSession)
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
    "autosave": False,
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


def output_notebook(url=None, docname=None):
    """ Sets the output mode to emit HTML objects suitable for embedding in
    IPython notebook.  If URL is "default", then uses the default plot
    server URLs etc. for Bokeh.  If URL is explicitly set to None, then data,
    scripts, and CSS are all embedded into the notebook.

    Generally, this should be called at the beginning of an interactive session
    or the top of a script.
    """
    if url is None:
        session = NotebookSession()
        session.notebooksources()
    else:
        if url == "default":
            real_url = _config["plotserver_url"]
        else:
            real_url = url
        _config["output_url"] = real_url
        session = NotebookServerSession(serverloc = real_url,
                    username = "defauluser", userapikey = "nokey")
        if docname is None:
            docname = "IPython Session at %s" % time.ctime()
        session.use_doc(docname)
        session.notebook_connect()
    _config["output_type"] = "notebook"
    _config["output_file"] = None
    _config["session"] = session

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
        real_url = _config["plotserver_url"]
    else:
        real_url = url
    _config["output_url"] = real_url
    _config["output_type"] = "server"
    _config["output_file"] = None
    kwargs.setdefault("username", "defaultuser")
    kwargs.setdefault("serverloc", real_url)
    kwargs.setdefault("userapikey", "nokey")
    _config["session"] = PlotServerSession(**kwargs)
    _config["session"].use_doc(docname)

    print "Using plot server at", real_url + "bokeh;", "Docname:", docname

def output_file(filename, title="Bokeh Plot", autosave=True, js="inline",
                css="inline", rootdir=None):
    """ Outputs to a static HTML file. WARNING: This file will be overwritten
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
        print "Session output file '%s' already exists, will be overwritten." % filename
    session = HTMLFileSession(filename, title=title)
    if js == "relative":
        session.inline_js = False
    if css == "relative":
        session.inline_css = False
    if rootdir:
        session.rootdir = rootdir
    _config.update(dict(
        output_type = "file", output_file = filename, output_url= None,
        session = session))

def figure():
    _config["curplot"] = None

def hold(val=None):
    """ Turns hold on or off.  When on, then does not create a new figure
    with each plotting command, but rather adds renderers to the current
    existing plot.  (If no "current figure" exists, then a new one is
    created.
    """
    if val is None:
        val = not _config["hold"]
    _config["hold"] = val

def curplot():
    """ Returns a reference to the current plot, i.e. the most recently
    created plot
    """
    return _config["curplot"]

def show(browser=None, new="tab"):
    """ 'shows' the current plot, by auto-raising the window or tab
    displaying the current plot (for file/server output modes) or displaying
    it in an output cell (IPython notebook).

    For file-based output, opens or raises the browser window showing the
    current output file.  If **new** is 'tab', then opens a new tab.
    If **new** is 'window', then opens a new window.

    For systems that support it, the **browser** argument allows specifying
    which browser to display in, e.g. "safari", "firefox", "opera",
    "windows-default".  (See the webbrowser module documentation in the
    standard lib for more details.)
    """
    output_type = _config["output_type"]
    session = _config["session"]
    session.save()
    # Map our string argument to the webbrowser.open argument
    new_param = {'tab': 2, 'window': 1}[new]
    if browser is not None:
        controller = webbrowser.get(browser)
    else:
        controller = webbrowser
    if output_type == "file":
        controller.open("file://" + os.path.abspath(_config["output_file"]),
                            new=new_param)
    elif output_type == "server":
        controller.open(_config["output_url"] + "/bokeh", new=new_param)

def save(filename=None):
    """ Updates the file or plot server that contains this plot.

    For file-based output, this will save the plot to the given filename.
    For plot server-based output, this will upload all the plot objects
    up to the server.
    """
    if _config["output_type"] == "file":
        session = _config["session"]
        if filename is not None:
            oldfilename = session.filename
            session.filename = filename
        try:
            session.save()
        finally:
            if filename is not None:
                session.filename = oldfilename
    elif _config["output_type"] == "server":
        session.plotcontext._dirty = True
        session.store_all()
    else:
        warnings.warn("save() does nothing for non-file-based output mode.")

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

        if plot is not None:
            session.add(plot)
            _config["curplot"] = plot

        if session_objs:
            session.add(*session_objs)

        #easier to always use plot context
        if plot not in session.plotcontext.children:
            session.plotcontext.children.append(plot)
        session.plotcontext._dirty = True
        plot._dirty = True
        if (output_type == "notebook" and output_url is None):
            return session.show(plot, *session_objs)

        elif (output_type == "server") or \
                (output_type == "notebook" and output_url is not None):
            # push the plot data to a plot server
            session.store_all()
            if output_type == "notebook":
                return session.show(plot, *session_objs)

        else: # File output mode
            # Store plot into HTML file
            if _config["autosave"]:
                session.save()
        return plot
    return wrapper

def glyph(argnames):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            datasource = kwargs.pop("source", ColumnDataSource())
            session_objs = [datasource]
            glyph_params = match_data_params(argnames, args, datasource)

            plot = get_plot(kwargs)
            x_data_fields = [glyph_params['x']['field']] if glyph_params['x']['units'] == 'data' else []
            y_data_fields = [glyph_params['y']['field']] if glyph_params['y']['units'] == 'data' else []
            update_plot_data_ranges(plot, datasource, x_data_fields, y_data_fields)

            if "color" in kwargs:
                color = kwargs.pop("color")
                kwargs["fill"] = color
                kwargs["line_color"] = color

            select_tool = get_select_tool(plot)
            legend_name = kwargs.pop("legend", None)
            kwargs.update(glyph_params)

            glyph = func(**kwargs)

            nonselection_glyph = glyph.clone()
            nonselection_glyph.fill_alpha = 0.1
            nonselection_glyph.line_alpha = 0.1

            glyph_renderer = GlyphRenderer(
                data_source = datasource,
                xdata_range = plot.x_range,
                ydata_range = plot.y_range,
                glyph=glyph,
                nonselection_glyph=nonselection_glyph,
                )

            if legend_name:
                legend = get_legend(plot)
                if not legend:
                    legend = make_legend(plot)
                mappings = legend.annotationspec.setdefault("legends", {})
                mappings.setdefault(legend_name, []).append(glyph_renderer)
                legend._dirty = True

            if select_tool :
                select_tool.renderers.append(glyph_renderer)
                select_tool._dirty = True

            plot.renderers.append(glyph_renderer)

            session_objs.extend(plot.tools)
            session_objs.extend(plot.renderers)
            session_objs.extend([plot.x_range, plot.y_range])

            return plot, session_objs

        return wrapper

    return decorator

marker_glyph_map = {
        "circle": glyphs.Circle,
        "square": glyphs.Square,
        }

def plot(*args, **kwargs):
    """ Creates a line plot of the given x & y items

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
    Examples
    --------
        plot([1,2,3,4,5,6])
        plot([1,2,3],[4,5,6], fill="red")
        plot(x_array, y_array, type="circle")
        plot("data1", "data2", source=data_source, ...)

    """
    session_objs = []   # The list of objects that need to be added

    ds = kwargs.pop("source", None)
    names, datasource = _handle_1d_data_args(args, datasource=ds)
    if datasource != ds:
        session_objs.append(datasource)

    # If hold is on, then we will reuse the ranges of the current plot
    plot = get_plot(kwargs)
    if not len(color_fields.intersection(set(kwargs.keys()))):
        kwargs['color'] = get_default_color(plot)
    points = kwargs.pop("points", True)
    marker = kwargs.get("type", "circle")
    x_name = names[0]
    for name in names[1:]:
        _glyph_plot("line", x_name, name, plot, datasource, **kwargs)
        if points:
            _glyph_plot(marker, x_name, name, plot, datasource, **kwargs)
    return plot

color_fields = set(["color", "fill_color", "line_color"])
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

    ds = kwargs.pop("source", None)
    names, datasource = _handle_1d_data_args(args, datasource=ds)
    if datasource != ds:
        session_objs.append(datasource)

    # If hold is on, then we will reuse the ranges of the current plot
    plot = get_plot(kwargs)
    marker = kwargs.get("type", "circle")
    x_name = names[0]

    if not len(color_fields.intersection(set(kwargs.keys()))):
        kwargs['color'] = get_default_color(plot)
    for name in names[1:]:
        _glyph_plot(marker, x_name, name, plot, datasource, **kwargs)
    return plot

def _glyph_plot(plottype, x_name, y_name, plot, datasource, **kwargs):
    #copy kwargs, because we pop things off inside these functions
    kwargs = copy.copy(kwargs)
    if plottype == "circle":
        circles(x_name, y_name,
                kwargs.pop('radius', 4),
                source=datasource,
                plot=plot, **kwargs)
    elif plottype == "rect":
        rects(x_name, y_name,
              kwargs.pop('width', 8),
              kwargs.pop('height', 4),
              angle=kwargs.get('angle', 0),
              source=datasource,
              plot=plot, **kwargs)
    elif plottype == "square":
        squares(x_name, y_name,
              kwargs.pop('width', 4),
              angle=kwargs.pop('angle', 0),
              source=datasource,
              plot=plot, **kwargs)
    elif plottype == "line":
        line(x_name, y_name, plot=plot, source=datasource, **kwargs)


def update_plot_data_ranges(plot, datasource, xcols, ycols):
    """
    Parmeters
    ---------
    plot : plot
    datasource : datasource
    xcols : names of columns that are in the X axis
    ycols : names of columns that are in the Y axis
    """
    if isinstance(plot.x_range, DataRange1d):
        x_column_ref = [x for x in plot.x_range.sources if x.source == datasource]
        if len(x_column_ref) > 0:
            x_column_ref = x_column_ref[0]
            for cname in xcols:
                if cname not in x_column_ref.columns: 
                    x_column_ref.columns.append(cname)
        else:
            plot.x_range.sources.append(datasource.columns(*xcols))
        plot.x_range._dirty = True
        
    if isinstance(plot.y_range, DataRange1d):            
        y_column_ref = [y for y in plot.y_range.sources if y.source == datasource]
        if len(y_column_ref) > 0:
            y_column_ref = y_column_ref[0]
            for cname in ycols:
                if cname not in y_column_ref.columns:
                    y_column_ref.columns.append(cname)
        else:
            plot.y_range.sources.append(datasource.columns(*ycols))
        plot.y_range._dirty = True

def match_data_params(names, vals, datasource):
    """
    Parameters
    ---------
    names : names of glyph attributes (x,y,width,height, etc...)
    vals : values of glyph attributes
    datasource: datasource

    Returns
    ---------
    glyph_params : dict of params that should be in the glyphspec
    """
    glyph_params = {}
    for var, val in zip(names, vals):
        if isinstance(val, basestring):
            if val not in datasource.column_names:
                raise RuntimeError("Column name '%s' does not appear in data source %r" % (val, datasource))
            glyph_val = {'field' : val, 'units' : 'data'}
        elif isinstance(val, np.ndarray):
            if val.ndim != 1:
                raise RuntimeError("Columns need to be 1D (%s is not)" % var)
            datasource.add(val, name=var)
            glyph_val = {'field' : var, 'units' : 'data'}
        elif isinstance(val, Iterable):
            datasource.add(val, name=var)
            glyph_val = {'field' : var, 'units' : 'data'}
        elif isinstance(val, Number):
            glyph_val = {'field' : None, 'default' : val, 'units' : 'screen'}
        else:
            raise RuntimeError("Unexpected column type: %s" % type(val))
        glyph_params[var] = glyph_val
    return glyph_params

def get_select_tool(plot):
    """returns select tool on a plot, if it's there
    """
    select_tool = [x for x in plot.tools if x.__view_model__ == "SelectionTool"]
    if len(select_tool) > 0:
        select_tool = select_tool[0]
    else:
        select_tool = None
    return select_tool

def get_default_color(plot):
    colors = [
      "#1f77b4",
      "#ff7f0e", "#ffbb78",
      "#2ca02c", "#98df8a",
      "#d62728", "#ff9896",
      "#9467bd", "#c5b0d5",
      "#8c564b", "#c49c94",
      "#e377c2", "#f7b6d2",
      "#7f7f7f",
      "#bcbd22", "#dbdb8d",
      "#17becf", "#9edae5"
    ]
    renderers = plot.renderers
    renderers = [x for x in renderers if x.__view_model__ == "GlyphRenderer"]
    num_renderers = len(renderers)
    return colors[num_renderers]


@visual
@glyph(['x', 'y', 'inner_radius', 'outer_radius', 'start_angle', 'end_angle'])
def annular_wedge(**kwargs):
    return glyphs.AnnularWedge(**kwargs)

@visual
@glyph(['x', 'y', 'inner_radius', 'outer_radius'])
def annulus(**kwargs):
    return glyphs.Annulus(**kwargs)

@visual
@glyph(['x0', 'x1', 'y0', 'y1', 'cx0', 'cy0', 'cx1', 'cy1'])
def bezier(**kwargs):
    return glyphs.Bezier(**kwargs)

@visual
@glyph(['x', 'y', 'radius'])
def circles(**kwargs):
    return glyphs.Circle(**kwargs)

@visual
@glyph(['x', 'y'])
def line(**kwargs):
    return glyphs.Line(**kwargs)

@visual
@glyph(['xs', 'ys'])
def multi_line(**kwargs):
    return glyphs.MultiLine(**kwargs)

@visual
@glyph(['x', 'y', 'width', 'height', 'angle'])
def oval(**kwargs):
    return glyphs.Oval(**kwargs)

@visual
@glyph(['x', 'y', 'angle', 'length'])
def ray(**kwargs):
    return glyphs.Ray(**kwargs)

@visual
@glyph(['left', 'right', 'top', 'bottom'])
def quad(**kwargs):
    return glyphs.Quad(**kwargs)

@visual
@glyph(['x0', 'x1', 'y0', 'y1', 'cx', 'cy'])
def quad_curve(**kwargs):
    return glyphs.QuadCurve(**kwargs)

@visual
@glyph(['x', 'y', 'width', 'height', 'angle'])
def rects(**kwargs):
    return glyphs.Rect(**kwargs)

@visual
@glyph(['x0', 'y0', 'x1', 'y1'])
def segment(**kwargs):
    return glyphs.Segment(**kwargs)

@visual
@glyph(['x', 'y', 'size', 'angle'])
def squares(**kwargs):
    return glyphs.Square(**kwargs)

@visual
@glyph(['x', 'y', 'radius', 'start_angle', 'end_angle'])
def wedge(**kwargs):
    return glyphs.Wedge(**kwargs)


def get_plot(kwargs):
    plot = kwargs.pop("plot", None)
    if not plot:
        if _config["hold"] and _config["curplot"]:
            plot = _config["curplot"]
        else:
            plot = _new_xy_plot(**kwargs)
    return plot

def get_legend(plot):
    legend = [x for x in plot.renderers if x.__view_model__ == "Legend"]
    if len(legend) > 0:
        legend = legend[0]
    else:
        legend = None
    return legend

def make_legend(plot):
    legend = Legend(plot=plot)
    plot.renderers.append(legend)
    plot._dirty = True
    return legend


def _new_xy_plot(x_range=None, y_range=None, tools="pan,zoom,save,resize,select,previewsave", plot_width=None, plot_height=None, **kw):
    # Accept **kw to absorb other arguments which the actual factory functions
    # might pass in, but that we don't care about
    p = Plot()
    p.title = kw.pop("title", "Plot")
    if plot_width is not None:
        p.width = plot_width
    elif "width" in kw:
        p.width = kw["width"]
    if plot_height is not None:
        p.height = plot_height
    elif "height" in kw:
        p.height = kw["height"]

    if x_range is None:
        x_range = DataRange1d()
    p.x_range = x_range
    if y_range is None:
        y_range = DataRange1d()
    p.y_range = y_range
    xaxis = LinearAxis(plot=p, dimension=0, location="min", bounds="auto")
    yaxis = LinearAxis(plot=p, dimension=1, location="min", bounds="auto")
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
        p.renderers.append(overlay)
    if "previewsave" in tools:
        previewsave_tool = PreviewSaveTool(plot=p)
        tool_objs.append(previewsave_tool)
    p.tools.extend(tool_objs)
    return p


def _handle_1d_data_args(args, datasource=None, create_autoindex=True,
        suggested_names=[]):
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
    if create_autoindex and len(arrays) == 1:
        arrays.insert(0, np.arange(len(arrays[0])))

    # Now put all the data into a DataSource, or insert into existing one
    names = []
    for i, ary in enumerate(arrays):
        if isinstance(ary, basestring):
            name = ary
        else:
            if i < len(suggested_names):
                name = suggested_names[i]
            elif i == 0 and create_autoindex:
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


