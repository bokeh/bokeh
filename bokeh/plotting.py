from __future__ import absolute_import, print_function

""" Command-line driven plotting functions, a la Matplotlib  / Matlab / etc.
"""
from functools import wraps
import itertools
import os
import requests
import time
import warnings

from .plotting_helpers import (get_default_color, get_default_alpha,
        _match_data_params, _update_plot_data_ranges,
        _materialize_colors_and_alpha, _get_legend, _make_legend,
        _get_select_tool, _new_xy_plot, _handle_1d_data_args, _list_attr_splat)
from .objects import ColumnDataSource, Glyph, Grid, GridPlot, Legend, LinearAxis
from .session import (HTMLFileSession, PlotServerSession, NotebookSession,
        NotebookServerSession)
from . import glyphs, browserlib, serverconfig

DEFAULT_SERVER_URL = "http://localhost:5006/"

_config = {}

def set_config():
    global _config
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
set_config()

def _get_plot(kwargs):
    plot = kwargs.pop("plot", None)
    if not plot:
        if _config["hold"] and _config["curplot"]:
            plot = _config["curplot"]
        else:
            plot = _new_xy_plot(**kwargs)
    return plot

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
    print(helpstr)




def session():
    """ Get the current session.
    """
    return _config["session"]

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
            real_url = _config["plotserver_url"]
        else:
            real_url = url
        if not server:
            if name:
                server = serverconfig.Server(name=name)
            else:
                server = serverconfig.Server(name=real_url)
        _config["output_url"] = server.root_url
        _config["output_type"] = "server"
        _config["output_file"] = None
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
    _config["output_type"] = "notebook"
    _config["output_file"] = None
    _config["session"] = session

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
        real_url = _config["plotserver_url"]
    else:
        real_url = url
    if not server:
        if name:
            server = serverconfig.Server(name=name)
        else:
            server = serverconfig.Server(name=real_url)
    _config["output_url"] = server.root_url
    _config["output_type"] = "server"
    _config["output_file"] = None
    try:
        _config["session"] = PlotServerSession(server_config=server)
    except requests.exceptions.ConnectionError:
        print("Cannot connect to Bokeh server. (Not running?) To start the "
              "Bokeh server execute 'bokeh-server'")
        import sys
        sys.exit(1)
    _config["session"].use_doc(docname)
    real_url = _config["output_url"]
    print("Using plot server at", real_url + "bokeh;", "Docname:", docname)

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
    set_config()
    if os.path.isfile(filename):
        print("Session output file '%s' already exists, will be overwritten." %
                filename)
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
    controller = browserlib.get_browser_controller(browser=browser)
    if output_type == "file":
        session.save()
        controller.open("file://" + os.path.abspath(_config["output_file"]), new=new_param)
    elif output_type == "server":
        session.store_all()
        controller.open(_config["output_url"] + "/bokeh", new=new_param)
    elif output_type == "notebook":
        session.show(curplot())

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

        if not session:
            raise RuntimeError(
                'No output mode active, call one of: { output_file(...), output_server(...), output_notebook(...) } before plotting'
            )

        retvals = func(*args, **kw)
        if len(retvals) == 1:
            plot = retvals
            session_objs = []
        else:
            plot, session_objs = retvals

        if plot is not None:
            session.add(plot)
            _config["curplot"] = plot
            # if _PLOTLIST is not None:
            #     _PLOTLIST.append(plot)

        if session_objs:
            session.add(*session_objs)

        #easier to always use plot context
        if plot not in session.plotcontext.children:
            session.plotcontext.children.append(plot)
        session.plotcontext._dirty = True
        plot._dirty = True

        if (output_type == "server") or \
                (output_type == "notebook" and output_url is not None):
            # push the plot data to a plot server
            session.store_all()

        else: # File output mode
            # Store plot into HTML file
            if _config["autosave"]:
                session.save()
        return plot
    return wrapper

color_fields = set(["color", "fill_color", "line_color"])
alpha_fields = set(["alpha", "fill_alpha", "line_alpha"])

def _glyph_function(glyphclass, argnames, xfields=["x"], yfields=["y"]):
    @visual
    def func(*args, **kwargs):
      # Process the keyword arguments that are not glyph-specific
        datasource = kwargs.pop("source", ColumnDataSource())
        session_objs = [datasource]
        legend_name = kwargs.pop("legend", None)
        plot = _get_plot(kwargs)
        if 'name' in kwargs:
            plot._id = kwargs['name']

        select_tool = _get_select_tool(plot)

        # Process the glyph dataspec parameters
        glyph_params = _match_data_params(argnames, glyphclass,
            datasource, args, _materialize_colors_and_alpha(kwargs))

        x_data_fields = [
            glyph_params[xx]['field'] for xx in xfields if glyph_params[xx]['units'] == 'data']
        y_data_fields = [
            glyph_params[yy]['field'] for yy in yfields if glyph_params[yy]['units'] == 'data']
        _update_plot_data_ranges(plot, datasource, x_data_fields, y_data_fields)
        kwargs.update(glyph_params)
        glyph = glyphclass(**kwargs)
        nonselection_glyph_params = _materialize_colors_and_alpha(
            kwargs, prefix='nonselection_', default_alpha=0.1)
        nonselection_glyph = glyph.clone()

        nonselection_glyph.fill_color = nonselection_glyph_params['fill_color']
        nonselection_glyph.line_color = nonselection_glyph_params['line_color']

        nonselection_glyph.fill_alpha = nonselection_glyph_params['fill_alpha']
        nonselection_glyph.line_alpha = nonselection_glyph_params['line_alpha']

        glyph_renderer = Glyph(
            data_source = datasource,
            plot = plot,
            glyph=glyph,
            nonselection_glyph=nonselection_glyph,
            )

        if legend_name:
            legend = _get_legend(plot)
            if not legend:
                legend = _make_legend(plot)
            mappings = legend.legends
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
    return func

def _glyph_doc(args, props, desc):
    params_tuple =tuple(itertools.chain.from_iterable(sorted(list(args.items()))))
    params = "\t%s : %s\n" * len(args) % params_tuple

    return """%s

    Parameters
    ----------
    %s
    Additionally, the following properties are accepted as keyword arguments: %s

    Returns
    -------
    plot : :py:class:`Plot <bokeh.objects.Plot>`
    """ % (desc, params, props)

# _line_args = {
#     "x": "float or sequence of float",
#     "y": "float or sequence of float",
# }
line = _glyph_function(glyphs.Line, ("x", "y"))
# line.__doc__ = _glyph_doc(_line_args, "line", """
#     The line function renders a sequence of `x` and `y` points as a connected line.""")

multi_line = _glyph_function(glyphs.MultiLine, ("xs", "ys"), ["xs"], ["ys"])

annular_wedge = _glyph_function(glyphs.AnnularWedge,
    "x,y,inner_radius,outer_radius,start_angle,end_angle".split(","))

annulus = _glyph_function(glyphs.Annulus,
    "x,y,inner_radius,outer_radius".split(","))

arc = _glyph_function(glyphs.Arc, "x,y,radius,start_angle,end_angle".split(","))

bezier = _glyph_function(glyphs.Bezier, "x0,y0,x1,y1,cx0,cy0,cx1,cy1".split(","),
    xfields=['x0', 'x1'], yfields=['y0', 'y1'])

oval = _glyph_function(glyphs.Oval, ("x", "y", "width", "height"))

patch = _glyph_function(glyphs.Patch, ("x", "y"))

patches = _glyph_function(glyphs.Patches, ("xs", "ys"), ["xs"], ["ys"])

ray = _glyph_function(glyphs.Ray, ("x", "y", "length", "angle"))

quad = _glyph_function(glyphs.Quad, ("left", "right", "top", "bottom"),
    xfields=["left", "right"], yfields=["top", "bottom"])

quadratic = _glyph_function(glyphs.Quadratic, "x0,y0,x1,y1,cx,cy".split(","),
    xfields=["x0", "x1"], yfields=["y0", "y1"])

rect = _glyph_function(glyphs.Rect, ("x", "y", "width", "height"))

segment = _glyph_function(glyphs.Segment, ("x0", "y0", "x1", "y1"),
    xfields=["x0", "x1"], yfields=["y0", "y1"])

text = _glyph_function(glyphs.Text, ("x", "y", "text", "angle"))

wedge = _glyph_function(glyphs.Wedge, ("x", "y", "radius", "start_angle", "end_angle"))

image = _glyph_function(glyphs.Image, ("image", "x", "y", "dw", "dh", "palette"))

image_rgba = _glyph_function(glyphs.ImageRGBA, ("image", "x", "y", "dw", "dh"))

marker_types = {
        "circle": glyphs.Circle,
        "square": glyphs.Square,
        "triangle": glyphs.Triangle,
        "cross": glyphs.Cross,
        #"xmarker": glyphs.Xmarker,
        "diamond": glyphs.Diamond,
        "invtriangle": glyphs.InvertedTriangle,
        "square_x": glyphs.SquareX,
        "circle_x": glyphs.CircleX,
        "asterisk": glyphs.Asterisk,
        "diamond_cross": glyphs.DiamondCross,
        "circle_cross": glyphs.CircleCross,
        "square_cross": glyphs.SquareCross,
        #"hexstar": glyphs.HexStar,
        "+": glyphs.Cross,
        "*": glyphs.Asterisk,
        "x": glyphs.Xmarker,
        "o": glyphs.Circle,
        "ox": glyphs.CircleX,
        "o+": glyphs.CircleCross,
        }

def markers():
    """ Prints a list of valid marker types for scatter()
    """
    print(list(sorted(marker_types.keys())))


for _marker_name, _glyph_class in marker_types.items():
    if len(_marker_name) <= 2:
        continue
    _func = _glyph_function(_glyph_class, ("x", "y"))
    exec("%s = _func" % _marker_name)

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

    Style Parameters (specified by keyword)::

        marker : a valid marker_type; defaults to "circle"
        fill_color : color
        fill_alpha : 0.0 - 1.0
        line_color : color
        line_width : int >= 1
        line_alpha : 0.0 - 1.0
        line_cap : "butt", "join", "miter"
        color : shorthand to set both fill and line color

    Colors can be either one of:

    * the 147 named SVG colors
    * a string representing a Hex color (e.g. "#FF32D0")
    * a 3-tuple of integers between 0 and 255
    * a 4-tuple of (r,g,b,a) where r,g,b are 0..255 and a is between 0..1

    Examples::

        scatter([1,2,3,4,5,6])
        scatter([1,2,3],[4,5,6], fill_color="red")
        scatter(x_array, y_array, type="circle")
        scatter("data1", "data2", source=data_source, ...)

    """
    session_objs = []   # The list of objects that need to be added

    if "type" in kwargs:
        warnings.warn("Keyword argument 'type' of scatter(...) is deprecated; use 'marker' instead.")
        kwargs.setdefault("marker", kwargs.pop("type"))

    ds = kwargs.get("source", None)
    names, datasource = _handle_1d_data_args(args, datasource=ds)
    if datasource != ds:
        session_objs.append(datasource)

    # If hold is on, then we will reuse the ranges of the current plot
    #plot = get_plot(kwargs)
    markertype = kwargs.get("marker", "circle")
    x_name = names[0]

    # TODO: How to handle this? Just call curplot()?
    if not len(color_fields.intersection(set(kwargs.keys()))):
        kwargs['color'] = get_default_color()
    if not len(alpha_fields.intersection(set(kwargs.keys()))):
        kwargs['alpha'] = get_default_alpha()

    plots = []
    for yname in names[1:]:
        if markertype not in marker_types:
            raise RuntimeError("Invalid marker type '%s'. Use markers() to see a list of valid marker types." % markertype)
        # TODO: Look up correct glyph function, then call it
        if markertype in locals():
            locals()[markertype](*args, **kwargs)
        else:
            glyphclass = marker_types[markertype]
            plots.append(_glyph_function(glyphclass, ("x", "y"))(*args, **kwargs))
    if len(plots) == 1:
        return plots[0]
    else:
        return plots

@visual
def gridplot(plot_arrangement, name=False):
    grid = GridPlot(children=plot_arrangement)
    if name:
        grid._id = name
    # Walk the plot_arrangement and remove them from the plotcontext,
    # so they don't show up twice
    session = _config["session"]
    session.plotcontext.children = list(set(session.plotcontext.children) - \
                set(itertools.chain.from_iterable(plot_arrangement)))
    return grid, [grid]

def xaxis():
    """ Returns the x-axis or list of x-axes on the current plot """
    p = curplot()
    if p is None:
        return None
    axis = [obj for obj in p.renderers if isinstance(obj, LinearAxis) and obj.dimension==0]
    return _list_attr_splat(axis)

def yaxis():
    """ Returns the y-axis or list of y-axes on the current plot """
    p = curplot()
    if p is None:
        return None
    axis = [obj for obj in p.renderers if isinstance(obj, LinearAxis) and obj.dimension==1]
    return _list_attr_splat(axis)

def axis():
    """ Return the axes on the current plot """
    return _list_attr_splat(xaxis() + yaxis())

def legend():
    """ Return the legend(s) of the current plot """
    p = curplot()
    if p is None:
        return None
    legends = [obj for obj in p.renderers if isinstance(obj, Legend)]
    return _list_attr_splat(legends)

def xgrid():
    """ Returns x-grid object on the current plot """
    p = curplot()
    if p is None:
        return None
    grid = [obj for obj in p.renderers if isinstance(obj, Grid) and obj.dimension==0]
    return _list_attr_splat(grid)

def ygrid():
    """ Returns y-grid object on the current plot """
    p = curplot()
    if p is None:
        return None
    grid = [obj for obj in p.renderers if isinstance(obj, Grid) and obj.dimension==1]
    return _list_attr_splat(grid)

def grid():
    """ Return the grids on the current plot """
    return _list_attr_splat(xgrid() + ygrid())

