#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Encapsulate implicit state that is useful for Bokeh plotting APIs.

Generating output for Bokeh plots requires coordinating several things:

:class:`Documents <bokeh.document>`
    Group together Bokeh models that may be shared between plots (e.g.,
    range or data source objects) into one common namespace.

:class:`Resources <bokeh.resources>`
    Control how JavaScript and CSS for the client library BokehJS are
    included and used in the generated output.

:class:`Sessions <bokeh.session>`
    Create and manage persistent connections to a Bokeh server.

It is certainly possible to handle the configuration of these objects
manually, and several examples of this can be found in ``examples/glyphs``.
When developing sophisticated applications, it may be necessary or
desirable to work at this level. However, for general use this would
quickly become burdensome. The ``bokeh.state`` module provides a ``State``
class that encapsulates these objects and ensures their proper configuration.
It also provides a "global" or "default" ``State`` object, as well as
convenience functions for manipulating this default state.

"""

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Stdlib imports
import logging
logger = logging.getLogger(__name__)

import io, os, time, warnings

# Third-party imports

# Bokeh imports
from . import browserlib
from .document import Document
from .embed import notebook_div, file_html, autoload_server
from .models import Widget
from .resources import Resources
from .session import DEFAULT_SERVER_URL, Session
from .utils import decode_utf8, publish_display_data

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

_new_param = {'tab': 2, 'window': 1}

#-----------------------------------------------------------------------------
# Local utilities
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class State(object):
    """ Manage state related to controlling Bokeh output.

    Attributes:
        document (:class:`bokeh.document.Document`): a default document to use

        file (dict) : default filename, resources, etc. for file output
            This dictionary has the following form::

                {
                    'filename'  : # filename to use when saving
                    'resources' : # resources configuration
                    'autosave'  : # whether to autosave
                    'title'     : # a title for the HTML document
                }

        notebook (bool) : whether to generate notebook output

        session (:class:`bokeh.session.Session`) : a default session for Bokeh server output

    """

    def __init__(self):
        self.reset()

    @property
    def document(self):
        return self._document

    @property
    def file(self):
        return self._file

    @property
    def notebook(self):
        return self._notebook

    @property
    def session(self):
        return self._session

    def reset(self):
        ''' Deactivate all currently active output modes.

        Subsequent calls to show() will not render until a new output mode is
        activated.

        Returns:
            None

        '''
        self._document = Document()
        self._file = None
        self._notebook = False
        self._session = None

    def output_file(self, filename, title="Bokeh Plot", autosave=False, mode="inline", root_dir=None):
        """ Output to a static HTML file.

        Args:
            filename (str) : a filename for saving the HTML document

            title (str, optional) : a title for the HTML document

            autosave (bool, optional) : whether to automatically save (default: False)
                If True, then Bokeh plotting APIs may opt to automatically
                save the file more frequently (e.g., after any plotting
                command). If False, then the file is only saved upon calling
                :func:`show` or :func:`show`.

            mode (str, optional) : how to include BokehJS (default: ``'inline'``)
                One of: ``'inline'``, ``'cdn'``, ``'relative(-dev)'`` or
                ``'absolute(-dev)'``. See :class:`bokeh.resources.Resources` for more details.

            root_dir (str, optional) :  root directory to use for 'absolute' resources. (default: None)
            This value is ignored for other resource types, e.g. ``INLINE`` or
            ``CDN``.

        .. warning::
            This output file will be overwritten on every save, e.g., each time
            show() or save() is invoked, or any time a Bokeh plotting API
            causes a save, if ``autosave`` is True.

        """
        self._file = {
            'filename'  : filename,
            'resources' : Resources(mode=mode, root_dir=root_dir),
            'autosave'  : autosave,
            'title'     : title,
        }

        if os.path.isfile(filename):
            logger.info("Session output file '%s' already exists, will be overwritten." % filename)

    def output_notebook(self, url=None, docname=None, session=None, name=None):
        """ Generate output in Jupyter/IPython notebook cells.

        Args:
            url (str, optional) : URL of the Bokeh server (default: "default")
                If "default", then ``session.DEFAULT_SERVER_URL`` is used.

            docname (str) : Name of document to push on Bokeh server
                Any existing documents with the same name will be overwritten.

            session (Session, optional) : An explicit session to use (default: None)
                If None, a new default session is created.

            name (str, optional) : A name for the session
                If None, the server URL is used as the name

        Returns:
            None

        """
        self._notebook = True

        if session or url or name:
            if docname is None:
                docname = "IPython Session at %s" % time.ctime()
            self.output_server(docname, url=url, session=session, name=name)

    def output_server(self, docname, session=None, url="default", name=None, clear=True):
        """ Store Bokeh plots and objects on a Bokeh server.

        Args:
            docname (str) : Name of document to push on Bokeh server
                Any existing documents with the same name will be overwritten.

            session (Session, optional) : An explicit session to use (default: None)
                If None, a new default session is created.

            url (str, optional) : URL of the Bokeh server (default: "default")
                If "default", then ``session.DEFAULT_SERVER_URL`` is used.

            name (str, optional) : A name for the session
                If None, the server URL is used as the name

            clear (bool, optional) : Whether to clear the document (default: True)
                If True, an existing server document will be cleared of any
                existing objects.

        Returns:
            None

        .. warning::
            Calling this function will replace any existing default session.

        """
        if url == "default":
            url = DEFAULT_SERVER_URL

        if name is None:
            name = url

        if not session:
            self._session = Session(name=name, root_url=url)
        else:
            self._session = session

        self._session.use_doc(docname)
        self._session.load_document(self._document)

        if clear:
            self._document.clear()


_state = State()


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

def output_notebook(url=None, docname=None, session=None, name=None):
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

    Returns:
        None

    .. note::
        Generally, this should be called at the beginning of an interactive
        session or the top of a script.

    '''
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
