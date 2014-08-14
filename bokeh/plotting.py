from __future__ import print_function

from functools import wraps
import itertools
import time
import logging
import os
import uuid
import warnings
import io

from . import browserlib
from . import _glyph_functions as gf
from .document import Document
from .embed import notebook_div, file_html, autoload_server
from .objects import Axis, ColumnDataSource, Glyph, Grid, GridPlot, Legend, Plot
from .palettes import brewer
from .plotting_helpers import (
    get_default_color, get_default_alpha, _handle_1d_data_args, _list_attr_splat
)
from .resources import Resources
from .session import Cloud, DEFAULT_SERVER_URL, Session
from .utils import decode_utf8, publish_display_data

logger = logging.getLogger(__name__)

_default_document = Document()

_default_session = None

_default_file = None

_default_notebook = None

def curdoc():
    ''' Return the current document.

    Returns:
        doc : the current default document object.
    '''
    try:
        """This is used when we need to call the plotting API from within
        the server, within a request context.  (Applets do this for example)
        in this case you still want the API to work but you don't want
        to use the global module level document
        """
        from flask import request
        doc = request.bokeh_server_document
        logger.debug("returning config from flask request")
        return doc
    except (ImportError, RuntimeError, AttributeError):
        return _default_document

def curplot():
    ''' Return the current default plot object.

    Returns:
        plot : the current default plot (or None)
    '''
    return curdoc().curplot()

def cursession():
    ''' Return the current session, if there is one.

    Returns:
        session : the current default session object (or None)
    '''
    return _default_session

def reset_output():
    ''' Deactivate all currently active output modes.

    Subsequent calls to show() will not render until a new output mode is
    activated.

    Returns:
        None

    '''
    global _default_document
    global _default_session
    global _default_file
    global _default_notebook
    _default_document = Document()
    _default_session = None
    _default_file = None
    _default_notebook = None

def hold(value=True):
    ''' Set or clear the plot hold status on the current document.

    This is a convenience function that acts on the current document, and is equivalent to curdoc().hold(...)

    Args:
        value (bool, optional) : whether hold should be turned on or off (default: True)

    Returns:
        None
    '''
    curdoc().hold(value)

def figure(**kwargs):
    ''' Activate a new figure for plotting.

    All subsequent plotting operations will affect the new figure.

    This function accepts all plot style keyword parameters.

    Returns:
        None

    '''
    curdoc().figure(**kwargs)

def output_server(docname, session=None, url="default", name=None):
    """ Cause plotting commands to automatically persist plots to a Bokeh server.

    Can use explicitly provided Session for persistence, or the default
    session.

    Args:
        docname (str) : name of document to push on Bokeh server
            An existing documents with the same name will be overwritten.
        session (Session, optional) : An explicit session to use (default: None)
            If session is None, use the default session
        url (str, optianal) : URL of the Bokeh server  (default: "default")
            if url is "default" use session.DEFAULT_SERVER_URL
        name (str, optional) :
            if name is None, use the server URL as the name

    Additional keyword arguments like **username**, **userapikey**,
    and **base_url** can also be supplied.

    Returns:
        None

    .. note:: Generally, this should be called at the beginning of an
              interactive session or the top of a script.

    .. note:: Calling this function will replaces any existing default Server session

    """
    global _default_session
    if url == "default":
        url = DEFAULT_SERVER_URL
    if name is None:
        name = url
    if not session:
        if not _default_session:
            _default_session = Session(name=name, root_url=url)
        session = _default_session
    session.use_doc(docname)
    session.load_document(curdoc())

def output_cloud(docname):
    """ Cause plotting commands to automatically persist plots to the Bokeh
    cloud server.

    Args:
        docname (str) : name of document to push on Bokeh server
            An existing documents with the same name will be overwritten.

    .. note:: Generally, this should be called at the beginning of an
              interactive session or the top of a script.

    .. note:: Calling this function will replaces any existing default Server session

    """
    output_server(docname, session=Cloud())

def output_notebook(url=None, docname=None, session=None, name=None,
                    force=False):
    if session or url or name:
        if docname is None:
            docname = "IPython Session at %s" % time.ctime()
        output_server(docname, url=url, session=session, name=name)
    else:
        from . import load_notebook
        load_notebook(force=force)
    global _default_notebook
    _default_notebook = True

def output_file(filename, title="Bokeh Plot", autosave=True, mode="inline", root_dir=None):
    """ Outputs to a static HTML file.

    .. note:: This file will be overwritten each time show() or save() is invoked.

    Args:
        autosave (bool, optional) : whether to automatically save (default: True)
            If **autosave** is True, then every time plot() or one of the other
            visual functions is called, this causes the file to be saved. If it
            is False, then the file is only saved upon calling show().

        mode (str, optional) : how to inlude BokehJS (default: "inline")
            **mode** can be 'inline', 'cdn', 'relative(-dev)' or 'absolute(-dev)'.
            In the 'relative(-dev)' case, **root_dir** can be specified to indicate the
            base directory from which the path to the various static files should be
            computed.

    .. note:: Generally, this should be called at the beginning of an
              interactive session or the top of a script.

    """
    global _default_file
    _default_file = {
        'filename'  : filename,
        'resources' : Resources(mode=mode, root_dir=root_dir, minified=False),
        'autosave'  : autosave,
        'title'     : title,
    }

    if os.path.isfile(filename):
        print("Session output file '%s' already exists, will be overwritten." % filename)


def show(obj=None, browser=None, new="tab", url=None):
    """ 'shows' a plot object or the current plot, by auto-raising the window or tab
    displaying the current plot (for file/server output modes) or displaying
    it in an output cell (IPython notebook).

    Args:
        obj (plot object, optional): it accepts a plot object and just shows it.

        browser (str, optional) : browser to show with (default: None)
            For systems that support it, the **browser** argument allows specifying
            which browser to display in, e.g. "safari", "firefox", "opera",
            "windows-default".  (See the webbrowser module documentation in the
            standard lib for more details.)

        new (str, optional) : new file output mode (default: "tab")
            For file-based output, opens or raises the browser window
            showing the current output file.  If **new** is 'tab', then
            opens a new tab. If **new** is 'window', then opens a new window.
    """
    filename = _default_file['filename'] if _default_file else None
    session = cursession()
    notebook = _default_notebook

    # Map our string argument to the webbrowser.open argument
    new_param = {'tab': 2, 'window': 1}[new]

    controller = browserlib.get_browser_controller(browser=browser)
    if obj is None:
        plot = curdoc()
    else:
        plot = obj
    if not plot:
        warnings.warn("No current plot to show. Use renderer functions (circle, rect, etc.) to create a current plot (see http://bokeh.pydata.org/index.html)")
        return
    if notebook and session:
        push(session=session)
        snippet = autoload_server(plot, cursession())
        publish_display_data({'text/html': snippet})

    elif notebook:
        publish_display_data({'text/html': notebook_div(plot)})

    elif session:
        push()
        if url:
            controller.open(url, new=new_param)
        else:
            controller.open(session.object_link(curdoc()._plotcontext))

    elif filename:
        save(filename, obj=plot)
        controller.open("file://" + os.path.abspath(filename), new=new_param)


def save(filename=None, resources=None, obj=None):
    """ Updates the file with the data for the current document.

    If a filename is supplied, or output_file(...) has been called, this will
    save the plot to the given filename.

    Args:
        filename (str, optional) : filename to save document under (default: None)
            if `filename` is None, the current output_file(...) filename is used if present
        resources (Resources, optional) : BokehJS resource config to use
            if `resources` is None, the current default resource config is used

        obj (Document or Plot object, optional)
            if provided, then this is the object to save instead of curdoc()
            and its curplot()

    Returns:
        None

    """
    if filename is None and _default_file:
        filename = _default_file['filename']

    if resources is None and _default_file:
        resources = _default_file['resources']

    if not filename:
        warnings.warn("save() called but no filename was supplied and output_file(...) was never called, nothing saved")
        return

    if not resources:
        warnings.warn("save() called but no resources was supplied and output_file(...) was never called, nothing saved")
        return

    if obj is None:
        if not curplot():
            warnings.warn("No current plot to save. Use renderer functions (circle, rect, etc.) to create a current plot (see http://bokeh.pydata.org/index.html)")
            return
        doc = curdoc()
    elif isinstance(obj, Plot):
        doc = Document()
        doc.add(obj)
    elif isinstance(obj, Document):
        doc = obj
    else:
        raise RuntimeError("Unable to save object of type '%s'" % type(obj))

    html = file_html(doc, resources, _default_file['title'])
    with io.open(filename, "w", encoding="utf-8") as f:
        f.write(decode_utf8(html))

def push(session=None, document=None):
    """ Updates the server with the data for the current document.

    Args:
        session (Sesion, optional) : filename to save document under (default: None)
            if `sessiokn` is None, the current output_server(...) session is used if present
        document (Document, optional) : BokehJS document to push
            if `document` is None, the current default document is pushed

    Returns:
        None

    """
    if not session:
        session = cursession()

    if not document:
        document = curdoc()

    if session:
        return session.store_document(curdoc())
    else:
        warnings.warn("push() called but no session was supplied and output_server(...) was never called, nothing pushed")

def _doc_wrap(func):
    extra_doc = "\nThis is a convenience function that acts on the current document, and is equivalent to curdoc().%s(...)" % func.__name__
    func.__doc__ = getattr(gf, func.__name__).__doc__ + extra_doc
    return func

def _plot_function(__func__, *args, **kwargs):
    retval = __func__(curdoc(), *args, **kwargs)
    if cursession() and curdoc()._autostore:
        push()
    if _default_file and _default_file['autosave']:
        save()
    return retval

@_doc_wrap
def annular_wedge(x, y, inner_radius, outer_radius, start_angle, end_angle, **kwargs):
    return _plot_function(gf.annular_wedge, x, y, inner_radius, outer_radius, start_angle, end_angle, **kwargs)

@_doc_wrap
def annulus(x, y, inner_radius, outer_radius, **kwargs):
    return _plot_function(gf.annulus, x, y, inner_radius, outer_radius, **kwargs)

@_doc_wrap
def arc(x, y, radius, start_angle, end_angle, **kwargs):
    return _plot_function(gf.arc, x, y, radius, start_angle, end_angle, **kwargs)

@_doc_wrap
def asterisk(x, y, **kwargs):
    return _plot_function(gf.asterisk, x, y, **kwargs)

@_doc_wrap
def bezier(x0, y0, x1, y1, cx0, cy0, cx1, cy1, **kwargs):
    return _plot_function(gf.bezier, x0, y0, x1, y1, cx0, cy0, cx1, cy1, **kwargs)

@_doc_wrap
def circle(x, y, **kwargs):
    return _plot_function(gf.circle, x, y, **kwargs)

@_doc_wrap
def circle_cross(x, y, **kwargs):
    return _plot_function(gf.circle_cross, x, y, **kwargs)

@_doc_wrap
def circle_x(x, y, **kwargs):
    return _plot_function(gf.circle_x, x, y, **kwargs)

@_doc_wrap
def cross(x, y, **kwargs):
    return _plot_function(gf.cross, x, y, **kwargs)

@_doc_wrap
def diamond(x, y, **kwargs):
    return _plot_function(gf.diamond, x, y, **kwargs)

@_doc_wrap
def diamond_cross(x, y, **kwargs):
    return _plot_function(gf.diamond_cross, x, y, **kwargs)

@_doc_wrap
def image(image, x, y, dw, dh, palette, **kwargs):
    return _plot_function(gf.image, image, x, y, dw, dh, palette, **kwargs)

@_doc_wrap
def image_rgba(image, x, y, dw, dh, **kwargs):
    return _plot_function(gf.image_rgba, image, x, y, dw, dh, **kwargs)

@_doc_wrap
def image_url(url, x, y, angle, **kwargs):
    return _plot_function(gf.image_url, url, x, y, angle, **kwargs)

@_doc_wrap
def inverted_triangle(x, y, **kwargs):
    return _plot_function(gf.inverted_triangle, x, y, **kwargs)

@_doc_wrap
def line(x, y, **kwargs):
    return _plot_function(gf.line, x, y, **kwargs)

@_doc_wrap
def multi_line(xs, ys, **kwargs):
    return _plot_function(gf.multi_line, xs, ys, **kwargs)

@_doc_wrap
def oval(x, y, width, height, **kwargs):
    return _plot_function(gf.oval, x, y, width, height, **kwargs)

@_doc_wrap
def patch(x, y, **kwargs):
    return _plot_function(gf.patch, x, y, **kwargs)

@_doc_wrap
def patches(xs, ys, **kwargs):
    return _plot_function(gf.patches, xs, ys, **kwargs)

@_doc_wrap
def quad(left, right, top, bottom, **kwargs):
    return _plot_function(gf.quad, left, right, top, bottom, **kwargs)

@_doc_wrap
def quadratic(x0, y0, x1, y1, cx, cy, **kwargs):
    return _plot_function(gf.quadratic, x0, y0, x1, y1, cx, cy, **kwargs)

@_doc_wrap
def ray(x, y, length, angle, **kwargs):
    return _plot_function(gf.ray, x, y, length, angle, **kwargs)

@_doc_wrap
def rect(x, y, width, height, **kwargs):
    return _plot_function(gf.rect, x, y, width, height, **kwargs)

@_doc_wrap
def segment(x0, y0, x1, y1, **kwargs):
    return _plot_function(gf.segment, x0, y0, x1, y1, **kwargs)

@_doc_wrap
def square(x, y, **kwargs):
    return _plot_function(gf.square, x, y, **kwargs)

@_doc_wrap
def square_cross(x, y, **kwargs):
    return _plot_function(gf.square_cross, x, y, **kwargs)

@_doc_wrap
def square_x(x, y, **kwargs):
    return _plot_function(gf.square_x, x, y, **kwargs)

@_doc_wrap
def text(x, y, text, angle, **kwargs):
    return _plot_function(gf.text, x, y, text, angle, **kwargs)

@_doc_wrap
def triangle(x, y, **kwargs):
    return _plot_function(gf.triangle, x, y, **kwargs)

@_doc_wrap
def wedge(x, y, radius, start_angle, end_angle, **kwargs):
    return _plot_function(gf.wedge, x, y, radius, start_angle, end_angle, **kwargs)

@_doc_wrap
def x(x, y, **kwargs):
    return _plot_function(gf.x, x, y, **kwargs)

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

    Returns:
        None
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
    ds = kwargs.get("source", None)
    names, datasource = _handle_1d_data_args(args, datasource=ds)
    kwargs["source"] = datasource

    markertype = kwargs.get("marker", "circle")

    # TODO: How to handle this? Just call curplot()?
    if not len(_color_fields.intersection(set(kwargs.keys()))):
        kwargs['color'] = get_default_color()
    if not len(_alpha_fields.intersection(set(kwargs.keys()))):
        kwargs['alpha'] = get_default_alpha()

    if markertype not in _marker_types:
        raise ValueError("Invalid marker type '%s'. Use markers() to see a list of valid marker types." % markertype)
    return _marker_types[markertype](*args, **kwargs)

def gridplot(plot_arrangement, name=None):
    """ Generate a plot that arranges several subplots into a grid.

    Args:
        plot_arrangement (list[:class:`Plot <bokeh.objects.Plot>`]) : plots to arrange in a grid
        name (str) : name for this plot

    .. note:: `plot_arrangement` can be nested, e.g [[p1, p2], [p3, p4]]

    Returns:
        grid_plot: the current :class:`GridPlot <bokeh.objects.GridPlot>`
    """
    grid = GridPlot(children=plot_arrangement)
    if name:
        grid._id = name
    # Walk the plot_arrangement and remove them from the plotcontext,
    # so they don't show up twice
    subplots = itertools.chain.from_iterable(plot_arrangement)
    curdoc().get_context().children = list(set(curdoc().get_context().children) - set(subplots))
    curdoc().add(grid)
    curdoc()._current_plot = grid # TODO (bev) don't use private attrs

    if _default_session:
        push()
    if _default_file and _default_file['autosave']:
        save()
    return grid

def xaxis():
    """ Get the current axis objects

    Returns:
        Returns axis object or splattable list of axis objects on the current plot
    """
    p = curplot()
    if p is None:
        return None
    axis = [obj for obj in p.renderers if isinstance(obj, Axis) and obj.location in ("top", "bottom")]
    return _list_attr_splat(axis)

def yaxis():
    """ Get the current `y` axis object(s)

    Returns:
        Returns y-axis object or splattable list of y-axis objects on the current plot
    """
    p = curplot()
    if p is None:
        return None
    axis = [obj for obj in p.renderers if isinstance(obj, Axis) and obj.location in ("left", "right")]
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

def load_object(obj):
    """updates object from the server
    """
    cursession().load_object(obj, curdoc())
