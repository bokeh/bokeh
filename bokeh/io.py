#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Functions for configuring Bokeh output.

'''

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from __future__ import absolute_import

# Stdlib imports
import logging
logger = logging.getLogger(__name__)

import io, itertools, os, warnings

# Third-party imports

# Bokeh imports
from . import browserlib
from .document import Document
from .embed import notebook_div, standalone_html_page_for_models, autoload_server
from .models import Component
from .models.plots import GridPlot
from .models.widgets.layouts import HBox, VBox, VBoxForm
from .model import _ModelInDocument
from .state import State
from .util.notebook import load_notebook, publish_display_data
from .util.string import decode_utf8
from .client import DEFAULT_SESSION_ID, push_session, show_session
from bokeh.resources import DEFAULT_SERVER_HTTP_URL, websocket_url_for_server_url

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

_new_param = {'tab': 2, 'window': 1}

_state = State()

#-----------------------------------------------------------------------------
# Local utilities
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

def output_file(filename, title="Bokeh Plot", autosave=False, mode="cdn", root_dir=None):
    '''Configure the default output state to generate output saved
    to a file when :func:`show` is called.

    Does not change the current Document from curdoc(). File,
    server, and notebook output may be active at the same time, so
    this does not clear the effects of output_server() or
    output_notebook().

    Args:
        filename (str) : a filename for saving the HTML document

        title (str, optional) : a title for the HTML document (default: "Bokeh Plot")

        autosave (bool, optional) : whether to automatically save (default: False)
            If True, then Bokeh plotting APIs may opt to automatically
            save the file more frequently (e.g., after any plotting
            command). If False, then the file is only saved upon calling
            :func:`show` or :func:`save`.

        mode (str, optional) : how to include BokehJS (default: ``'inline'``)
            One of: ``'inline'``, ``'cdn'``, ``'relative(-dev)'`` or
            ``'absolute(-dev)'``. See :class:`bokeh.resources.Resources` for more details.

        root_dir (str, optional) : root directory to use for 'absolute' resources. (default: None)
            This value is ignored for other resource types, e.g. ``INLINE`` or
            ``CDN``.

    Returns:
        None

    .. note::
        Generally, this should be called at the beginning of an interactive
        session or the top of a script.

    .. warning::
        This output file will be overwritten on every save, e.g., each time
        show() or save() is invoked, or any time a Bokeh plotting API
        causes a save, if ``autosave`` is True.

    '''
    _state.output_file(
        filename,
        title=title,
        autosave=autosave,
        mode=mode,
        root_dir=root_dir
    )

def output_notebook(resources=None, verbose=False, hide_banner=False):
    ''' Configure the default output state to generate output in
    Jupyter/IPython notebook cells when :func:`show` is called.

    If output_server() has also been called, the notebook cells
    are loaded from the configured server; otherwise, Bokeh pushes
    HTML to the notebook directly.

    Args:
        resources (Resource, optional) :
            How and where to load BokehJS from (default: INLINE)

        verbose (bool, optional) :
            whether to display detailed BokehJS banner (default: False)

        hide_banner (bool, optional):
            whether to hide the Bokeh banner (default: False)

    Returns:
        None

    .. note::
        Generally, this should be called at the beginning of an interactive
        session or the top of a script.

    '''
    load_notebook(resources, verbose, hide_banner)
    _state.output_notebook()

def output_server(session_id=DEFAULT_SESSION_ID, url="default", autopush=False):
    """Store Bokeh plots and objects on a Bokeh server.

    File, server, and notebook output may be active at the
    same time, so this does not clear the effects of
    output_file() or output_notebook(). output_server()
    changes the behavior of output_notebook(), so the notebook
    will load output cells from the server rather than
    receiving them as inline HTML.

    Args:
        session_id (str, optional) : Name of session to push on Bokeh server (default: "default")
            Any existing session with the same name will be overwritten.

        url (str, optional) : base URL of the Bokeh server (default: "default")
            If "default" use the default localhost URL.

        autopush (bool, optional) : whether to automatically push (default: False)
            If True, then Bokeh plotting APIs may opt to automatically
            push the document more frequently (e.g., after any plotting
            command). If False, then the document is only pushed upon calling
            :func:`show` or :func:`push`.

    Returns:
        None

    .. warning::
        Calling this function will replace any existing server-side document in the named session.

    """

    _state.output_server(session_id=session_id, url=url, autopush=autopush)

def set_curdoc(doc):
    '''Configure the current document (returned by curdoc()).

    This is the document we will save or push according to
    output_file(), output_server(), etc. configuration.

    Args:
        doc (Document) : Document we will output.

    Returns:
        None

    .. note::
        Generally, this should be called at the beginning of an interactive
        session or the top of a script.

    .. warning::
        Calling this function will replace any existing document.

    '''
    _state.document = doc

def curdoc():
    ''' Return the document for the current default state.

    Returns:
        doc : the current default document object.

    '''
    return _state.document

def curstate():
    ''' Return the current State object

    Returns:
      state : the current default State object
    '''
    return _state

def show(obj, browser=None, new="tab"):
    ''' Immediately display a plot object.

    In an IPython/Jupyter notebook, the output is displayed in an output
    cell. Otherwise, a browser window or tab is autoraised to display the
    plot object.

    If both a server session and notebook output have been configured on
    the default output state then the notebook output will be generated to
    load the plot from that server session.

    Args:
        obj (Component object) : a plot object to display

        browser (str, optional) : browser to show with (default: None)
            For systems that support it, the **browser** argument allows
            specifying which browser to display in, e.g. "safari", "firefox",
            "opera", "windows-default" (see the ``webbrowser`` module
            documentation in the standard lib for more details).

        new (str, optional) : new file output mode (default: "tab")
            For file-based output, opens or raises the browser window
            showing the current output file.  If **new** is 'tab', then
            opens a new tab. If **new** is 'window', then opens a new window.

    Returns:
        None

    .. note::
        The ``browser`` and ``new`` parameters are ignored when showing in
        an IPython/Jupyter notebook.

    '''
    _show_with_state(obj, _state, browser, new)

def _show_with_state(obj, state, browser, new):
    controller = browserlib.get_browser_controller(browser=browser)

    if state.notebook:
        _show_notebook_with_state(obj, state)

    elif state.session_id and state.server_url:
        _show_server_with_state(obj, state, new, controller)

    if state.file:
        _show_file_with_state(obj, state, new, controller)

def _show_file_with_state(obj, state, new, controller):
    save(obj, state=state)
    controller.open("file://" + os.path.abspath(state.file['filename']), new=_new_param[new])

def _show_notebook_with_state(obj, state):
    if state.session_id:
        push(state=state)
        snippet = autoload_server(obj, session_id=state.session_id, url=state.server_url)
        publish_display_data({'text/html': snippet})
    else:
        publish_display_data({'text/html': notebook_div(obj)})

def _show_server_with_state(obj, state, new, controller):
    push(state=state)
    show_session(session_id=state.session_id, server_url=state.server_url,
                 new=new, controller=controller)

def save(obj, filename=None, resources=None, title=None, state=None, validate=True):
    ''' Save an HTML file with the data for the current document.

    Will fall back to the default output state (or an explicitly provided
    :class:`State` object) for ``filename``, ``resources``, or ``title`` if they
    are not provided.

    Args:
        obj (Document or model object) : a plot object to save

        filename (str, optional) : filename to save document under (default: None)
            If None, use the default state configuration, otherwise raise a
            ``RuntimeError``.

        resources (Resources, optional) : A Resources config to use (default: None)
            If None, use the default state configuration, if there is one.
            otherwise use ``resources.INLINE``.

        title (str, optional) : a title for the HTML document (default: None)
            If None, use the default state title value, if there is one.
            Otherwise, use "Bokeh Plot"

        validate (bool, optional) : True to check integrity of the models

    Returns:
        None

    Raises:
        RuntimeError

    '''
    if state is None:
        state = _state

    filename, resources, title = _get_save_args(state, filename, resources, title)

    _save_helper(obj, filename, resources, title, validate)

def _get_save_args(state, filename, resources, title):

    if filename is None and state.file:
        filename = state.file['filename']

    if resources is None and state.file:
        resources = state.file['resources']

    if title is None and state.file:
        title = state.file['title']

    if filename is None:
        raise RuntimeError("save() called but no filename was supplied and output_file(...) was never called, nothing saved")

    if resources is None:
        warnings.warn("save() called but no resources were supplied and output_file(...) was never called, defaulting to resources.CDN")
        from .resources import CDN
        resources = CDN

    if title is None:
        warnings.warn("save() called but no title was supplied and output_file(...) was never called, using default title 'Bokeh Plot'")
        title = "Bokeh Plot"

    return filename, resources, title

def _save_helper(obj, filename, resources, title, validate):
    with _ModelInDocument(obj):
        if isinstance(obj, Component):
            doc = obj.document
        elif isinstance(obj, Document):
            doc = obj
        else:
            raise RuntimeError("Unable to save object of type '%s'" % type(obj))

        if validate:
            doc.validate()

        html = standalone_html_page_for_models(obj, resources, title)

        with io.open(filename, "w", encoding="utf-8") as f:
            f.write(decode_utf8(html))

# this function exists mostly to be mocked in tests
def _push_to_server(websocket_url, document, session_id, io_loop):
    session = push_session(document, session_id=session_id, url=websocket_url, io_loop=io_loop)
    session.close()
    session.loop_until_closed()

def push(session_id=None, url=None, document=None, state=None, io_loop=None, validate=True):
    ''' Update the server with the data for the current document.

    Will fall back to the default output state (or an explicitly provided
    :class:`State` object) for ``session_id``, ``url``, or ``document`` if they are not
    provided.

    Args:
        session_id (str, optional) : a Bokeh server session ID to push objects to

        url (str, optional) : a Bokeh server URL to push objects to

        document (Document, optional) : A :class:`bokeh.document.Document` to use

        state (State, optional) : A state to use for any output_server() configuration of session or url

        io_loop (tornado.ioloop.IOLoop, optional) : Tornado IOLoop to use for connecting to server

        validate (bool, optional) : True to check integrity of the document we are pushing

    Returns:
        None

    '''
    if state is None:
        state = _state

    if not session_id:
        session_id = state.session_id

    if not session_id:
        session_id = DEFAULT_SESSION_ID

    if not url:
        url = state.server_url

    if not url:
        url = DEFAULT_SERVER_HTTP_URL

    if not document:
        document = state.document

    if not document:
        warnings.warn("No document to push")

    if validate:
        document.validate()

    _push_to_server(websocket_url=websocket_url_for_server_url(url), document=document,
                    session_id=session_id, io_loop=io_loop)

def reset_output(state=None):
    ''' Clear the default state of all output modes.

    Returns:
        None

    '''
    _state.reset()

def _remove_roots(subplots):
    doc = _state.document
    for sub in subplots:
        if sub in doc.roots:
            doc.remove_root(sub)

def _push_or_save(obj):
    if _state.session_id and _state.autopush:
        push()
    if _state.file and _state.autosave:
        save(obj)

def gridplot(plot_arrangement, **kwargs):
    ''' Generate a plot that arranges several subplots into a grid.

    Args:
        plot_arrangement (nested list of Plots) : plots to arrange in a grid
        **kwargs: additional attributes to pass in to GridPlot() constructor

    .. note:: ``plot_arrangement`` can be nested, e.g [[p1, p2], [p3, p4]]

    Returns:
        grid_plot: a new :class:`GridPlot <bokeh.models.plots.GridPlot>`

    '''
    subplots = itertools.chain.from_iterable(plot_arrangement)
    _remove_roots(subplots)
    grid = GridPlot(children=plot_arrangement, **kwargs)
    curdoc().add_root(grid)
    _push_or_save(grid)
    return grid

def hplot(*children, **kwargs):
    ''' Generate a layout that arranges several subplots horizontally.

    '''
    _remove_roots(children)
    layout = HBox(children=list(children), **kwargs)
    curdoc().add_root(layout)
    _push_or_save(layout)
    return layout

def vplot(*children, **kwargs):
    ''' Generate a layout that arranges several subplots vertically.

    '''
    _remove_roots(children)
    layout = VBox(children=list(children), **kwargs)
    curdoc().add_root(layout)
    _push_or_save(layout)
    return layout

def vform(*children, **kwargs):
    ''' Generate a layout that arranges several subplots vertically.

    '''
    layout = VBoxForm(children=list(children), **kwargs)
    curdoc().add_root(layout)
    _push_or_save(layout)
    return layout
