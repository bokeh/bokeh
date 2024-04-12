#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
import os
import urllib
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Literal,
    Protocol,
    TypeAlias,
    TypedDict,
    cast,
    overload,
)
from uuid import uuid4

## External imports
if TYPE_CHECKING:
    from ipykernel.comm import Comm

# Bokeh imports
from ..core.types import ID
from ..util.serialization import make_id
from ..util.warnings import warn
from .state import curstate

if TYPE_CHECKING:
    from ..application.application import Application
    from ..document.document import Document
    from ..document.events import (
        ColumnDataChangedEvent,
        ColumnsPatchedEvent,
        ColumnsStreamedEvent,
        DocumentPatchedEvent,
        ModelChangedEvent,
    )
    from ..embed.bundle import Bundle
    from ..model import Model
    from ..resources import Resources
    from .state import State

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

HTML_MIME_TYPE = 'text/html'

JS_MIME_TYPE   = 'application/javascript'

LOAD_MIME_TYPE = 'application/vnd.bokehjs_load.v0+json'

EXEC_MIME_TYPE = 'application/vnd.bokehjs_exec.v0+json'

DEFAULT_JUPYTER_URL = "localhost:8888"

__all__ = (
    'CommsHandle',
    'destroy_server',
    'get_comms',
    'install_notebook_hook',
    'install_jupyter_hooks',
    'load_notebook',
    'publish_display_data',
    'push_notebook',
    'run_notebook_hook',
    'show_app',
    'show_doc',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

NotebookType = Literal["jupyter", "zeppelin"]

class CommsHandle:
    '''

    '''
    _json: Any = {}
    _cellno: int | None
    _doc: Document

    def __init__(self, comms: Comm, cell_doc: Document) -> None:
        self._cellno = None
        try:
            from IPython import get_ipython
            ip = get_ipython()
            assert ip is not None
            hm = ip.history_manager
            assert hm is not None
            p_prompt = next(iter(hm.get_tail(1, include_latest=True)))[1]
            self._cellno = p_prompt
        except Exception as e:
            log.debug("Could not get Notebook cell number, reason: %s", e)

        self._comms = comms
        self._doc = cell_doc

        # Our internal copy of the doc is in perpetual "hold". Events from the
        # originating doc will be triggered and collected. Events are
        # processed/cleared when push_notebook is called for this comms handle
        self._doc.hold()

    def _repr_html_(self) -> str:
        if self._cellno is not None:
            return f"<p><code>&lt;Bokeh Notebook handle for <strong>In[{self._cellno}]</strong>&gt;</code></p>"
        else:
            return "<p><code>&lt;Bokeh Notebook handle&gt;</code></p>"

    @property
    def comms(self) -> Comm:
        return self._comms

    @property
    def doc(self) -> Document:
        return self._doc

    # Adding this method makes curdoc dispatch to this Comms to handle
    # and Document model changed events. If we find that the event is
    # for a model in our internal copy of the docs, then trigger the
    # internal doc with the event so that it is collected (until a
    # call to push_notebook processes and clear collected events)
    def _document_model_changed(self, event: ModelChangedEvent) -> None:
        if event.model.id in self.doc.models:
            self.doc.callbacks.trigger_on_change(event)

    def _column_data_changed(self, event: ColumnDataChangedEvent) -> None:
        if event.model.id in self.doc.models:
            self.doc.callbacks.trigger_on_change(event)

    def _columns_streamed(self, event: ColumnsStreamedEvent) -> None:
        if event.model.id in self.doc.models:
            self.doc.callbacks.trigger_on_change(event)

    def _columns_patched(self, event: ColumnsPatchedEvent) -> None:
        if event.model.id in self.doc.models:
            self.doc.callbacks.trigger_on_change(event)

class Load(Protocol):
    def __call__(self, resources: Resources, verbose: bool, hide_banner: bool, load_timeout: int) -> None: ...

class ShowDoc(Protocol):
    def __call__(self, obj: Model, state: State, notebook_handle: CommsHandle) -> CommsHandle: ...

class ShowApp(Protocol):
    def __call__(self, app: Application, state: State, notebook_url: str | ProxyUrlFunc, **kw: Any) -> None: ...

class Hooks(TypedDict):
    load: Load
    doc: ShowDoc
    app: ShowApp

def install_notebook_hook(notebook_type: NotebookType, load: Load, show_doc: ShowDoc,
        show_app: ShowApp, overwrite: bool = False) -> None:
    ''' Install a new notebook display hook.

    Bokeh comes with support for Jupyter notebooks built-in. However, there are
    other kinds of notebooks in use by different communities. This function
    provides a mechanism for other projects to instruct Bokeh how to display
    content in other notebooks.

    This function is primarily of use to developers wishing to integrate Bokeh
    with new notebook types.

    Args:
        notebook_type (str) :
            A name for the notebook type, e.e. ``'Jupyter'`` or ``'Zeppelin'``

            If the name has previously been installed, a ``RuntimeError`` will
            be raised, unless ``overwrite=True``

        load (callable) :
            A function for loading BokehJS in a notebook type. The function
            will be called with the following arguments:

            .. code-block:: python

                load(
                    resources,   # A Resources object for how to load BokehJS
                    verbose,     # Whether to display verbose loading banner
                    hide_banner, # Whether to hide the output banner entirely
                    load_timeout # Time after which to report a load fail error
                )

        show_doc (callable) :
            A function for displaying Bokeh standalone documents in the
            notebook type. This function will be called with the following
            arguments:

            .. code-block:: python

                show_doc(
                    obj,            # the Bokeh object to display
                    state,          # current bokeh.io "state"
                    notebook_handle # whether a notebook handle was requested
                )

            If the notebook platform is capable of supporting in-place updates
            to plots then this function may return an opaque notebook handle
            that can be used for that purpose. The handle will be returned by
            ``show()``, and can be used by as appropriate to update plots, etc.
            by additional functions in the library that installed the hooks.

        show_app (callable) :
            A function for displaying Bokeh applications in the notebook
            type. This function will be called with the following arguments:

            .. code-block:: python

                show_app(
                    app,          # the Bokeh Application to display
                    state,        # current bokeh.io "state"
                    notebook_url, # URL to the current active notebook page
                    **kw          # any backend-specific keywords passed as-is
                )

        overwrite (bool, optional) :
            Whether to allow an existing hook to be overwritten by a new
            definition (default: False)

    Returns:
        None

    Raises:
        RuntimeError
            If ``notebook_type`` is already installed and ``overwrite=False``

    '''
    if notebook_type in _HOOKS and not overwrite:
        raise RuntimeError(f"hook for notebook type {notebook_type!r} already exists")
    _HOOKS[notebook_type] = Hooks(load=load, doc=show_doc, app=show_app)

def push_notebook(*, document: Document | None = None, state: State | None = None,
        handle: CommsHandle | None = None) -> None:
    ''' Update Bokeh plots in a Jupyter notebook output cells with new data
    or property values.

    When working inside the notebook, the ``show`` function can be passed the
    argument ``notebook_handle=True``, which will cause it to return a
    handle object that can be used to update the Bokeh output later. When
    ``push_notebook`` is called, any property updates (e.g. plot titles or
    data source values, etc.) since the last call to ``push_notebook`` or
    the original ``show`` call are applied to the Bokeh output in the
    previously rendered Jupyter output cell.

    Several example notebooks can be found in the GitHub repository in
    the :bokeh-tree:`examples/output/jupyter/push_notebook` directory.

    Args:

        document (Document, optional):
            A |Document| to push from. If None uses ``curdoc()``. (default:
            None)

        state (State, optional) :
            A :class:`State` object. If None, then the current default
            state (set by |output_file|, etc.) is used. (default: None)

    Returns:
        None

    Examples:

        Typical usage is typically similar to this:

        .. code-block:: python

            from bokeh.plotting import figure
            from bokeh.io import output_notebook, push_notebook, show

            output_notebook()

            plot = figure()
            plot.circle([1,2,3], [4,6,5])

            handle = show(plot, notebook_handle=True)

            # Update the plot title in the earlier cell
            plot.title.text = "New Title"
            push_notebook(handle=handle)

    '''
    from ..protocol import Protocol as BokehProtocol

    if state is None:
        state = curstate()

    if not document:
        document = state.document

    if not document:
        warn("No document to push")
        return

    if handle is None:
        handle = state.last_comms_handle

    if not handle:
        warn("Cannot find a last shown plot to update. Call output_notebook() and show(..., notebook_handle=True) before push_notebook()")
        return

    events = list(handle.doc.callbacks._held_events)

    # This is to avoid having an exception raised for attempting to create a
    # PATCH-DOC with no events. In the notebook, we just want to silently
    # ignore calls to push_notebook when there are no new events
    if len(events) == 0:
        return

    handle.doc.callbacks._held_events = []
    msg = BokehProtocol().create("PATCH-DOC", cast(list["DocumentPatchedEvent"], events)) # XXX: either fix types or filter events

    handle.comms.send(msg.header_json)
    handle.comms.send(msg.metadata_json)
    handle.comms.send(msg.content_json)
    for buffer in msg.buffers:
        header = json.dumps(buffer.ref)
        payload = buffer.to_bytes()
        handle.comms.send(header)
        handle.comms.send(buffers=[payload])

def run_notebook_hook(notebook_type: NotebookType, action: Literal["load", "doc", "app"], *args: Any, **kwargs: Any) -> Any:
    ''' Run an installed notebook hook with supplied arguments.

    Args:
        notebook_type (str) :
            Name of an existing installed notebook hook

        action (str) :
            Name of the hook action to execute, ``'doc'`` or ``'app'``

    All other arguments and keyword arguments are passed to the hook action
    exactly as supplied.

    Returns:
        Result of the hook action, as-is

    Raises:
        RuntimeError
            If the hook or specific action is not installed

    '''
    if notebook_type not in _HOOKS:
        raise RuntimeError(f"no display hook installed for notebook type {notebook_type!r}")
    if _HOOKS[notebook_type][action] is None:
        raise RuntimeError(f"notebook hook for {notebook_type!r} did not install {action!r} action")
    return _HOOKS[notebook_type][action](*args, **kwargs)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def destroy_server(server_id: ID) -> None:
    ''' Given a UUID id of a div removed or replaced in the Jupyter
    notebook, destroy the corresponding server sessions and stop it.

    '''
    server = curstate().uuid_to_server.get(server_id, None)
    if server is None:
        log.debug(f"No server instance found for uuid: {server_id!r}")
        return

    try:
        for session in server.get_sessions():
            session.destroy()
        server.stop()
        del curstate().uuid_to_server[server_id]

    except Exception as e:
        log.debug(f"Could not destroy server for id {server_id!r}: {e}")

def get_comms(target_name: str) -> Comm:
    ''' Create a Jupyter comms object for a specific target, that can
    be used to update Bokeh documents in the Jupyter notebook.

    Args:
        target_name (str) : the target name the Comms object should connect to

    Returns
        Jupyter Comms

    '''
    # NOTE: must defer all IPython imports inside functions
    from ipykernel.comm import Comm
    return Comm(target_name=target_name, data={})

def install_jupyter_hooks() -> None:
    '''

    '''
    install_notebook_hook('jupyter', load_notebook, show_doc, show_app)

def load_notebook(resources: Resources | None = None, verbose: bool = False,
        hide_banner: bool = False, load_timeout: int = 5000) -> None:
    ''' Prepare the IPython notebook for displaying Bokeh plots.

    Args:
        resources (Resource, optional) :
            how and where to load BokehJS from (default: CDN)

        verbose (bool, optional) :
            whether to report detailed settings (default: False)

        hide_banner (bool, optional):
            whether to hide the Bokeh banner (default: False)

        load_timeout (int, optional) :
            Timeout in milliseconds when plots assume load timed out (default: 5000)

    .. warning::
        Clearing the output cell containing the published BokehJS
        resources HTML code may cause Bokeh CSS styling to be removed.

    Returns:
        None

    '''
    global _NOTEBOOK_LOADED

    from .. import __version__
    from ..core.templates import NOTEBOOK_LOAD
    from ..embed.bundle import bundle_for_objs_and_resources
    from ..resources import Resources
    from ..settings import settings
    from ..util.serialization import make_globally_unique_css_safe_id

    if resources is None:
        resources = Resources(mode=settings.resources())

    element_id: ID | None
    html: str | None

    if not hide_banner:
        if resources.mode == 'inline':
            js_info: str | list[str] = 'inline'
            css_info: str | list[str] = 'inline'
        else:
            js_info = resources.js_files[0] if len(resources.js_files) == 1 else resources.js_files
            css_info = resources.css_files[0] if len(resources.css_files) == 1 else resources.css_files

        warnings = ["Warning: " + msg.text for msg in resources.messages if msg.type == 'warn']
        if _NOTEBOOK_LOADED and verbose:
            warnings.append('Warning: BokehJS previously loaded')

        element_id = make_globally_unique_css_safe_id()

        html = NOTEBOOK_LOAD.render(
            element_id    = element_id,
            verbose       = verbose,
            js_info       = js_info,
            css_info      = css_info,
            bokeh_version = __version__,
            warnings      = warnings,
        )
    else:
        element_id = None
        html = None

    _NOTEBOOK_LOADED = resources

    bundle = bundle_for_objs_and_resources(None, resources)

    nb_js = _loading_js(bundle, element_id, load_timeout, register_mime=True)
    jl_js = _loading_js(bundle, element_id, load_timeout, register_mime=False)

    if html is not None:
        publish_display_data({'text/html': html})

    publish_display_data({
        JS_MIME_TYPE:   nb_js,
        LOAD_MIME_TYPE: jl_js,
    })

def publish_display_data(data: dict[str, Any], metadata: dict[Any, Any] | None = None, *, transient: dict[str, Any] | None = None, **kwargs: Any) -> None:
    '''

    '''
    # This import MUST be deferred or it will introduce a hard dependency on IPython
    from IPython.display import publish_display_data
    publish_display_data(data, metadata, transient=transient, **kwargs)


ProxyUrlFunc: TypeAlias = Callable[[int | None], str]

def show_app(
        app: Application,
        state: State,
        notebook_url: str | ProxyUrlFunc = DEFAULT_JUPYTER_URL,
        port: int = 0,
        **kw: Any,
) -> None:
    ''' Embed a Bokeh server application in a Jupyter Notebook output cell.

    Args:
        app (Application or callable) :
            A Bokeh Application to embed inline in a Jupyter notebook.

        state (State) :
            ** Unused **

        notebook_url (str or callable) :
            The URL of the notebook server that is running the embedded app.

            If ``notebook_url`` is a string, the value string is parsed to
            construct the origin and full server URLs.

            If notebook_url is a callable, it must accept one parameter,
            which will be the server port, or None. If passed a port,
            the callable must generate the server URL, otherwise if passed
            None, it must generate the origin URL for the server.

            If the environment variable JUPYTER_BOKEH_EXTERNAL_URL is set
            to the external URL of a JupyterHub, notebook_url is overridden
            with a callable which enables Bokeh to traverse the JupyterHub
            proxy without specifying this parameter.

        port (int) :
            A port for the embedded server will listen on.

            By default the port is 0, which results in the server listening
            on a random dynamic port.

    Any additional keyword arguments are passed to :class:`~bokeh.server.Server` (added in version 1.1)

    Returns:
        None

    '''
    logging.basicConfig()

    from tornado.ioloop import IOLoop

    from ..server.server import Server

    loop = IOLoop.current()

    notebook_url = _update_notebook_url_from_env(notebook_url)

    if callable(notebook_url):
        origin = notebook_url(None)
    else:
        origin = _origin_url(notebook_url)

    server = Server({"/": app}, io_loop=loop, port=port, allow_websocket_origin=[origin], **kw)

    server_id = ID(uuid4().hex)
    curstate().uuid_to_server[server_id] = server

    server.start()

    if callable(notebook_url):
        url = notebook_url(server.port)
    else:
        url = _server_url(notebook_url, server.port)

    logging.debug(f"Server URL is {url}")
    logging.debug(f"Origin URL is {origin}")

    from ..embed import server_document
    script = server_document(url, resources=None)

    publish_display_data({
        HTML_MIME_TYPE: script,
        EXEC_MIME_TYPE: "",
    }, metadata={
        EXEC_MIME_TYPE: {"server_id": server_id},
    })

@overload
def show_doc(obj: Model, state: State) -> None: ...
@overload
def show_doc(obj: Model, state: State, notebook_handle: CommsHandle) -> CommsHandle: ...

def show_doc(obj: Model, state: State, notebook_handle: CommsHandle | None = None) -> CommsHandle | None:
    '''

    '''
    if obj not in state.document.roots:
        state.document.add_root(obj)

    from ..embed.notebook import notebook_content
    comms_target = make_id() if notebook_handle else None
    (script, div, cell_doc) = notebook_content(obj, comms_target)

    publish_display_data({HTML_MIME_TYPE: div})
    publish_display_data({JS_MIME_TYPE: script, EXEC_MIME_TYPE: ""}, metadata={EXEC_MIME_TYPE: {"id": obj.id}})

    # Comms handling relies on the fact that the cell_doc returned by
    # notebook copy has models with the same IDs as the original curdoc
    # they were copied from
    if comms_target:
        handle = CommsHandle(get_comms(comms_target), cell_doc)
        state.document.callbacks.on_change_dispatch_to(handle)
        state.last_comms_handle = handle
        return handle

    return None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_HOOKS: dict[str, Hooks] = {}

_NOTEBOOK_LOADED: Resources | None = None

def _loading_js(bundle: Bundle, element_id: ID | None, load_timeout: int = 5000, register_mime: bool = True) -> str:
    '''

    '''
    from ..core.templates import AUTOLOAD_NB_JS

    return AUTOLOAD_NB_JS.render(
        bundle    = bundle,
        elementid = element_id,
        force     = True,
        timeout   = load_timeout,
        register_mime = register_mime,
    )

def _origin_url(url: str) -> str:
    '''

    '''
    if url.startswith("http"):
        url = url.split("//")[1]
    return url

def _server_url(url: str, port: int | None) -> str:
    '''

    '''
    port_ = f":{port}" if port is not None else ""

    if url.startswith("http"):
        return f"{url.rsplit(':', 1)[0]}{port_}{'/'}"
    else:
        return f"http://{url.split(':')[0]}{port_}{'/'}"


def _remote_jupyter_proxy_url(port: int | None) -> str:
    """ Callable to configure Bokeh's show method when a proxy must be
    configured. If port is None we're asking about the URL
    for the origin header.

    Taken from documentation here:

       https://docs.bokeh.org/en/latest/docs/user_guide/output/jupyter.html#jupyterhub

    and made an implicit override when JUPYTER_BOKEH_EXTERNAL_URL is defined in
    a user's environment to the external hostname of the hub, e.g. https://our-hub.edu

    Args:
       port (int):
           random port generated by bokeh to avoid re-using recently closed ports

       Returns:
           str:
               URL capable of traversing the JupyterHub proxy to return to this notebook session.
    """
    base_url = os.environ['JUPYTER_BOKEH_EXTERNAL_URL']
    host = urllib.parse.urlparse(base_url).netloc

    # If port is None we're asking for the URL origin
    # so return the public hostname.
    if port is None:
        return host

    service_url_path = os.environ['JUPYTERHUB_SERVICE_PREFIX']
    proxy_url_path = f'proxy/{port}'

    user_url = urllib.parse.urljoin(base_url, service_url_path)
    full_url = urllib.parse.urljoin(user_url, proxy_url_path)
    return full_url


def _update_notebook_url_from_env(notebook_url: str | ProxyUrlFunc) -> str | ProxyUrlFunc:
    """If the environment variable ``JUPYTER_BOKEH_EXTERNAL_URL`` is defined, returns a function which
    generates URLs which can traverse the JupyterHub proxy. Otherwise returns ``notebook_url`` unmodified.

    A warning is issued if ``notebook_url`` is not the default and
    ``JUPYTER_BOKEH_EXTERNAL_URL`` is also defined since setting the
    environment variable makes specifying ``notebook_url`` irrelevant.

    Args:
       notebook_url (str | ProxyUrlFunc):
          Either a URL string which defaults or a function that given a port
          number will generate a URL suitable for traversing the JupyterHub proxy.

    Returns:
       str | ProxyUrlFunc
          Either a URL string or a function that generates a URL string given a port number. The
          latter function may be user supplied as the input parameter or defined internally by Bokeh
          when ``JUPYTER_BOKEH_EXTERNAL_URL`` is set.

    """
    if os.environ.get("JUPYTER_BOKEH_EXTERNAL_URL"):
        if notebook_url != DEFAULT_JUPYTER_URL:
            log.warning("Environment var 'JUPYTER_BOKEH_EXTERNAL_URL' is defined. Ignoring 'notebook_url' parameter.")
        return _remote_jupyter_proxy_url
    else:
        return notebook_url

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
