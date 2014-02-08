from __future__ import absolute_import, print_function

""" Command-line driven plotting functions, a la Matplotlib  / Matlab / etc.
"""
from functools import wraps
import itertools
import os
import requests
import time
import warnings

from . import glyphs, browserlib, serverconfig
from .objects import ColumnDataSource, Glyph, Grid, GridPlot, Legend, LinearAxis
from .plotting_helpers import (get_default_color, get_default_alpha,
        _glyph_doc, _match_data_params, _update_plot_data_ranges,
        _materialize_colors_and_alpha, _get_legend, _make_legend,
        _get_select_tool, _new_xy_plot, _handle_1d_data_args, _list_attr_splat)
from .session import (HTMLFileSession, PlotServerSession, NotebookSession,
        NotebookServerSession)

DEFAULT_SERVER_URL = "http://localhost:5006/"

_config = {}

def _set_config():
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
_set_config()

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
    _set_config()
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
    """ Creates a new plot. All subsequent plotting commands will affect
    the new plot.
    """
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

def _glyph_function(glyphclass, argnames, docstring, xfields=["x"], yfields=["y"]):
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
    func.__name__ = glyphclass.__view_model__
    func.__doc__ = docstring
    return func

annular_wedge = _glyph_function(glyphs.AnnularWedge,
    "x,y,inner_radius,outer_radius,start_angle,end_angle".split(","),
""" The `annular_wedge` glyph renders annular wedges centered at `x`, `y`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
inner_radius, outer_radius : str or list[float]
    values or field names of inner and outer radii
start_angle, end_angle : str or list[float]
    values or field names of starting/ending angles
direction : "clock" or "anticlock"
    direction to turn between starting and ending angles

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

annulus = _glyph_function(glyphs.Annulus,
    "x,y,inner_radius,outer_radius".split(","),
""" The `annulus` glyph renders annuli centered at `x`, `y`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
inner_radius, outer_radius : str or list[float]
    values or field names of radii

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

arc = _glyph_function(glyphs.Arc, "x,y,radius,start_angle,end_angle".split(","),
""" The `arc` glyph renders circular arcs centered at `x`, `y`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
radius : str or list[float]
    values or field names of radii
start_angle, end_angle : str or list[float]
    values or field names of starting/ending angles
direction : "clock" or "anticlock"
    direction to turn between starting and ending angles

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

asterisk = _glyph_function(glyphs.Asterisk, ("x", "y"),
""" The `asterisk` glyph is a marker that renders asterisks at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional (default: 0)
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

bezier = _glyph_function(glyphs.Bezier, "x0,y0,x1,y1,cx0,cy0,cx1,cy1".split(","),
""" The bezier glyph displays Bezier curves with the given starting, ending, and control points.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties`
are also accepted as keyword parameters.

Parameters
----------
x0, y0 : str or list[float]
    values or field names of starting coordinates
x1, y1 : str or list[float]
    values or field names of ending coordinates
cx0, cy0 : str or list[float]
    values or field names of first control point coordinates
cx1, cy1 : str or list[float]
    values or field names of second control point coordinates

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
""",
    xfields=['x0', 'x1'], yfields=['y0', 'y1'])

circle = _glyph_function(glyphs.Circle, ("x", "y"),
""" The `circle` glyph is a marker that renders circles at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units
radius : str  or list[float], optional
    values or field names of radii

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`

Notes
-----
Only one of `size` or `radius` should be provided. Note that `radius` defaults to data units.
"""
)

circle_cross = _glyph_function(glyphs.CircleCross, ("x", "y"),
""" The `circle_cross` glyph is a marker that renders circles together with a crossbar (+) at `x`, `y` with size `size` or `radius`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

circle_x = _glyph_function(glyphs.CircleX, ("x", "y"),
""" The `circle_x` glyph is a marker that renders circles together with a "X" glyph at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

cross = _glyph_function(glyphs.Cross, ("x", "y"),
""" The `cross` glyph is a marker that renders crossbars (+) at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

diamond = _glyph_function(glyphs.Diamond, ("x", "y"),
""" The `diamond` glyph is a marker that renders diamonds at `x`, `y` with size `size` or `radius`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

diamond_cross = _glyph_function(glyphs.DiamondCross, ("x", "y"),
""" The `diamond_cross` glyph is a marker that renders diamonds together with a crossbar (+) at `x`, `y` with size `size` or `radius`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

image = _glyph_function(glyphs.Image, ("image", "x", "y", "dw", "dh", "palette"),
""" The image glyph takes each image as a two-dimensional array of scalar data.

A palette (string name of a built-in palette, currently) must also be supplied to use for color-mapping the scalar image.

image : 2D array_like of float
x, y : str or list[float]
    values or field names of lower left coordinates
dw, dh : str or list[float]
    values or field names of image width and height distances
palette : str or list[str]
    values or field names of palettes to use for color-mapping

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

image_rgba = _glyph_function(glyphs.ImageRGBA, ("image", "x", "y", "dw", "dh"),
""" The image_rgba glyph takes each ``image`` as a two-dimensional array of RGBA values (encoded
as 32-bit integers).

image : 2D array_like of uint32
x, y : str or list[float]
    values or field names of lower left coordinates
dw, dh : str or list[float]
    values or field names of image width and height distances

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

inverted_triangle = _glyph_function(glyphs.InvertedTriangle, ("x", "y"),
""" The `inverted_triangle` glyph is a marker that renders upside-down triangles at `x`, `y` with size `size` or `radius`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

line = _glyph_function(glyphs.Line, ("x", "y"),
""" The line glyph displays a single line that connects several points given by the arrays of coordinates `x` and `y`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of line coordinates

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

multi_line = _glyph_function(glyphs.MultiLine, ("xs", "ys"),
""" The multi_line glyph displays lines, each with points given by the arrays of coordinates that are the elements of xs and ys.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties`
are also accepted as keyword parameters.

Parameters
----------
xs, ys : str or list[list[float]]
    values or field names of patch coordinates

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`

Notes
-----
For this glyph, the vector data is not simply an array of scalars, it is really an "array of arrays".
""",
    xfields=["xs"], yfields=["ys"],
)

oval = _glyph_function(glyphs.Oval, ("x", "y", "width", "height"),
""" The oval glyph displays ovals centered on the given coordinates with the given dimensions and angle.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
width, height : str or list[float], optional
    values or field names of widths and heights
angle : str or list[float], optional (default: 0)
    values or field names of rotation angles

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

patch = _glyph_function(glyphs.Patch, ("x", "y"),
""" The patch glyph displays a single polygonal patch that connects several points given by the arrays of coordinates `x` and `y`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of patch coordinates

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

patches = _glyph_function(glyphs.Patches, ("xs", "ys"),
""" The patches glyph displays several patches, each with points given by the arrays of coordinates that are the elements of xs and ys.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
xs, ys : str or list[list[float]]
    values or field names of patch coordinates

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`

Notes
-----
For this glyph, the vector data is not simply an array of scalars, it is really an "array of arrays".
""",
    xfields=["xs"], yfields=["ys"],
)

quad = _glyph_function(glyphs.Quad, ("left", "right", "top", "bottom"),
""" The quad glyph displays axis-aligned rectangles with the given dimensions.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
left : str or list[float]
    values or field names of left edges
right : str or list[float]
    values or field names of right edges
top : str or list[float]
    values or field names of top edges
bottom : str or list[float]
    values or field names of bottom edges

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
""",
    xfields=["left", "right"], yfields=["top", "bottom"])

quadratic = _glyph_function(glyphs.Quadratic, "x0,y0,x1,y1,cx,cy".split(","),
""" The quadratic glyph displays quadratic curves with the given starting, ending, and control points.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties`
are also accepted as keyword parameters.

Parameters
----------
x0, y0 : str or list[float]
    values or field names of starting coordinates
x1, y1 : str or list[float]
    values or field names of ending coordinates
cx, cy : str or list[float]
    values or field names of first control point coordinates

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
""",
    xfields=["x0", "x1"], yfields=["y0", "y1"])

ray = _glyph_function(glyphs.Ray, ("x", "y", "length", "angle"),
""" The ray glyph displays line segments starting at the given coordinate and extending the given length at the given angle.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
lengths : str or list[float], optional
    values or field names of lengths in screen units
angle : str or list[float]
    values or field names of angles

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

rect = _glyph_function(glyphs.Rect, ("x", "y", "width", "height"),
""" The rect glyph displays rectangles centered on the given coordinates with the given dimensions and angle.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
width, height : str or list[float], optional
    values or field names of widths and heights
angle : str or list[float], optional (default: 0)
    values or field names of rotation angles

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

segment = _glyph_function(glyphs.Segment, ("x0", "y0", "x1", "y1"),
""" The segment glyph displays line segments with the given starting and ending coordinates.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties`
are also accepted as keyword parameters.

Parameters
----------
x0, y0 : str or list[float]
    values or field names of starting coordinates
x1, y1 : str or list[float]
    values or field names of ending coordinates

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
""",
    xfields=["x0", "x1"], yfields=["y0", "y1"])

square = _glyph_function(glyphs.Square, ("x", "y"),
""" The `square` glyph is a marker that renders squares at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

square_cross = _glyph_function(glyphs.SquareCross, ("x", "y"),
""" The `square_cross` glyph is a marker that renders squares together with a crossbar (+) at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

square_x = _glyph_function(glyphs.SquareX, ("x", "y"),
""" The `square_x` glyph is a marker that renders squares together with "X" glyphs at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

text = _glyph_function(glyphs.Text, ("x", "y", "text", "angle"),
""" The text glyph displays text at the given coordinates rotated by the given angle.

In addition the the parameters specific to this glyph,
:ref:`userguide_text_properties`
are also accepted as keyword parameters.

The location of the text relative to the `x`, `y` coordinates is indicated by the text properties.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
test : str of list[str]
    values or field names of texts to render
angle : str or list[float], optional (default: 0)
    values or field names of text angles

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

triangle = _glyph_function(glyphs.Triangle, ("x", "y"),
""" The `triangle` glyph is a marker that renders triangles at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

wedge = _glyph_function(glyphs.Wedge, ("x", "y", "radius", "start_angle", "end_angle"),
""" The `wedge` glyph renders circular wedges centered at `x`, `y`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties` and :ref:`userguide_fill_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
radius : str or list[float]
    values or field names of radii
start_angle, end_angle : str or list[float]
    values or field names of starting/ending angles
direction : "clock" or "anticlock"
    direction to turn between starting and ending angles

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

x = _glyph_function(glyphs.Xmarker, ("x", "y"),
""" The `x` glyph is a marker that renders "x" glyphs at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_line_properties`
are also accepted as keyword parameters.

Parameters
----------
x, y : str or list[float]
    values or field names of center coordinates
size : str or list[float], optional
    values or field names of sizes in screen units

Returns
-------
plot : :py:class:`Plot <bokeh.objects.Plot>`
"""
)

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
        scatter(x_array, y_array, marker="circle")
        scatter("data1", "data2", source=data_source, ...)

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
    """ Generate a plot that arranges several subplots into a grid. """
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

