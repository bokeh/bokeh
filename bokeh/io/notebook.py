#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
from warnings import warn
from uuid import uuid4

# External imports

# Bokeh imports
from .state import curstate
from ..util.serialization import make_id

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

HTML_MIME_TYPE = 'text/html'

JS_MIME_TYPE   = 'application/javascript'

LOAD_MIME_TYPE = 'application/vnd.bokehjs_load.v0+json'

EXEC_MIME_TYPE = 'application/vnd.bokehjs_exec.v0+json'

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@general((1,0,0))
class CommsHandle(object):
    '''

    '''
    _json = {}

    def __init__(self, comms, cell_doc):
        self._cellno = None
        try:
            from IPython import get_ipython
            ip = get_ipython()
            hm = ip.history_manager
            p_prompt = list(hm.get_tail(1, include_latest=True))[0][1]
            self._cellno = p_prompt
        except Exception as e:
            log.debug("Could not get Notebook cell number, reason: %s", e)

        self._comms = comms
        self._doc = cell_doc

        # Our internal copy of the doc is in perpetual "hold". Events from the
        # originating doc will be triggered and collected it it. Events are
        # processed/cleared when push_notebook is called for this comms handle
        self._doc.hold()

    def _repr_html_(self):
        if self._cellno is not None:
            return "<p><code>&lt;Bokeh Notebook handle for <strong>In[%s]</strong>&gt;</code></p>" % str(self._cellno)
        else:
            return "<p><code>&lt;Bokeh Notebook handle&gt;</code></p>"

    @property
    @dev((1,0,0))
    def comms(self):
        return self._comms

    @property
    @dev((1,0,0))
    def doc(self):
        return self._doc

    # Adding this method makes curdoc dispatch to this Comms to handle
    # and Document model changed events. If we find that the event is
    # for a model in our internal copy of the docs, then trigger the
    # internal doc with the event so that it is collected (until a
    # call to push_notebook processes and clear colleted events)
    def _document_model_changed(self, event):
        if event.model._id in self.doc._all_models:
            self.doc._trigger_on_change(event)

@general((1,0,0))
def install_notebook_hook(notebook_type, load, show_doc, show_app, overwrite=False):
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
            that can  be used for that purpose. The handle will be returned by
            ``show()``, and can be used by as appropriate to update plots, etc.
            by additional functions in the library that installed the hooks.

        show_app (callable) :
            A function for displaying Bokeh applications in the notebook
            type. This function will be called with the following arguments:

            .. code-block:: python

                show_app(
                    app,         # the Bokeh Application to display
                    state,       # current bokeh.io "state"
                    notebook_url # URL to the current active notebook page
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
        raise RuntimeError("hook for notebook type %r already exists" % notebook_type)
    _HOOKS[notebook_type] = dict(load=load, doc=show_doc, app=show_app)

@general((1,0,0))
def push_notebook(document=None, state=None, handle=None):
    ''' Update Bokeh plots in a Jupyter notebook output cells with new data
    or property values.

    When working the the notebook, the ``show`` function can be passed the
    argument ``notebook_handle=True``, which will cause it to return a
    handle object that can be used to update the Bokeh output later. When
    ``push_notebook`` is called, any property updates (e.g. plot titles or
    data source values, etc.) since the last call to ``push_notebook`` or
    the original ``show`` call are applied to the Bokeh output in the
    previously rendered Jupyter output cell.

    Several example notebooks can be found in the GitHub repository in
    the :bokeh-tree:`examples/howto/notebook_comms` directory.

    Args:

        document (Document, optional) :
            A :class:`~bokeh.document.Document` to push from. If None,
            uses ``curdoc()``. (default: None)

        state (State, optional) :
            A :class:`State` object. If None, then the current default
            state (set by ``output_file``, etc.) is used. (default: None)

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
    from ..protocol import Protocol

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

    events = list(handle.doc._held_events)

    # This is to avoid having an exception raised for attempting to create a
    # PATCH-DOC with no events. In the notebook, we just want to silenty
    # ignore calls to push_notebook when there are no new events
    if len(events) == 0:
        return

    handle.doc._held_events = []
    msg = Protocol("1.0").create("PATCH-DOC", events)

    handle.comms.send(msg.header_json)
    handle.comms.send(msg.metadata_json)
    handle.comms.send(msg.content_json)
    for header, payload in msg.buffers:
        handle.comms.send(json.dumps(header))
        handle.comms.send(buffers=[payload])

@general((1,0,0))
def run_notebook_hook(notebook_type, action, *args, **kw):
    ''' Run an installed notebook hook with supplied arguments.

    Args:
        noteboook_type (str) :
            Name of an existing installed notebook hook

        actions (str) :
            Name of the hook action to execute, ``'doc'`` or ``'app'``

    All other arguments and keyword arguments are passed to the hook action
    exactly as supplied.

    Returns:
        Result of the hook action, as-is

    Raises:
        RunetimeError
            If the hook or specific action is not installed

    '''
    if notebook_type not in _HOOKS:
        raise RuntimeError("no display hook installed for notebook type %r" % notebook_type)
    if _HOOKS[notebook_type][action] is None:
        raise RuntimeError("notebook hook for %r did not install %r action" % notebook_type, action)
    return _HOOKS[notebook_type][action](*args, **kw)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@dev((1,0,0))
def destroy_server(server_id):
    ''' Given a UUID id of a div removed or replaced in the Jupyter
    notebook, destroy the corresponding server sessions and stop it.

    '''
    server = curstate().uuid_to_server.get(server_id, None)
    if server is None:
        log.debug("No server instance found for uuid: %r" % server_id)
        return

    try:
        for session in server.get_sessions():
            session.destroy()
        server.stop()
        del curstate().uuid_to_server[server_id]

    except Exception as e:
        log.debug("Could not destroy server for id %r: %s" % (server_id, e))

@dev((1,0,0))
def get_comms(target_name):
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

@dev((1,0,0))
def install_jupyter_hooks():
    '''

    '''
    install_notebook_hook('jupyter', load_notebook, show_doc, show_app)

@dev((1,0,0))
def load_notebook(resources=None, verbose=False, hide_banner=False, load_timeout=5000):
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
    from ..util.serialization import make_id
    from ..resources import CDN
    from ..util.compiler import bundle_all_models

    if resources is None:
        resources = CDN

    if not hide_banner:

        if resources.mode == 'inline':
            js_info = 'inline'
            css_info = 'inline'
        else:
            js_info = resources.js_files[0] if len(resources.js_files) == 1 else resources.js_files
            css_info = resources.css_files[0] if len(resources.css_files) == 1 else resources.css_files

        warnings = ["Warning: " + msg['text'] for msg in resources.messages if msg['type'] == 'warn']
        if _NOTEBOOK_LOADED and verbose:
            warnings.append('Warning: BokehJS previously loaded')

        element_id = make_id()

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

    _NOTEBOOK_LOADED = resources

    custom_models_js = bundle_all_models()

    nb_js = _loading_js(resources, element_id, custom_models_js, load_timeout, register_mime=True)
    jl_js = _loading_js(resources, element_id, custom_models_js, load_timeout, register_mime=False)

    if not hide_banner:
        publish_display_data({'text/html': html})
    publish_display_data({
        JS_MIME_TYPE   : nb_js,
        LOAD_MIME_TYPE : jl_js
    })

@dev((1,0,0))
def publish_display_data(*args, **kw):
    '''

    '''
    # This import MUST be deferred or it will introduce a hard dependency on IPython
    from IPython.display import publish_display_data
    return publish_display_data(*args, **kw)

@dev((1,0,0))
def show_app(app, state, notebook_url):
    ''' Embed a Bokeh serer application in a Jupyter Notebook output cell.

    Args:
        app (Application) :

        state (State) :

        notebook_url (str) :

    Returns:
        None

    '''
    logging.basicConfig()

    from tornado.ioloop import IOLoop
    from ..server.server import Server

    loop = IOLoop.current()

    origin = _origin_url(notebook_url)
    server = Server({"/": app}, io_loop=loop, port=0,  allow_websocket_origin=[origin])

    server_id = uuid4().hex
    curstate().uuid_to_server[server_id] = server

    server.start()
    url = _server_url(notebook_url, server.port)

    from ..embed import server_document
    script = server_document(url)

    publish_display_data({
        HTML_MIME_TYPE: script,
        EXEC_MIME_TYPE: ""
    }, metadata={
        EXEC_MIME_TYPE: {"server_id": server_id}
    })

@dev((1,0,0))
def show_doc(obj, state, notebook_handle):
    '''

    '''
    from ..embed.notebook import notebook_content
    comms_target = make_id() if notebook_handle else None
    (script, div, cell_doc) = notebook_content(obj, comms_target)

    publish_display_data({HTML_MIME_TYPE: div})
    publish_display_data({JS_MIME_TYPE: script, EXEC_MIME_TYPE: ""}, metadata={EXEC_MIME_TYPE: {"id": obj._id}})

    # Comms handling relies on the fact that the cell_doc returned by
    # notebook copy has models with the same IDs as the original curdoc
    # they were copied from
    if comms_target:
        handle = CommsHandle(get_comms(comms_target), cell_doc)
        state.document.on_change_dispatch_to(handle)
        state.last_comms_handle = handle
        return handle

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_HOOKS = {}

_NOTEBOOK_LOADED = None

def _loading_js(resources, element_id, custom_models_js, load_timeout=5000, register_mime=True):
    '''

    '''
    from ..core.templates import AUTOLOAD_NB_JS

    return AUTOLOAD_NB_JS.render(
        elementid = element_id,
        js_urls   = resources.js_files,
        css_urls  = resources.css_files,
        js_raw    = resources.js_raw + [custom_models_js],
        css_raw   = resources.css_raw_str,
        force     = True,
        timeout   = load_timeout,
        register_mime = register_mime
    )

def _origin_url(url):
    '''

    '''
    if url.startswith("http"):
        url = url.split("//")[1]
    return url

def _server_url(url, port):
    '''

    '''
    if url.startswith("http"):
        return '%s:%d%s' % (url.rsplit(':', 1)[0], port, "/")
    else:
        return 'http://%s:%d%s' % (url.split(':')[0], port, "/")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
