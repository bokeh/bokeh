#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Functions for configuring Bokeh output.

"""

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
from .embed import notebook_div, file_html, autoload_server
from .models import Widget
from .models.plots import GridPlot
from .models.widgets.layouts import HBox, VBox
from .state import State
from .util.notebook import load_notebook, publish_display_data
from .util.string import decode_utf8

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

def output_file(filename, title="Bokeh Plot", autosave=False, mode="inline", root_dir=None):
    ''' Configure the default output state to generate output saved
    to a file when :func:`show` is called.

    Args:
        filename (str) : a filename for saving the HTML document

        title (str, optional) : a title for the HTML document (default: "Bokeh Plot")

        autosave (bool, optional) : whether to automatically save (default: False)
            If True, then Bokeh plotting APIs may opt to automatically
            save the file more frequently (e.g., after any plotting
            command). If False, then the file is only saved upon calling
            :func:`show` or :func:`show`.

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

def output_notebook(url=None, docname=None, session=None, name=None,
                    resources=None, verbose=False, hide_banner=False):
    ''' Configure the default output state to generate output in
    Jupyter/IPython notebook cells when :func:`show` is called.

    Args:
        url (str, optional) : URL of the Bokeh server (default: "default")
            If "default", then ``session.DEFAULT_SERVER_URL`` is used.

        docname (str) : Name of document to push on Bokeh server (default: None)
            Any existing documents with the same name will be overwritten.

        session (Session, optional) : An explicit session to use (default: None)
            If None, a new default session is created.

        name (str, optional) : A name for the session (default: None)
            If None, the server URL is used as the name

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
    _state.output_notebook(
        url=url, docname=docname, session=session, name=name
    )

def output_server(docname, session=None, url="default", name=None, clear=True):
    ''' Configure the default output state to generate output that gets
    pushed to a bokeh-server when :func:`show` or :func:`push` is called.

    Args:
        docname (str) : Name of document to push on Bokeh server
            Any existing documents with the same name will be overwritten.

        session (Session, optional) : An explicit session to use (default: None)
            If None, a new default session is created.

        url (str, optional) : URL of the Bokeh server (default: "default")
            If "default", then ``session.DEFAULT_SERVER_URL`` is used.

        name (str, optional) : A name for the session (default: None)
            If None, the server URL is used as the name

        clear (bool, optional) : Whether to clear the document (default: True)
            If True, an existing server document will be cleared of any
            existing objects.

    Returns:
        None

    .. note::
        Generally, this should be called at the beginning of an interactive
        session or the top of a script.

    .. warning::
        Calling this function will replace any existing default session.

    '''
    _state.output_server(
        docname, session=session, url=url, name=name, clear=clear
    )

def curdoc():
    ''' Return the document for the current default state.

    Returns:
        doc : the current default document object.

    .. note::
        When using this API form within the server (e.g. in a Bokeh app), the
        appropriate document from the request context is returned, rather than
        the standard default global state. Doing so allows the same code using
        curdoc() to function correctly whether it is being run inside a server
        or not.

    '''
    try:
        from flask import request
        doc = request.bokeh_server_document
        logger.debug("curdoc() returning Document from flask request context")
        return doc

    except (ImportError, RuntimeError, AttributeError):
        return _state.document

def cursession():
    ''' Return the session for the current default state, if there is one.

    Returns:
        session : the current default session object (or None)

    '''
    return _state.session

def show(obj, browser=None, new="tab"):
    """ Immediately display a plot object.

    In an IPython/Jupyter notebook, the output is displayed in an output
    cell. Otherwise, a browser window or tab is autoraised to display the
    plot object.

    If both a server session and notebook output have been configured on
    the default output state then the notebook output will be generated to
    load the plot from that server session.

    Args:
        obj (Widget/Plot object): a plot object to display

        browser (str, optional) : browser to show with (default: None)
            For systems that support it, the **browser** argument allows
            specifying which browser to display in, e.g. "safari", "firefox",
            "opera", "windows-default" (see the ``webbrowser`` module
            documentation in the standard lib for more details).

        new (str, optional) : new file output mode (default: "tab")
            For file-based output, opens or raises the browser window
            showing the current output file.  If **new** is 'tab', then
            opens a new tab. If **new** is 'window', then opens a new window.

    .. note::
        The ``browser`` and ``new`` parameters are ignored when showing in
        an IPython/Jupyter notebook.

    """
    _show_with_state(obj, _state, browser, new)

def _show_with_state(obj, state, browser, new):

    controller = browserlib.get_browser_controller(browser=browser)

    if state.notebook:
        _show_notebook_with_state(obj, state)

    elif state.session:
        _show_server_with_state(obj, state, new, controller)

    if state.file:
        _show_file_with_state(obj, state, new, controller)

def _show_file_with_state(obj, state, new, controller):
    save(obj, state=state)
    controller.open("file://" + os.path.abspath(state.file['filename']), new=_new_param[new])

def _show_notebook_with_state(obj, state):
    if state.session:
        push(state=state)
        snippet = autoload_server(obj, state.session)
        publish_display_data({'text/html': snippet})
    else:
        publish_display_data({'text/html': notebook_div(obj)})

def _show_server_with_state(obj, state, new, controller):
    push(state=state)
    controller.open(state.session.object_link(state.document.context), new=_new_param[new])

def save(obj, filename=None, resources=None, title=None, state=None):
    """ Save an HTML file with the data for the current document.

    Will fall back to the default output state (or an explicitly provided
    :class:`State` object) for ``filename``, ``resources``, or ``title`` if they
    are not provided.

    Args:
        obj (Document or Widget/Plot object) :

        filename (str, optional) : filename to save document under (default: None)
            If None, use the default state configuration, otherwise raise a
            ``RuntimeError``.

        resources (Resources, optional) : A Resources config to use (default: None)
            If None, use the default state configuration, if there is one.
            otherwise use ``resources.INLINE``.

        title (str, optional) : a title for the HTML document (default: None)
            If None, use the default state title value, if there is one.
            Otherwise, use "Bokeh Plot"

    Returns:
        None

    Raises:
        RuntimeError

    """
    if state is None:
        state = _state

    filename, resources, title = _get_save_args(state, filename, resources, title)

    _save_helper(obj, filename, resources, title)

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
        warnings.warn("save() called but no resources was supplied and output_file(...) was never called, defaulting to resources.INLINE")
        from .resources import INLINE
        resources = INLINE

    if title is None:
        warnings.warn("save() called but no title was supplied and output_file(...) was never called, using default title 'Bokeh Plot'")
        title = "Bokeh Plot"

    return filename, resources, title

def _save_helper(obj, filename, resources, title):

    # TODO: (bev) Widget seems awkward as a base class to check here
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

def push(session=None, document=None, state=None):
    """ Update the server with the data for the current document.

    Will fall back to the default output state (or an explicitly provided
    :class:`State` object) for ``session`` or ``document`` if they are not
    provided.

    Args:
        session (Session, optional) : a Bokeh server session to push objects to

        document (Document, optional) : A :class:`bokeh.document.Document` to use

    Returns:
        None

    """
    if state is None:
        state = _state

    if not session:
        session = state.session

    if not document:
        document = state.document

    if not session:
        warnings.warn("push() called but no session was supplied and output_server(...) was never called, nothing pushed")
        return

    return session.store_document(document)

def reset_output(state=None):
    ''' Clear the default state of all output modes.

    Returns:
        None

    '''
    _state.reset()

def _deduplicate_plots(plot, subplots):
    doc = _state.document
    doc.context.children = list(set(doc.context.children) - set(subplots))
    doc.add(plot)
    doc._current_plot = plot # TODO (bev) don't use private attrs

def _push_or_save(obj):
    if _state.session and _state.document.autostore:
        push()
    if _state.file and _state.file['autosave']:
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

def hplot(*children, **kwargs):
    """ Generate a layout that arranges several subplots horizontally.

    """
    layout = HBox(children=list(children), **kwargs)
    _deduplicate_plots(layout, children)
    _push_or_save(layout)
    return layout

def vplot(*children, **kwargs):
    """ Generate a layout that arranges several subplots vertically.

    """
    layout = VBox(children=list(children), **kwargs)
    _deduplicate_plots(layout, children)
    _push_or_save(layout)
    return layout
