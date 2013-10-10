""" Command-line driven plotting functions, a la Matplotlib  / Matlab / etc.
"""
import copy
from collections import Iterable
from functools import wraps
from numbers import Number
import numpy as np
import os
import requests
import time
import warnings
import webbrowser

from .objects import (ColumnDataSource, DataSource, ColumnsRef, DataRange1d,
        Plot, GlyphRenderer, LinearAxis, Grid, PanTool, ZoomTool,
        PreviewSaveTool, ResizeTool, SelectionTool, BoxSelectionOverlay,
        Legend)
from .session import (HTMLFileSession, PlotServerSession, NotebookSession,
        NotebookServerSession)
from . import glyphs

def plothelp():
    """ Prints out a list of all plotting functions.  Information on each
    function is available in its docstring, and can be accessed via the
    normal Python help() function, e.g. help(rect).
    """

    helpstr = """

    Plotting
    --------
    scatter(data, type="circle", ...)
        scatter plot of some data, with a particular marker type

    get_plot()
        returns the current bokeh.objects.Plot object

    Other Renderers
    ---------
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


def session():
    """ Get the current session.
    """
    return _config["session"]

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
    try:
        _config["session"] = PlotServerSession(**kwargs)
    except requests.exceptions.ConnectionError:
        print "Cannot connect to Bokeh server. (Not running?) To start the Bokeh server execute 'bokeh-server'"
        import sys
        sys.exit(1)
    _config["session"].use_doc(docname)

    print "Using plot server at", real_url + "bokeh;", "Docname:", docname

def output_file(filename, title="Bokeh Plot", autosave=True, js="inline",
                css="inline", rootdir="."):
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
    # Map our string argument to the webbrowser.open argument
    new_param = {'tab': 2, 'window': 1}[new]
    if browser is not None:
        controller = webbrowser.get(browser)
    else:
        controller = webbrowser
    if output_type == "file":
        session.save()
        controller.open("file://" + os.path.abspath(_config["output_file"]),
                            new=new_param)
    elif output_type == "server":
        session.store_all()
        controller.open(_config["output_url"] + "/bokeh", new=new_param)

    elif output_type == "notebook":
        session.show()

def save(filename=None):
    """ Updates the file or plot server that contains this plot.

    For file-based output, this will save the plot to the given filename.
    For plot server-based output, this will upload all the plot objects
    up to the server.
    """
    session = _config["session"]
    if _config["output_type"] == "file":
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
            session.show(plot, *session_objs)

        elif (output_type == "server") or \
                (output_type == "notebook" and output_url is not None):
            # push the plot data to a plot server
            session.store_all()
            if output_type == "notebook":
                session.show(plot, *session_objs)

        else: # File output mode
            # Store plot into HTML file
            if _config["autosave"]:
                session.save()
        return plot
    return wrapper



#def plot(*args, **kwargs):
#    """ Creates a line plot of the given x & y items
#
#    Parameters
#    ----------
#    *data : The data to plot.  Can be of several forms:
#        (X, Y1, Y2, ...)
#            A series of 1D arrays, iterables, or bokeh DataSource/ColumnsRef
#        [[x1,y1], [x2,y2], .... ]
#            An iterable of tuples
#        NDarray (NxM)
#            The first column is treated as the X, and all other M-1 columns
#            are treated as separate Y series
#    Examples
#    --------
#        plot([1,2,3,4,5,6])
#        plot([1,2,3],[4,5,6], fill_color="red")
#        plot(x_array, y_array, type="circle")
#        plot("data1", "data2", source=data_source, ...)
#
#    """
#    session_objs = []   # The list of objects that need to be added
#
#    ds = kwargs.pop("source", None)
#    names, datasource = _handle_1d_data_args(args, datasource=ds)
#    if datasource != ds:
#        session_objs.append(datasource)
#
#    # If hold is on, then we will reuse the ranges of the current plot
#    plot = get_plot(kwargs)
#    if not len(color_fields.intersection(set(kwargs.keys()))):
#        kwargs['color'] = get_default_color(plot)
#    points = kwargs.pop("points", True)
#    marker = kwargs.get("type", "circle")
#    x_name = names[0]
#    for name in names[1:]:
#        _glyph_plot("line", x_name, name, plot, datasource, **kwargs)
#        if points:
#            _glyph_plot(marker, x_name, name, plot, datasource, **kwargs)
#    return plot

marker_types = {
        "circle": glyphs.Circle,
        "square": glyphs.Square,
        "triangle": glyphs.Triangle,
        "cross": glyphs.Cross,
        "xmarker": glyphs.Xmarker,
        "diamond": glyphs.Diamond,
        "invtriangle": glyphs.InvertedTriangle,
        "squarex": glyphs.SquareX,
        "circlex": glyphs.CircleX,
        "asterisk": glyphs.Asterisk,
        "diamondcross": glyphs.DiamondCross,
        "circlecross": glyphs.CircleCross,
        "squarecross": glyphs.SquareCross,
        "hexstar": glyphs.HexStar,
        "+": glyphs.Cross,
        "*": glyphs.Asterisk,
        "x": glyphs.Xmarker,
        "o": glyphs.Circle,
        }

def markers():
    """ Prints a list of valid marker types for scatter()
    """
    print sorted(marker_types.keys())


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
        [y1, y2, ... yN]
            A list/tuple of scalar values; will be treated as Y values and
            a synthetic X array of integers will be generated.

    Style Parameters (specified by keyword)
    ---------------------------------------
    type : a valid marker_type; defaults to "circle"
    fill_color : color
    fill_alpha : 0.0 - 1.0
    line_color : color
    line_width : int >= 1
    line_alpha : 0.0 - 1.0
    line_cap : "butt", "join", "miter"

    Colors can be either one of:
       the 147 named SVG colors
       a string representing a Hex color (e.g. "#FF32D0")
       a 3-tuple of integers between 0 and 255
       a 4-tuple of (r,g,b,a) where r,g,b are 0..255 and a is between 0..1

    Examples
    --------
        scatter([1,2,3,4,5,6])
        scatter([1,2,3],[4,5,6], fill_color="red")
        scatter(x_array, y_array, type="circle")
        scatter("data1", "data2", source=data_source, ...)

    """
    session_objs = []   # The list of objects that need to be added

    ds = kwargs.pop("source", None)
    names, datasource = _handle_1d_data_args(args, datasource=ds)
    if datasource != ds:
        session_objs.append(datasource)

    # If hold is on, then we will reuse the ranges of the current plot
    #plot = get_plot(kwargs)
    markertype = kwargs.get("type", "circle")
    x_name = names[0]

    if not len(color_fields.intersection(set(kwargs.keys()))):
        kwargs['color'] = get_default_color(plot)

    for yname in names[1:]:
        if markertype not in marker_types:
            raise RuntimeError("Invalid marker type '%s'. Use markers() to see a list of valid marker types." % markertype)
        # TODO: Look up correct glyph function, then call it

    return plot


class GlyphFunction(object):
    """ Wraps a Glyph so that it can be created as a plot.

    annular_wedge = GlyphFunction(glyphs.AnnularWedge,
                        "x,y,inner_radius,outer_radius,start_angle,end_angle".split(","))
    bezier = GlyphFunction(glyphs.Bezier, "x0,y0,x1,y1,cx0,cy0,cx1,cy1".split(","),
                    ["x0", "x1"], ["y0", "y1"])

    Then annular_wedge can be called like this:

        annular_wedge([1,2,3,4], [5,3,6,7], 3.0, 8.0, pi/4, 0.75*pi)

    """

    glyphclass = None
    argnames = None
    xfields = ["x"]
    yfields = ["y"]

    def __init__(self, glyphclass, argnames, xfields=None, yfields=None):
        self.glyphclass = glyphclass
        self.argnames = argnames
        if xfields is None:
            self.xfields = ["x"]
        else:
            self.xfields = xfields
        if yfields is None:
            self.yfields = ["y"]
        else:
            self.yfields = yfields

    def _match_data_params(self, datasource, args, kwargs):
        """ Processes the arguments and kwargs passed in to __call__ to line
        them up with the argnames of the underlying Glyph

        Returns
        ---------
        glyph_params : dict of params that should be in the glyphspec
        """
        # Go through the list of position and keyword arguments, matching up
        # the full list of required glyph data attributes
        attributes = dict(zip(self.argnames, args))
        if len(args) < len(self.argnames):
            for argname in self.argnames[len(args):]:
                if argname in kwargs:
                    attributes[argname] = kwargs.pop(argname)
                else:
                    raise RuntimeError("Missing required glyph parameter '%s'" % argname)

        glyph_params = {}
        for var, val in attributes.iteritems():
            if isinstance(val, basestring):
                if val not in datasource.column_names:
                    raise RuntimeError("Column name '%s' does not appear in data source %r" % (val, datasource))
                glyph_val = {'field' : val, 'units' : 'data'}
            elif isinstance(val, np.ndarray):
                if val.ndim != 1:
                    raise RuntimeError("Columns need to be 1D (%s is not)" % var)
                datasource.add(val, name=var)
                glyph_val = {'field' : var, 'units' : 'data'}
            elif isinstance(val, dict):
                glyph_val = val
            elif isinstance(val, Iterable):
                datasource.add(val, name=var)
                glyph_val = {'field' : var, 'units' : 'data'}
            elif isinstance(val, Number):
                # TODO: verify this handles constant colors, which are not numbers.
                #    Will probably need to move this before basestring check above.
                glyph_val = {'field' : None, 'default' : val, 'units' : 'screen'}
            else:
                raise RuntimeError("Unexpected column type: %s" % type(val))
            glyph_params[var] = glyph_val
        return glyph_params

    def _update_plot_data_ranges(self, plot, datasource, xcols, ycols):
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

    def get_plot(self, kwargs):
        plot = kwargs.pop("plot", None)
        if not plot:
            if _config["hold"] and _config["curplot"]:
                plot = _config["curplot"]
            else:
                plot = _new_xy_plot(**kwargs)
        return plot

    def get_legend(self, plot):
        legend = [x for x in plot.renderers if x.__view_model__ == "Legend"]
        if len(legend) > 0:
            legend = legend[0]
        else:
            legend = None
        return legend

    def make_legend(self, plot):
        legend = Legend(plot=plot)
        plot.renderers.append(legend)
        plot._dirty = True
        return legend

    def get_select_tool(self, plot):
        """returns select tool on a plot, if it's there
        """
        select_tool = [x for x in plot.tools if x.__view_model__ == "SelectionTool"]
        if len(select_tool) > 0:
            select_tool = select_tool[0]
        else:
            select_tool = None
        return select_tool

    @visual
    def __call__(self, *args, **kwargs):

        # Process the keyword arguments that are not glyph-specific
        datasource = kwargs.pop("source", ColumnDataSource())
        session_objs = [datasource]
        if "color" in kwargs:
            color = kwargs.pop("color")
            if "fill_color" not in kwargs:
                kwargs["fill_color"] = color
            if "line_color" not in kwargs:
                kwargs["line_color"] = color

        legend_name = kwargs.pop("legend", None)
        plot = self.get_plot(kwargs)
        select_tool = self.get_select_tool(plot)

        # Process the glyph dataspec parameters
        glyph_params = self._match_data_params(datasource, args, kwargs)

        x_data_fields = [
            glyph_params[xx]['field'] for xx in self.xfields if glyph_params[xx]['units'] == 'data'
        ]
        y_data_fields = [
            glyph_params[yy]['field'] for yy in self.yfields if glyph_params[yy]['units'] == 'data'
        ]
        self._update_plot_data_ranges(plot, datasource, x_data_fields, y_data_fields)

        kwargs.update(glyph_params)
        glyph = self.glyphclass(**kwargs)

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
            legend = self.get_legend(plot)
            if not legend:
                legend = self.make_legend(plot)
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


# TODO: Unify these under one thing for all Marker glyphs
# TODO: How to handle default arguments?
square = GlyphFunction(glyphs.Square, ("x", "y"))
circle = GlyphFunction(glyphs.Circle, ("x", "y"))

line = GlyphFunction(glyphs.Line, ("x", "y"))
multi_line = GlyphFunction(glyphs.MultiLine, ("xs", "ys"), ["xs"], ["ys"])

#@glyph
#def annular_wedge(x, y, inner_radius, outer_radius, start_angle, end_angle, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.AnnularWedge, glyph_params
#
#@glyph
#def annulus(x, y, inner_radius, outer_radius, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Annulus, glyph_params
#
#@glyph
#def arc(x, y, radius, start_angle, end_angle, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Arc, glyph_params
#
#@glyph(xfields=['x0', 'x1'], yfields=['y0', 'y1'])
#def bezier(x0, y0, x1, y1, cx0, cy0, cx1, cy1, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Bezier, glyph_params
#
#@glyph
#def oval(x, y, width, height, angle=0, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Oval, glyph_params
#
#@glyph
#def patch(x, y, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Patch, glyph_params
#
#@glyph(xfields=['xs'], yfields=['ys'])
#def patches(xs, ys, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Patches, glyph_params
#
#@glyph
#def ray(x, y, length, angle, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Ray, glyph_params
#
#@glyph(xfields=['left', 'right'], yfields=['top', 'bottom'])
#def quad(left, right, top, bottom, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Quad, glyph_params
#
#@glyph(xfields=['x0', 'x1'], yfields=['y0', 'y1'])
#def quadratic(x0, y0, x1, y1, cx, cy, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Quadratic, glyph_params
#
#@glyph
#def rect(x, y, width, height, angle=0, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Rect, glyph_params
#
#@glyph(xfields=['x0', 'x1'], yfields=['y0', 'y1'])
#def segment(x0, y0, x1, y1, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Segment, glyph_params
#
#@glyph
#def wedge(x, y, radius, start_angle, end_angle, **kwargs):
#    args, vals = zip(*tuple((k,v) for (k,v) in locals().iteritems() if k != 'kwargs'))
#    datasource = kwargs['datasource']
#    glyph_params = _match_data_params(args, vals, datasource)
#    return glyphs.Wedge, glyph_params



def _new_xy_plot(x_range=None, y_range=None, plot_width=None, plot_height=None,
                 tools="pan,zoom,save,resize,select,previewsave", **kw):
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
    xgrid = Grid(plot=p, dimension=0)
    ygrid = Grid(plot=p, dimension=1)

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

def xaxis():
    """ Returns the x-axis or list of x-axes on the current plot """
    p = curplot()
    if p is None:
        return None
    axis = [obj for obj in p.renderers if isinstance(obj, LinearAxis) and obj.dimension==0]
    if len(axis) > 0:
        return axis
    else:
        return None

def yaxis():
    """ Returns the y-axis or list of y-axes on the current plot """
    p = curplot()
    if p is None:
        return None
    axis = [obj for obj in p.renderers if isinstance(obj, LinearAxis) and obj.dimension==1]
    if len(axis) > 0:
        return axis
    else:
        return None

def xgrid():
    """ Returns x-grid object on the current plot """
    p = curplot()
    if p is None:
        return None
    grid = [obj for obj in p.renderers if isinstance(obj, Grid) and obj.dimension==0]
    if len(grid) > 0:
        return grid
    else:
        return None

def ygrid():
    """ Returns y-grid object on the current plot """
    p = curplot()
    if p is None:
        return None
    grid = [obj for obj in p.renderers if isinstance(obj, Grid) and obj.dimension==1]
    if len(grid) > 0:
        return grid
    else:
        return None


