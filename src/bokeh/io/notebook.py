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

# pyright: reportAttributeAccessIssue=false, reportMissingModuleSource=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import sys
import urllib
from collections.abc import Sequence
from html import escape
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Protocol,
    Self,
)

# Bokeh imports
from ..util.serialization import make_id
from .jupyter import NOTEBOOK_COMM_TARGET, RESOURCE_COMM_TARGET

if TYPE_CHECKING:
    from ..core.types import ID
    from ..document.document import Document
    from ..document.events import (
        ColumnDataChangedEvent,
        ColumnsPatchedEvent,
        ColumnsStreamedEvent,
        DocumentPatchedEvent,
        ModelChangedEvent,
    )
    from ..embed.artifact import EmbedArtifact
    from ..embed.resources import ResolvedResources, ResourcePolicy
    from ..model import Model
    from ..models.ui import UIElement
    from ..resources import Resources
    from .jupyter_app import NotebookApplication
    from .state import State

    class Comm(Protocol):
        comm_id: str
        def send(self, data: Any = None, buffers: list[bytes] | None = None) -> None: ...
        def close(self) -> Any: ...
        def on_close(self, callback: Callable[[Any], None]) -> None: ...
        def on_msg(self, callback: Callable[[dict[str, Any]], None]) -> None: ...

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

HTML_MIME_TYPE = 'text/html'

JS_MIME_TYPE   = 'application/javascript'

STATIC_FALLBACK_ATTRIBUTE = 'data-bokeh-notebook-static-fallback'
_STATIC_FALLBACK_MESSAGE = (
    "This output cannot be displayed in a static notebook preview. "
    "Open and run the notebook in Jupyter to view it."
)

DEFAULT_JUPYTER_URL = "localhost:8888"

__all__ = (
    'ApplicationViewHandle',
    'DocumentViewHandle',
    'notebook_mimebundle',
    'notebook_environment',
    'publish_display_data',
    'show_doc',
    'show_hosted_app',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def __getattr__(name: str) -> Any:
    # Colab injects an import hook that unconditionally calls this removed API
    # after loading ``bokeh.io``. Its callbacks belong to Bokeh's pre-4.0
    # notebook machinery and are intentionally ignored: the portable MIME
    # fallback emitted below is self-contained for Colab's output frames.
    if name == "install_notebook_hook" and _is_colab_runtime():
        return _ignore_legacy_colab_notebook_hook
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

def _ignore_legacy_colab_notebook_hook(*_args: Any, **_kwargs: Any) -> None:
    pass

def _is_colab_runtime() -> bool:
    # The Bokeh-specific import-hook module is an implementation detail rather
    # than the identity of the host. The Colab package and its shell class are
    # broader runtime evidence, including for Colab frontends connected to a
    # local kernel.
    if any(name == "google.colab" or name.startswith("google.colab.") for name in sys.modules):
        return True
    try:
        from IPython import get_ipython

        shell = get_ipython()
        return type(shell).__module__.startswith("google.colab.")
    except Exception:
        return False

def _is_marimo_runtime() -> bool:
    if "marimo" not in sys.modules:
        return False
    try:
        from marimo._runtime.context import runtime_context_installed

        return runtime_context_installed()
    except Exception:
        return False

def _anywidget_available() -> bool:
    try:
        from . import _anywidget

        return _anywidget is not None
    except (AttributeError, ImportError):
        return False

def _use_anywidget() -> bool:
    if not _anywidget_available():
        return False
    if _is_marimo_runtime():
        return True
    try:
        from IPython import get_ipython

        shell = get_ipython()
        return shell is not None and getattr(shell, "kernel", None) is not None
    except Exception:
        return False

def _require_marimo_anywidget() -> None:
    if _is_marimo_runtime() and not _anywidget_available():
        raise RuntimeError(
            "Bokeh output in marimo requires AnyWidget 0.11 or later. "
            "Install Bokeh's notebook extra with 'pip install bokeh[notebook]'.",
        )

def _comm_id(comm: Comm) -> str:
    comm_id = getattr(comm, "comm_id", None)
    return comm_id if isinstance(comm_id, str) and comm_id else str(id(comm))

class DocumentViewHandle:
    '''A live artifact handle with one independent comm per frontend view.'''

    _MAX_HELD_EVENTS = 256

    def __init__(self, root: Model, *, live_id: str, view_id: str,
            resources: ResourcePolicy | Resources | None = None) -> None:
        self._comms: dict[str, Comm] = {}
        self._root = root
        self._live_id = live_id
        self._view_id = view_id
        self._resources = resources
        self._hold_depth = 0
        self._held_source_events: list[DocumentPatchedEvent] = []
        self._revision = 0
        self._source_document: Document | None = None
        self._output_root_key: tuple[int, int] | None = None
        self._closed = False
        self._frontend: Any | None = None

    def _attach(self, source_document: Document, *, output_root: bool = False) -> None:
        self._source_document = source_document
        if output_root:
            self._output_root_key = _claim_output_root(source_document, self._root)
        source_document.callbacks.on_change_dispatch_to(self)

    def _connect(self, comm: Comm) -> None:
        if self._closed:
            comm.send({
                "kind": "error",
                "code": "LIVE_DOCUMENT_CLOSED",
                "message": "This live notebook document has already been closed.",
            })
            comm.close()
            return
        comm_id = _comm_id(comm)
        self._comms[comm_id] = comm
        on_close = getattr(comm, "on_close", None)
        if on_close is not None:
            on_close(lambda _message: self._disconnect(comm_id))
        on_msg = getattr(comm, "on_msg", None)
        if on_msg is not None:
            on_msg(lambda message: self._receive(comm_id, message))
        self._send_snapshot(comm)

    def _receive(self, comm_id: str, message: dict[str, Any]) -> None:
        data = message.get("content", {}).get("data", message)
        if isinstance(data, dict) and data.get("kind") == "resync":
            comm = self._comms.get(comm_id)
            if comm is not None:
                self._send_snapshot(comm)

    def _send_snapshot(self, comm: Comm) -> None:
        from ..embed.notebook import notebook_content

        artifact, _ = notebook_content(self._root, live=True)
        resource_id = _ensure_notebook_resources(artifact, self._resources, publish=False)
        comm.send({
            "kind": "snapshot",
            "revision": self._revision,
            "artifact": artifact.to_json_string(),
            "resource_id": resource_id,
        })

    def _disconnect(self, comm_id: str) -> None:
        # Closing one browser view must never close the Python handle or any
        # other view. A later view receives a fresh snapshot when it connects.
        self._comms.pop(comm_id, None)

    @property
    def closed(self) -> bool:
        return self._closed

    def _retain_frontend(self, frontend: Any) -> None:
        self._frontend = frontend

    def close(self) -> None:
        '''Release all frontend comms, detach the source, and clear pending events.'''
        if self._closed:
            return
        self._closed = True
        if self._source_document is not None:
            try:
                self._source_document.remove_on_change(self)
            except KeyError:
                log.debug("Notebook document callback was already removed", exc_info=True)
            self._source_document = None
        if self._output_root_key is not None:
            _release_output_root(self._output_root_key)
            self._output_root_key = None
        self._held_source_events.clear()
        _DOCUMENT_VIEW_HANDLES.pop(self._live_id, None)
        _DOCUMENT_VIEW_HANDLES_BY_VIEW.pop(self._view_id, None)
        for comm in tuple(self._comms.values()):
            try:
                comm.close()
            except Exception:
                log.debug("Could not close notebook document comm", exc_info=True)
        self._comms.clear()
        frontend = self._frontend
        self._frontend = None
        if frontend is not None:
            try:
                frontend.close()
            except Exception:
                log.debug("Could not close notebook document frontend", exc_info=True)

    def _ipython_display_(self) -> None:
        '''Keep a bare ``show(...)`` call from producing a second output.'''

    @property
    def views(self) -> int:
        return len(self._comms)

    def __enter__(self) -> Self:
        ''' Begin batching connected-document changes into one frontend update.

        Contexts may be nested. The outermost context sends all accumulated
        changes when it exits, including when the body raises an exception.
        '''
        if self._closed:
            raise RuntimeError("Cannot enter a closed notebook document handle")
        self._hold_depth += 1
        return self

    def __exit__(self, _exc_type: object, _exc_value: object, _traceback: object) -> None:
        self._hold_depth -= 1
        if self._hold_depth == 0:
            self._flush_held_source_events()

    # These dispatch methods receive changes from the source document. Only
    # events for models represented by this output belong to this handle.
    def _document_model_changed(self, event: ModelChangedEvent) -> None:
        if self._belongs(event.model):
            self._record(event)

    def _column_data_changed(self, event: ColumnDataChangedEvent) -> None:
        if self._belongs(event.model):
            self._record(event)

    def _columns_streamed(self, event: ColumnsStreamedEvent) -> None:
        if self._belongs(event.model):
            self._record(event)

    def _columns_patched(self, event: ColumnsPatchedEvent) -> None:
        if self._belongs(event.model):
            self._record(event)

    def _belongs(self, model: Model) -> bool:
        return model is self._root or model in self._root.references()

    def _record(self, event: DocumentPatchedEvent) -> None:
        if self._hold_depth > 0:
            self._held_source_events.append(event)
            if len(self._held_source_events) >= self._MAX_HELD_EVENTS:
                self._flush_held_source_events()
        else:
            self._broadcast([event])

    def _flush_held_source_events(self) -> None:
        if self._closed or not self._held_source_events:
            return
        events = self._held_source_events
        self._held_source_events = []
        self._broadcast(events)

    @staticmethod
    def _send(comm: Comm, content: Any, buffer_ids: Sequence[ID], buffers: list[bytes], revision: int) -> None:
        comm.send({
            "kind": "patch",
            "revision": revision,
            "content": content,
            "buffer_ids": buffer_ids,
        }, buffers=buffers)

    def _broadcast(self, events: list[DocumentPatchedEvent]) -> None:
        if self._closed:
            return
        if not events or not self._comms:
            return
        from ..protocol import patch_doc
        message = patch_doc(events)
        buffer_ids = [buffer.id for buffer in message.buffers]
        buffers = [buffer.to_bytes() for buffer in message.buffers]
        self._revision += 1
        for comm_id, comm in tuple(self._comms.items()):
            try:
                self._send(comm, message.content, buffer_ids, buffers, self._revision)
            except Exception:
                log.warning("A connected notebook frontend disconnected while applying an update")
                self._disconnect(comm_id)


class ApplicationViewHandle:
    '''Control one notebook view of a managed ASGI application.'''

    def __init__(self, application: NotebookApplication, view_id: str) -> None:
        self._application = application
        self._view_id = view_id
        self._comms: dict[str, Comm] = {}
        self._closed = False
        self._frontend: Any | None = None

    def _connect(self, comm: Comm) -> None:
        if self._closed:
            comm.send({
                "kind": "error",
                "code": "APPLICATION_VIEW_CLOSED",
                "message": "This notebook application view has already been closed.",
            })
            comm.close()
            return
        comm_id = _comm_id(comm)
        self._comms[comm_id] = comm
        on_close = getattr(comm, "on_close", None)
        if on_close is not None:
            on_close(lambda _message: self._disconnect(comm_id))
        comm.send({"kind": "ready"})

    def _disconnect(self, comm_id: str) -> None:
        self._comms.pop(comm_id, None)

    @property
    def application(self) -> NotebookApplication:
        return self._application

    @property
    def closed(self) -> bool:
        return self._closed

    @property
    def view_id(self) -> str:
        return self._view_id

    @property
    def views(self) -> int:
        return len(self._comms)

    def _retain_frontend(self, frontend: Any) -> None:
        self._frontend = frontend

    def close(self) -> None:
        '''Close every frontend session for this view without stopping the application.'''
        if self._closed:
            return
        self._closed = True
        _APPLICATION_VIEW_HANDLES.pop(self._view_id, None)
        for comm in tuple(self._comms.values()):
            try:
                comm.send({"kind": "close"})
                comm.close()
            except Exception:
                log.debug("Could not close notebook application view comm", exc_info=True)
        self._comms.clear()
        frontend = self._frontend
        self._frontend = None
        if frontend is not None:
            try:
                frontend.close()
            except Exception:
                log.debug("Could not close notebook application frontend", exc_info=True)

    def _ipython_display_(self) -> None:
        '''Keep a bare ``show(app)`` call from producing a second output.'''


_DOCUMENT_VIEW_HANDLES: dict[str, DocumentViewHandle] = {}
_DOCUMENT_VIEW_HANDLES_BY_VIEW: dict[str, DocumentViewHandle] = {}
_APPLICATION_VIEW_HANDLES: dict[str, ApplicationViewHandle] = {}
_OUTPUT_DOCUMENT_ROOTS: dict[tuple[int, int], tuple[Document, Model, int]] = {}
_MAX_RETAINED_VIEW_HANDLES = 128
_NOTEBOOK_COMM_KERNEL: Any | None = None
_NOTEBOOK_COMM_TARGET = NOTEBOOK_COMM_TARGET


def _claim_output_root(document: Document, root: Model) -> tuple[int, int]:
    key = (id(document), id(root))
    existing = _OUTPUT_DOCUMENT_ROOTS.get(key)
    count = 0 if existing is None else existing[2]
    _OUTPUT_DOCUMENT_ROOTS[key] = (document, root, count + 1)
    return key


def _release_output_root(key: tuple[int, int]) -> None:
    ownership = _OUTPUT_DOCUMENT_ROOTS.get(key)
    if ownership is None:
        return
    document, root, count = ownership
    if count > 1:
        _OUTPUT_DOCUMENT_ROOTS[key] = (document, root, count - 1)
        return
    _OUTPUT_DOCUMENT_ROOTS.pop(key, None)
    if root in document.roots:
        document.remove_root(root)


def _retain_document_handle(handle: DocumentViewHandle) -> None:
    while len(_DOCUMENT_VIEW_HANDLES) >= _MAX_RETAINED_VIEW_HANDLES:
        oldest = next(iter(_DOCUMENT_VIEW_HANDLES.values()))
        oldest.close()
    _DOCUMENT_VIEW_HANDLES[handle._live_id] = handle
    _DOCUMENT_VIEW_HANDLES_BY_VIEW[handle._view_id] = handle


def _retain_application_handle(handle: ApplicationViewHandle) -> None:
    while len(_APPLICATION_VIEW_HANDLES) >= _MAX_RETAINED_VIEW_HANDLES:
        oldest = next(iter(_APPLICATION_VIEW_HANDLES.values()))
        oldest.close()
    _APPLICATION_VIEW_HANDLES[handle.view_id] = handle

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def _register_notebook_comm_target() -> None:
    global _NOTEBOOK_COMM_KERNEL
    try:
        from IPython import get_ipython

        shell = get_ipython()
        kernel = getattr(shell, "kernel", None)
        if kernel is None or kernel is _NOTEBOOK_COMM_KERNEL:
            return

        def connect(comm: Comm, message: dict[str, Any]) -> None:
            data = message.get("content", {}).get("data", {})
            if data.get("kind") == "release":
                view_id = data.get("view_id")
                handle = _DOCUMENT_VIEW_HANDLES_BY_VIEW.get(view_id) if isinstance(view_id, str) else None
                application = _APPLICATION_VIEW_HANDLES.get(view_id) if isinstance(view_id, str) else None
                if handle is not None:
                    handle.close()
                if application is not None:
                    application.close()
                comm.send({"kind": "released", "view_id": view_id})
                comm.close()
                return
            live_id = data.get("live_id")
            if isinstance(live_id, str):
                handle = _DOCUMENT_VIEW_HANDLES.get(live_id)
                if handle is None:
                    comm.send({
                        "kind": "error",
                        "code": "LIVE_DOCUMENT_NOT_FOUND",
                        "message": "The kernel no longer has this live notebook document. Re-run show(...).",
                    })
                    comm.close()
                    return
                handle._connect(comm)
                return
            view_id = data.get("view_id")
            view = _APPLICATION_VIEW_HANDLES.get(view_id) if isinstance(view_id, str) else None
            if view is None:
                comm.send({
                    "kind": "error",
                    "code": "APPLICATION_VIEW_NOT_FOUND",
                    "message": "The kernel no longer has this notebook application view. Re-run show(app).",
                })
                comm.close()
                return
            view._connect(comm)

        kernel.comm_manager.register_target(_NOTEBOOK_COMM_TARGET, connect)
        _NOTEBOOK_COMM_KERNEL = kernel
    except Exception as error:
        log.debug("Could not register the notebook comm target: %s", error)

def notebook_environment() -> bool:
    ''' Report whether Python is executing in an interactive notebook kernel. '''
    if _is_marimo_runtime():
        return True
    try:
        from IPython import get_ipython
        shell = get_ipython()
        return shell is not None and getattr(shell, "kernel", None) is not None
    except Exception:
        return False

def notebook_mimebundle(obj: Model, *, include: set[str] | None = None,
        exclude: set[str] | None = None,
        resources: ResourcePolicy | Resources | None = None) -> tuple[dict[str, Any], dict[str, Any]] | None:
    ''' Return the automatic static-display MIME bundle for a notebook object.

    The serialized graph occurs once, inside the common artifact declaration
    in ``text/html``. The notebook MIME member carries only host ownership and
    transport metadata.
    '''
    if not notebook_environment():
        return None

    _require_marimo_anywidget()

    from ..embed.notebook import notebook_content
    from .jupyter import DISPLAY_MIME_TYPE, display_payload

    marimo = _is_marimo_runtime()
    colab = _is_colab_runtime()
    portable_widget = (marimo or colab) and _anywidget_available()
    artifact, fragment = notebook_content(obj)
    if colab and not portable_widget:
        from ..embed.resources import ResourcePolicy
        from ..resources import Resources
        from ..settings import settings

        policy = ResourcePolicy.build(resources or Resources(mode=settings.resources()))
        resolved = policy.resolve(artifact.requires, bokeh_version=artifact.bokeh_version)
        fragment = artifact.fragment(resources=policy)
        resource_id = f"bokeh-{resolved.fingerprint[:16]}"
    else:
        resource_id = _ensure_notebook_resources(artifact, resources, publish=not portable_widget)
    view_id = make_id()
    fallback = _static_fallback(_STATIC_FALLBACK_MESSAGE)
    html = fragment.html.replace("</div>", f"{fallback}</div>", 1)
    payload = display_payload(artifact, resource_id, view_id)
    if portable_widget:
        from ._anywidget import display_widget

        widget = display_widget(payload, html, _RESOURCE_RECORDS)
        bundle = widget._repr_mimebundle_()
        if bundle is None:
            return None
        widget_data, metadata = bundle
        if include is not None:
            widget_data = {mime: value for mime, value in widget_data.items() if mime in include}
        if exclude is not None:
            widget_data = {mime: value for mime, value in widget_data.items() if mime not in exclude}
        return widget_data, metadata
    data: dict[str, Any] = {
        HTML_MIME_TYPE: html,
        DISPLAY_MIME_TYPE: payload,
    }
    if include is not None:
        data = {mime: value for mime, value in data.items() if mime in include}
    if exclude is not None:
        data = {mime: value for mime, value in data.items() if mime not in exclude}
    return data, {DISPLAY_MIME_TYPE: {
        "id": obj.id,
        "automatic": True,
        "view_id": view_id,
        "artifact_fingerprint": artifact.fingerprint,
    }}

def publish_display_data(data: dict[str, Any], metadata: dict[Any, Any] | None = None, *, transient: dict[str, Any] | None = None, **kwargs: Any) -> None:
    '''

    '''
    # This import MUST be deferred or it will introduce a hard dependency on IPython
    from IPython.display import publish_display_data
    publish_display_data(data, metadata, transient=transient, **kwargs)


type ProxyUrlFunc = Callable[[int | None], str]

def show_doc(obj: Model | Sequence[UIElement], state: State,
        resources: ResourcePolicy | Resources | None = None) -> DocumentViewHandle:
    '''

    '''
    # Notebook output only supports a single document root, but ``show`` accepts
    # a sequence of UIElements (which file and server output render directly).
    # Wrap such a sequence in a column layout here so the same call works in all
    # output modes instead of raising an opaque error. See issue #14861.
    if isinstance(obj, Sequence):
        from ..layouts import column
        obj = column(*obj)

    added_root = obj not in state.document.roots
    if added_root:
        state.document.add_root(obj)

    from ..embed.notebook import notebook_content
    from .jupyter import DISPLAY_MIME_TYPE, display_payload

    use_anywidget = _use_anywidget()
    _require_marimo_anywidget()
    if _is_colab_runtime() and not use_anywidget:
        raise RuntimeError(
            "Connected Bokeh output in Colab requires AnyWidget 0.11 or later. "
            "Install Bokeh's notebook extra with 'pip install bokeh[notebook]'.",
        )
    artifact, fragment = notebook_content(obj, live=True)
    resource_id = _ensure_notebook_resources(artifact, resources, publish=not use_anywidget)
    live_id = make_id()
    view_id = make_id()
    fallback = _static_fallback(_STATIC_FALLBACK_MESSAGE)
    html = fragment.html.replace("</div>", f"{fallback}</div>", 1)
    payload = display_payload(artifact, resource_id, view_id, live_id=live_id)

    handle = DocumentViewHandle(obj, live_id=live_id, view_id=view_id, resources=resources)
    root_key = (id(state.document), id(obj))
    handle._attach(state.document, output_root=added_root or root_key in _OUTPUT_DOCUMENT_ROOTS)
    _retain_document_handle(handle)
    if not use_anywidget:
        _register_notebook_comm_target()

    try:
        if use_anywidget:
            from IPython.display import display  # type: ignore[attr-defined]

            from ._anywidget import display_widget

            widget = display_widget(payload, html, _RESOURCE_RECORDS, handle=handle)
            handle._retain_frontend(widget)
            display(widget)
            return handle
        publish_display_data({
            HTML_MIME_TYPE: html,
            DISPLAY_MIME_TYPE: payload,
        }, metadata={
            DISPLAY_MIME_TYPE: {"id": obj.id, "live": True, "view_id": view_id},
        })
    except BaseException:
        if handle is not None:
            handle.close()
        raise

    return handle

def show_hosted_app(app: NotebookApplication, state: State,
        resources: ResourcePolicy | Resources | None = None) -> ApplicationViewHandle:
    ''' Display a running :class:`~bokeh.io.NotebookApplication`. '''
    del state
    if app.stopped:
        raise RuntimeError(
            "This notebook application has stopped. Re-run the cell that calls serve(...) "
            "to create a new application, then call show(app) again.",
        )

    from ..embed import embed_server
    from .jupyter import DISPLAY_MIME_TYPE, display_payload

    use_anywidget = _use_anywidget()
    _require_marimo_anywidget()
    if _is_colab_runtime() and not use_anywidget:
        raise RuntimeError(
            "Connected Bokeh applications in Colab require AnyWidget 0.11 or later. "
            "Install Bokeh's notebook extra with 'pip install bokeh[notebook]'.",
        )
    view_id = make_id()
    artifact = embed_server(app.url, metadata={"notebook_application_id": app.application_id})
    resource_id = _ensure_notebook_resources(artifact, resources, publish=not use_anywidget)
    payload = display_payload(artifact, resource_id, view_id, application_id=app.application_id)
    html = artifact.fragment(resources="none").html
    html = html.replace("</div>", f"{_static_fallback(_STATIC_FALLBACK_MESSAGE)}</div>", 1)
    handle = ApplicationViewHandle(app, view_id)
    _retain_application_handle(handle)
    if not use_anywidget:
        _register_notebook_comm_target()
    try:
        if use_anywidget:
            from IPython.display import display  # type: ignore[attr-defined]

            from ._anywidget import display_widget

            widget = display_widget(payload, html, _RESOURCE_RECORDS, handle=handle)
            handle._retain_frontend(widget)
            display(widget)
            return handle
        publish_display_data({
            HTML_MIME_TYPE: html,
            DISPLAY_MIME_TYPE: payload,
        }, metadata={
            DISPLAY_MIME_TYPE: {"application_id": app.application_id, "view_id": view_id},
        })
    except BaseException:
        handle.close()
        raise
    return handle

def _close_application_views(app: NotebookApplication) -> None:
    for handle in tuple(_APPLICATION_VIEW_HANDLES.values()):
        if handle.application is app:
            handle.close()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_PUBLISHED_RESOURCE_IDS: set[str] = set()

_RESOURCE_RECORDS: dict[str, dict[str, Any]] = {}
_ARTIFACT_OWNERS: dict[str, str] = {}
_RESOURCE_COMM_KERNEL: Any | None = None
_RESOURCE_COMM_TARGET = RESOURCE_COMM_TARGET

def _static_fallback(message: str, *, title: str = "Interactive Bokeh output unavailable") -> str:
    return (
        f'<div class="bk-notebook-static-fallback" {STATIC_FALLBACK_ATTRIBUTE}="" role="note" '
        'style="border:1px solid #e6a3a3;border-left:4px solid #c33;padding:8px 12px;margin:4px 0;'
        f'background:#fff5f5;color:#222;font:13px/1.4 system-ui,sans-serif"><strong>{escape(title)}</strong>'
        f'<p style="margin:4px 0 0">{escape(message)}</p></div>'
    )

def _register_resource_comm_target() -> None:
    global _RESOURCE_COMM_KERNEL
    try:
        from IPython import get_ipython

        shell = get_ipython()
        kernel = getattr(shell, "kernel", None)
        if kernel is None or kernel is _RESOURCE_COMM_KERNEL:
            return

        def send_resource(comm: Any, message: dict[str, Any]) -> None:
            data = message.get("content", {}).get("data", {})
            resource_id = data.get("resource_id")
            record = _RESOURCE_RECORDS.get(resource_id)
            if record is None:
                comm.send({
                    "resource_id": resource_id,
                    "error": "RESOURCE_NOT_AVAILABLE",
                    "message": "The kernel has no record of this resource. Re-run the display cell.",
                })
            else:
                comm.send(record)
            comm.close()

        kernel.comm_manager.register_target(_RESOURCE_COMM_TARGET, send_resource)
        _RESOURCE_COMM_KERNEL = kernel
    except Exception as error:
        log.debug("Could not register the Bokeh resource recovery comm target: %s", error)

def _publish_resource_record(resolved: ResolvedResources, load_timeout: int, *, publish: bool = True) -> str:
    from .jupyter import (
        RESOURCES_MIME_TYPE,
        resource_artifact_ids,
        resource_asset_subset,
        resource_javascript,
        resource_payload,
    )

    required_ids = resource_artifact_ids(resolved)
    new_ids = {artifact_id for artifact_id in required_ids if artifact_id not in _ARTIFACT_OWNERS}
    dependencies = list(dict.fromkeys(
        _ARTIFACT_OWNERS[artifact_id]
        for artifact_id in required_ids
        if artifact_id in _ARTIFACT_OWNERS
    ))

    if not new_ids and len(dependencies) == 1:
        # Re-executing the cell that originally published this record replaces
        # its output, but the live kernel remains the recovery owner. Keep its
        # comm target registered so a subsequent frontend reload can request
        # the preserved record even though no saved output owns it anymore.
        _register_resource_comm_target()
        resource_id = dependencies[0]
        if publish and resource_id not in _PUBLISHED_RESOURCE_IDS:
            _PUBLISHED_RESOURCE_IDS.add(resource_id)
            record = _RESOURCE_RECORDS[resource_id]
            publish_display_data({
                JS_MIME_TYPE: record["javascript"],
                RESOURCES_MIME_TYPE: record["payload"],
            })
        return resource_id

    delta = resource_asset_subset(resolved, new_ids)
    payload = resource_payload(resolved, load_timeout, dependencies=dependencies, assets=delta)
    resource_id = payload["resource_id"]
    javascript = resource_javascript(payload, delta)
    _RESOURCE_RECORDS[resource_id] = {"payload": payload, "javascript": javascript}
    for artifact_id in new_ids:
        _ARTIFACT_OWNERS[artifact_id] = resource_id
    _register_resource_comm_target()

    if publish and resource_id not in _PUBLISHED_RESOURCE_IDS:
        _PUBLISHED_RESOURCE_IDS.add(resource_id)
        publish_display_data({
            JS_MIME_TYPE: javascript,
            RESOURCES_MIME_TYPE: payload,
        })
    return resource_id

def _ensure_notebook_resources(artifact: EmbedArtifact, resources: ResourcePolicy | Resources | None = None,
        load_timeout: int = 5000, *, publish: bool = True) -> str:
    from ..embed.resources import ResourcePolicy
    from ..resources import Resources
    from ..settings import settings

    selected = resources or Resources(mode=settings.resources())
    policy = ResourcePolicy.build(selected)
    resolved = policy.resolve(artifact.requires, bokeh_version=artifact.bokeh_version)
    return _publish_resource_record(resolved, load_timeout, publish=publish)

def _reset_notebook_resources() -> None:
    global _NOTEBOOK_COMM_KERNEL, _RESOURCE_COMM_KERNEL
    for handle in tuple(_DOCUMENT_VIEW_HANDLES.values()):
        handle.close()
    for application_handle in tuple(_APPLICATION_VIEW_HANDLES.values()):
        application_handle.close()
    _PUBLISHED_RESOURCE_IDS.clear()
    _RESOURCE_RECORDS.clear()
    _ARTIFACT_OWNERS.clear()
    _DOCUMENT_VIEW_HANDLES_BY_VIEW.clear()
    _OUTPUT_DOCUMENT_ROOTS.clear()
    _NOTEBOOK_COMM_KERNEL = None
    _RESOURCE_COMM_KERNEL = None

def _server_url(url: str, port: int | None) -> str:
    '''

    '''
    parsed = urllib.parse.urlsplit(url if "://" in url else f"http://{url}")
    if parsed.scheme not in ("http", "https") or parsed.hostname is None:
        raise ValueError(f"Invalid notebook URL: {url!r}")
    if parsed.username is not None or parsed.password is not None:
        raise ValueError(
            "notebook_url must not contain credentials because notebook output is persisted; "
            "use cookie- or header-based proxy authentication instead",
        )

    hostname = f"[{parsed.hostname}]" if ":" in parsed.hostname else parsed.hostname
    netloc = f"{hostname}{f':{port}' if port is not None else ''}"
    path = parsed.path.rstrip("/") + "/"
    return urllib.parse.urlunsplit((parsed.scheme, netloc, path, "", ""))


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
       str: URL capable of traversing the JupyterHub proxy to return to this notebook session.
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
