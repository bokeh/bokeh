
import logging
logger = logging.getLogger(__name__)

import io, os, time, warnings

from . import browserlib
from .document import Document
from .embed import notebook_div, file_html, autoload_server
from .models import Widget
from .resources import Resources
from .session import DEFAULT_SERVER_URL, Session
from .utils import decode_utf8, publish_display_data

class State(object):

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

    def load_object(self, obj):
        """ Update a local object from state on the server

        Args:
            obj : (PlotObject)

        Returns
            None

        """
        if self._session is None:
            raise RuntimeError()

        self._session.load_object(obj, self._document)

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
            autosave (bool, optional) : whether to automatically save (default: False)
                If True, then Bokeh plotting APIs may opt to automatically
                save the file more frequently (e.g., after any plotting
                command). If False, then the file is only saved upon calling
                show().

            mode (str, optional) : how to inlcude BokehJS (default: "inline")
                One of: 'inline', 'cdn', 'relative(-dev)' or 'absolute(-dev)'.
                See :class:`bokeh.resources.Resources` for more details.

        .. note::
            Generally, this should be called at the beginning of an interactive
            session or the top of a script.

        .. warning::
            This output file will be overwritten on every save, e.g., each time
            show() or save() is invoked, or any time a Bokeh plotting API
            causes a save if ``autosave`` is True.

        """
        self._file = {
            'filename'  : filename,
            'resources' : Resources(mode=mode, root_dir=root_dir),
            'autosave'  : autosave,
            'title'     : title,
        }

        if os.path.isfile(filename):
            print("Session output file '%s' already exists, will be overwritten." % filename)

    def output_notebook(self, url=None, docname=None, session=None, name=None):
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

        .. note::
            Generally, this should be called at the beginning of an interactive
            session or the top of a script.

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
    _state.output_file(filename=filename, title=title, autosave=autosave, mode=mode, root_dir=root_dir)

def output_notebook(url=None, docname=None, session=None, name=None):
    _state.output_notebook(url=url, docname=document, session=session, name=name)

def output_server(docname, session=None, url="default", name=None, clear=True):
    _state.output_server(docname, session=session, url=url, name=name, clear=clear)


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



def show(obj, browser=None, new="tab", url=None, state=None):
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
    if state is None:
        state = _state

    # Map our string argument to the webbrowser.open argument
    new_param = {'tab': 2, 'window': 1}[new]

    controller = browserlib.get_browser_controller(browser=browser)

    if state.notebook and state.session:
        push(session=state.session)
        snippet = autoload_server(obj, state.session)
        publish_display_data({'text/html': snippet})

    elif state.notebook:
        publish_display_data({'text/html': notebook_div(obj)})

    elif state.session:
        push()
        if url:
            controller.open(url, new=new_param)
        else:
            controller.open(state.session.object_link(state.document.context))

    if state.file:
        filename = state.file['filename']
        save(obj, filename)
        controller.open("file://" + os.path.abspath(filename), new=new_param)


def save(obj, filename=None, resources=None, title=None, state=None):
    """ Save an HTML file with the data for the current document.

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
    if state is None:
        state = _state

    if filename is None and state.file:
        filename = state.file['filename']

    if resources is None and state.file:
        resources = state.file['resources']

    if title is None and state.file:
        title = state.file['title']

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

    Args:
        session (Session, optional) : filename to save document under (default: None)
            if None, the current output_server(...) session is used if present
        document (Document, optional) : Bokeh Document to push
            if None, the current default document is pushed

    Returns:
        None

    """
    if state is None:
        state = _state

    if not session:
        session = state.session

    if not document:
        document = state.document

    if session:
        return session.store_document(state.document)
    else:
        warnings.warn("push() called but no session was supplied and output_server(...) was never called, nothing pushed")

def _deduplicate_plots(plot, subplots, state=None):
    if state is None:
        state = _state

    doc = state.document
    doc.context.children = list(set(doc.context.children) - set(subplots))
    doc.add(plot)
    doc._current_plot = plot # TODO (bev) don't use private attrs

def _push_or_save(obj, state=None):
    if state is None:
        state = _state

    if state.session and state.document.autostore:
        push(state=state)
    if state.file and state.file['autosave']:
        save(obj, state=state)
