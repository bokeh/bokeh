from __future__ import print_function

import logging
logger = logging.getLogger(__name__)

import io
import itertools
import os
import re
import time
import warnings

from six import string_types

from . import browserlib
from . import _glyph_functions as gf
from .document import Document
from .embed import notebook_div, file_html, autoload_server
from .models import (
    Axis, FactorRange, Grid, GridPlot, HBox, Legend, LogAxis, Plot, Tool, VBox, Widget
)
from .plotting_helpers import (
    get_default_color, get_default_alpha, _handle_1d_data_args, _list_attr_splat,
    _get_range, _get_axis_class, _get_num_minor_ticks, _tool_from_string,
    _process_tools_arg
)
from .resources import Resources
from .session import DEFAULT_SERVER_URL, Session
from .utils import decode_utf8, publish_display_data

# extra imports -- just things to add to 'from plotting import *'
from bokeh.models import ColumnDataSource

_default_document = Document()

_default_session = None

_default_file = None

_default_notebook = None

DEFAULT_TOOLS = "pan,wheel_zoom,box_zoom,save,resize,reset"

class Figure(Plot):
    __subtype__ = "Figure"
    __view_model__ = "Plot"

    def __init__(self, *arg, **kw):

        tools = kw.pop("tools", DEFAULT_TOOLS)

        x_range = kw.pop("x_range", None)
        y_range = kw.pop("y_range", None)

        x_axis_type = kw.pop("x_axis_type", "auto")
        y_axis_type = kw.pop("y_axis_type", "auto")

        x_minor_ticks = kw.pop('x_minor_ticks', 'auto')
        y_minor_ticks = kw.pop('y_minor_ticks', 'auto')

        x_axis_location = kw.pop("x_axis_location", "below")
        y_axis_location = kw.pop("y_axis_location", "left")

        x_axis_label = kw.pop("x_axis_label", "")
        y_axis_label = kw.pop("y_axis_label", "")

        super(Figure, self).__init__(*arg, **kw)

        self.x_range = _get_range(x_range)
        self.y_range = _get_range(y_range)

        x_axiscls = _get_axis_class(x_axis_type, self.x_range)
        if x_axiscls:
            if x_axiscls is LogAxis:
                self.x_mapper_type = 'log'
            xaxis = x_axiscls(plot=self)
            xaxis.ticker.num_minor_ticks = _get_num_minor_ticks(x_axiscls, x_minor_ticks)
            axis_label = x_axis_label
            if axis_label:
                xaxis.axis_label = axis_label
            xgrid = Grid(plot=self, dimension=0, ticker=xaxis.ticker)
            if x_axis_location == "above":
                self.above.append(xaxis)
            elif x_axis_location == "below":
                self.below.append(xaxis)

        y_axiscls = _get_axis_class(y_axis_type, self.y_range)
        if y_axiscls:
            if y_axiscls is LogAxis:
                self.y_mapper_type = 'log'
            yaxis = y_axiscls(plot=self)
            yaxis.ticker.num_minor_ticks = _get_num_minor_ticks(y_axiscls, y_minor_ticks)
            axis_label = y_axis_label
            if axis_label:
                yaxis.axis_label = axis_label
            ygrid = Grid(plot=self, dimension=1, ticker=yaxis.ticker)
            if y_axis_location == "left":
                self.left.append(yaxis)
            elif y_axis_location == "right":
                self.right.append(yaxis)

        tool_objs = _process_tools_arg(self, tools)
        self.add_tools(*tool_objs)

    def _axis(self, *sides):
        objs = []
        for s in sides:
            objs.extend(getattr(self, s, []))
        axis = [obj for obj in objs if isinstance(obj, Axis)]
        return _list_attr_splat(axis)

    @property
    def xaxis(self):
        """ Get the current `x` axis object(s)

        Returns:
            splattable list of x-axis objects on this Plot
        """
        return self._axis("above", "below")

    @property
    def yaxis(self):
        """ Get the current `y` axis object(s)

        Returns:
            splattable list of y-axis objects on this Plot
        """
        return self._axis("left", "right")

    @property
    def axis(self):
        """ Get all the current axis objects

        Returns:
            splattable list of axis objects on this Plot
        """
        return _list_attr_splat(self.xaxis + self.yaxis)

    @property
    def legend(self):
        """ Get the current :class:`legend <bokeh.models.Legend>` object(s)

        Returns:
            splattable list of legend objects on this Plot
        """
        legends = [obj for obj in self.renderers if isinstance(obj, Legend)]
        return _list_attr_splat(legends)

    def _grid(self, dimension):
        grid = [obj for obj in self.renderers if isinstance(obj, Grid) and obj.dimension==dimension]
        return _list_attr_splat(grid)

    @property
    def xgrid(self):
        """ Get the current `x` :class:`grid <bokeh.models.Grid>` object(s)

        Returns:
            splattable list of legend objects on this Plot
        """
        return self._grid(0)

    @property
    def ygrid(self):
        """ Get the current `y` :class:`grid <bokeh.models.Grid>` object(s)

        Returns:
            splattable list of y-grid objects on this Plot
        """
        return self._grid(1)

    @property
    def grid(self):
        """ Get the current :class:`grid <bokeh.models.Grid>` object(s)

        Returns:
            splattable list of grid objects on this Plot
        """
        return _list_attr_splat(self.xgrid + self.ygrid)

    annular_wedge     = gf.annular_wedge
    annulus           = gf.annulus
    arc               = gf.arc
    asterisk          = gf.asterisk
    bezier            = gf.bezier
    circle            = gf.circle
    circle_cross      = gf.circle_cross
    circle_x          = gf. circle_x
    cross             = gf.cross
    diamond           = gf.diamond
    diamond_cross     = gf.diamond_cross
    image             = gf.image
    image_rgba        = gf.image_rgba
    image_url         = gf.image_url
    inverted_triangle = gf.inverted_triangle
    line              = gf.line
    multi_line        = gf.multi_line
    oval              = gf.oval
    patch             = gf.patch
    patches           = gf.patches
    quad              = gf.quad
    quadratic         = gf.quadratic
    ray               = gf.ray
    rect              = gf.rect
    segment           = gf.segment
    square            = gf.square
    square_cross      = gf.square_cross
    square_x          = gf.square_x
    text              = gf.text
    triangle          = gf.triangle
    wedge             = gf.wedge
    x                 = gf.x

    def scatter(self, *args, **kwargs):
        """ Creates a scatter plot of the given x and y items.

        Args:
            *args : The data to plot.  Can be of several forms:

                (X, Y)
                    Two 1D arrays or iterables
                (XNAME, YNAME)
                    Two bokeh DataSource/ColumnsRef

            marker (str, optional): a valid marker_type, defaults to "circle"
            color (color value, optional): shorthand to set both fill and line color

        All the :ref:`userguide_objects_line_properties` and :ref:`userguide_objects_fill_properties` are
        also accepted as keyword parameters.

        Examples:

            >>> p.scatter([1,2,3],[4,5,6], fill_color="red")
            >>> p.scatter("data1", "data2", source=data_source, ...)

        """
        ds = kwargs.get("source", None)
        names, datasource = _handle_1d_data_args(args, datasource=ds)
        kwargs["source"] = datasource

        markertype = kwargs.get("marker", "circle")

        if not len(_color_fields.intersection(set(kwargs.keys()))):
            kwargs['color'] = get_default_color()
        if not len(_alpha_fields.intersection(set(kwargs.keys()))):
            kwargs['alpha'] = get_default_alpha()

        if markertype not in _marker_types:
            raise ValueError("Invalid marker type '%s'. Use markers() to see a list of valid marker types." % markertype)

        # TODO (bev) make better when plotting.scatter is removed
        conversions = {
            "*": "asterisk",
            "+": "cross",
            "o": "circle",
            "ox": "circle_x",
            "o+": "circle_cross"
        }
        if markertype in conversions:
            markertype = conversions[markertype]

        return getattr(self, markertype)(*args, **kwargs)

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

def figure(**kwargs):
    ''' Activate a new figure for plotting.

    All subsequent plotting operations will affect the new figure.

    This function accepts all plot style keyword parameters.

    Returns:
       figure : a new :class:`Plot <bokeh.models.plots.Plot>`

    '''
    if 'plot_width' in kwargs and 'width' in kwargs:
        raise ValueError("figure() called but both plot_width and width supplied, supply only one")
    if 'plot_height' in kwargs and 'height' in kwargs:
        raise ValueError("figure() called but both plot_height and height supplied, supply only one")
    if 'height' in kwargs:
        kwargs['plot_height'] = kwargs.pop('height')
    if 'width' in kwargs:
        kwargs['plot_width'] = kwargs.pop('width')

    fig = Figure(**kwargs)
    curdoc()._current_plot = fig
    if curdoc().autoadd:
        curdoc().add(fig)
    return fig

def output_server(docname, session=None, url="default", name=None, clear=True):
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
        clear (bool, optional) :
            should an existing server document be cleared of any existing
            plots. (default: True)

    Additional keyword arguments like **username**, **userapikey**,
    and **base_url** can also be supplied.

    Returns:
        None

    .. note:: Generally, this should be called at the beginning of an
              interactive session or the top of a script.

    .. note:: By default, calling this function will replaces any existing
              default Server session.

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
    else:
        _default_session = session
    session.use_doc(docname)
    session.load_document(curdoc())
    if clear:
        curdoc().clear()

def output_notebook(url=None, docname=None, session=None, name=None):
    if session or url or name:
        if docname is None:
            docname = "IPython Session at %s" % time.ctime()
        output_server(docname, url=url, session=session, name=name)
    global _default_notebook
    _default_notebook = True

def output_file(filename, title="Bokeh Plot", autosave=False, mode="inline", root_dir=None):
    """ Outputs to a static HTML file.

    .. note:: This file will be overwritten each time show() or save() is invoked.

    Args:
        autosave (bool, optional) : whether to automatically save (default: False)
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
        'resources' : Resources(mode=mode, root_dir=root_dir),
        'autosave'  : autosave,
        'title'     : title,
    }

    if os.path.isfile(filename):
        print("Session output file '%s' already exists, will be overwritten." % filename)


def show(obj, browser=None, new="tab", url=None):
    """ Immediately display a plot object.

    In an IPython/Jupyter notebook, the output is displayed in an output cell.
    Otherwise, a browser window or tab is autoraised to display the plot object.

    Args:
        obj (Widget/Plot object): a plot object to display

        browser (str, optional) : browser to show with (default: None)
            For systems that support it, the **browser** argument allows specifying
            which browser to display in, e.g. "safari", "firefox", "opera",
            "windows-default" (see the webbrowser module documentation in the
            standard lib for more details).

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

    if notebook and session:
        push(session=session)
        snippet = autoload_server(obj, cursession())
        publish_display_data({'text/html': snippet})

    elif notebook:
        publish_display_data({'text/html': notebook_div(obj)})

    elif session:
        push()
        if url:
            controller.open(url, new=new_param)
        else:
            controller.open(session.object_link(curdoc().context))

    elif filename:
        save(obj, filename=filename)
        controller.open("file://" + os.path.abspath(filename), new=new_param)


def save(obj, filename=None, resources=None, title=None):
    """ Updates the file with the data for the current document.

    If a filename is supplied, or output_file(...) has been called, this will
    save the plot to the given filename.

    Args:
        obj (Document or Widget/Plot object)
        filename (str, optional) : filename to save document under
            if `filename` is None, the current output_file(...) filename is used if present
        resources (Resources, optional) : BokehJS resource config to use
            if `resources` is None, the current default resource config is used, failing that resources.INLINE is used


        title (str, optional) : title of the bokeh plot (default: None)
        	if 'title' is None, the current default title config is used, failing that 'Bokeh Plot' is used

    Returns:
        None

    """
    if filename is None and _default_file:
        filename = _default_file['filename']

    if resources is None and _default_file:
        resources = _default_file['resources']

    if title is None and _default_file:
        title = _default_file['title']

    if not filename:
        warnings.warn("save() called but no filename was supplied and output_file(...) was never called, nothing saved")
        return

    if not resources:
        warnings.warn("save() called but no resources was supplied and output_file(...) was never called, defaulting to resources.INLINE")
        from .resources import INLINE
        resources = INLINE


    if not title:
        warnings.warn("save() called but no title was supplied and output_file(...) was never called, using default title 'Bokeh Plot'")
        title = "Bokeh Plot"

    if isinstance(obj, Widget):
        doc = Document()
        doc.add(obj)
    elif isinstance(obj, Document):
        doc = obj
    else:
        raise RuntimeError("Unable to save object of type '%s'" % type(obj))

    html = file_html(doc, resources, title)
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

_marker_types = [
    "asterisk",
    "circle",
    "circle_cross",
    "circle_x",
    "cross",
    "diamond",
    "diamond_cross",
    "inverted_triangle",
    "square",
    "square_x",
    "square_cross",
    "triangle",
    "x",
    "*",
    "+",
    "o",
    "ox",
    "o+",
]

def markers():
    """ Prints a list of valid marker types for scatter()

    Returns:
        None
    """
    print(list(sorted(_marker_types.keys())))

_color_fields = set(["color", "fill_color", "line_color"])
_alpha_fields = set(["alpha", "fill_alpha", "line_alpha"])

def _deduplicate_plots(plot, subplots):
    doc = curdoc()
    doc.context.children = list(set(doc.context.children) - set(subplots))
    doc.add(plot)
    doc._current_plot = plot # TODO (bev) don't use private attrs

def _push_or_save(obj):
    if cursession() and curdoc().autostore:
        push()
    if _default_file and _default_file['autosave']:
        save(obj)

def gridplot(plot_arrangement, **kwargs):
    """ Generate a plot that arranges several subplots into a grid.

    Args:
        plot_arrangement (nested list of Plots) : plots to arrange in a grid
        **kwargs: additional attributes to pass in to GridPlot() constructor

    .. note:: `plot_arrangement` can be nested, e.g [[p1, p2], [p3, p4]]

    Returns:
        grid_plot: a new :class:`GridPlot <bokeh.models.plots.GridPlot>`
    """
    grid = GridPlot(children=plot_arrangement, **kwargs)
    subplots = itertools.chain.from_iterable(plot_arrangement)
    _deduplicate_plots(grid, subplots)
    _push_or_save(grid)
    return grid

def load_object(obj):
    """updates object from the server
    """
    cursession().load_object(obj, curdoc())
