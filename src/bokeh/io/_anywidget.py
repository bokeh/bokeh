#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''AnyWidget transport for connected notebook output.'''

from __future__ import annotations

# Standard library imports
from collections import OrderedDict
from collections.abc import Mapping
from pathlib import Path
from time import monotonic
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Literal,
    TypedDict,
    cast,
)

# External imports
import anywidget
import traitlets

if TYPE_CHECKING:
    from .jupyter import ExecutableResourceRecord
    from .notebook import ApplicationViewHandle, DocumentViewHandle

_ESM = (Path(__file__).parents[1] / "jupyter" / "anywidget.js").read_text(encoding="utf-8")
_TRANSPORT_LEASE_SECONDS = 300.0
_MAX_TRANSPORTS = 8
_MAX_INACTIVE_WIDGETS = 128
_RETAINED_WIDGETS: OrderedDict[str, _DisplayWidget] = OrderedDict()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class _ResourceResponse(TypedDict):
    kind: Literal["resource"]
    request_id: str
    record: ExecutableResourceRecord


class _ResourceError(TypedDict):
    kind: Literal["resource_error"]
    request_id: str
    code: Literal["RESOURCE_RECORD_MISSING"]
    message: str


def _prune_retained_widgets() -> None:
    for widget in tuple(_RETAINED_WIDGETS.values()):
        widget._prune_transports(None)
    inactive = [
        (model_id, widget)
        for model_id, widget in _RETAINED_WIDGETS.items()
        if not any(not transport.closed for transport in widget._transports.values())
    ]
    while len(inactive) > _MAX_INACTIVE_WIDGETS:
        model_id, retained = inactive.pop(0)
        _RETAINED_WIDGETS.pop(model_id, None)
        retained.close()


def _retain_widget(widget: _DisplayWidget) -> None:
    _RETAINED_WIDGETS[widget._retention_id] = widget
    _RETAINED_WIDGETS.move_to_end(widget._retention_id)
    _prune_retained_widgets()


def _resource_reply(request_id: object, resource_id: object,
        records: Mapping[str, ExecutableResourceRecord]) -> _ResourceResponse | _ResourceError:
    normalized_request_id = request_id if isinstance(request_id, str) else ""
    if normalized_request_id and isinstance(resource_id, str) and resource_id:
        record = records.get(resource_id)
        if record is not None:
            return _ResourceResponse(kind="resource", request_id=normalized_request_id, record=record)
    return _ResourceError(
        kind="resource_error",
        request_id=normalized_request_id,
        code="RESOURCE_RECORD_MISSING",
        message=f"The shared BokehJS resource {resource_id!s} is unavailable.",
    )


class _WidgetComm:
    def __init__(self, widget: _DisplayWidget, frontend_id: str) -> None:
        self._widget = widget
        self._frontend_id = frontend_id
        self._on_close: Callable[[Any], None] | None = None
        self._on_msg: Callable[[dict[str, Any]], None] | None = None
        self._closed = False
        self.comm_id = f"{widget.model_id}:{frontend_id}"

    @property
    def closed(self) -> bool:
        '''Report whether the transport is closed.

        Returns:
            Whether the transport is closed.

        '''
        return self._closed

    def send(self, data: Any = None, buffers: list[bytes] | None = None) -> None:
        '''Send a message to the frontend widget.

        Args:
            data: The message payload.
            buffers: Optional binary message buffers.

        Returns:
            None

        '''
        if self._closed:
            raise RuntimeError("The AnyWidget transport is closed")
        payload = {**data, "frontend_id": self._frontend_id} if isinstance(data, dict) else data
        self._widget.send(payload, buffers=buffers)

    def on_close(self, callback: Callable[[Any], None]) -> None:
        '''Register the frontend-close callback.

        Args:
            callback: The callback to invoke when the frontend closes.

        Returns:
            None

        '''
        self._on_close = callback

    def on_msg(self, callback: Callable[[dict[str, Any]], None]) -> None:
        '''Register the frontend-message callback.

        Args:
            callback: The callback to invoke for frontend messages.

        Returns:
            None

        '''
        self._on_msg = callback

    def frontend_message(self, content: dict[str, Any]) -> None:
        '''Deliver a frontend message to the registered callback.

        Args:
            content: The frontend message payload.

        Returns:
            None

        '''
        if not self._closed and self._on_msg is not None:
            self._on_msg({"content": {"data": content}})

    def close(self) -> None:
        '''Disconnect this frontend while preserving its rendered artifact.

        Returns:
            None

        '''
        if self._closed:
            return
        try:
            self.send({"kind": "close"})
        except Exception:
            pass
        self._closed = True

    def frontend_closed(self) -> None:
        '''Record that the frontend closed the transport.

        Returns:
            None

        '''
        if self._closed:
            return
        self._closed = True
        if self._on_close is not None:
            self._on_close({})


class _DisplayWidget(anywidget.AnyWidget):
    _esm = _ESM

    kind = traitlets.Unicode("display").tag(sync=True)
    payload = traitlets.Dict().tag(sync=True)
    html = traitlets.Unicode().tag(sync=True)

    def __init__(self, *, payload: dict[str, Any], html: str, records: Mapping[str, ExecutableResourceRecord],
            handle: DocumentViewHandle | ApplicationViewHandle | None = None) -> None:
        super().__init__(payload=payload, html=html)
        self._retention_id = self.model_id
        self._records = records
        self._handle = handle
        self._transports: dict[str, _WidgetComm] = {}
        self._transport_seen: dict[str, float] = {}
        self._released = False
        self.on_msg(self._receive)
        if handle is None:
            _retain_widget(self)

    def _repr_mimebundle_(self, **kwargs: Any) -> Any:
        bundle = super()._repr_mimebundle_(**kwargs)
        if bundle is None:
            return None
        data, metadata = bundle
        data = dict(data)
        metadata = dict(metadata)
        # JupyterLab gives Bokeh's MIME renderer a higher priority than the
        # widget renderer. Other hosts ignore that MIME member and select the
        # AnyWidget view, with HTML as the final static fallback.
        data.setdefault("text/html", self.html)
        from .jupyter import DISPLAY_MIME_TYPE
        data[DISPLAY_MIME_TYPE] = dict(self.payload)
        return data, metadata

    def close(self) -> None:
        _RETAINED_WIDGETS.pop(self._retention_id, None)
        if getattr(self, "comm", None) is None:
            return
        self._transports.clear()
        self._transport_seen.clear()
        self._records = {}
        self._handle = None
        super().close()

    def _receive(self, _widget: Any, content: dict[str, Any], _buffers: list[Any]) -> None:
        frontend_id = content.get("frontend_id")
        if not isinstance(frontend_id, str) or not frontend_id:
            return
        kind = content.get("kind")
        self._prune_transports(frontend_id if kind in ("ready", "active", "heartbeat") else None)
        match kind:
            case "ready" | "active" | "heartbeat":
                self._transport_seen[frontend_id] = monotonic()
                transport = self._transports.get(frontend_id)
                if transport is None or transport.closed:
                    transport = _WidgetComm(self, frontend_id)
                    self._transports[frontend_id] = transport
                    if self._released:
                        transport.close()
                        self._transports.pop(frontend_id, None)
                        self._transport_seen.pop(frontend_id, None)
                        return
                    if self._handle is not None:
                        self._handle._connect(cast(Any, transport))
            case "request_resource":
                reply = _resource_reply(
                    content.get("request_id"), content.get("resource_id"), self._records,
                )
                self.send({**reply, "frontend_id": frontend_id})
            case "inactive" | "disposed":
                transport = self._transports.pop(frontend_id, None)
                self._transport_seen.pop(frontend_id, None)
                if transport is not None:
                    transport.frontend_closed()
                if kind == "disposed" and not self._transports and (self._released or self._handle is None):
                    self.close()
            case "resync" | "application_url":
                transport = self._transports.get(frontend_id)
                if transport is not None:
                    transport.frontend_message(content)
        _prune_retained_widgets()

    def _prune_transports(self, incoming_id: str | None) -> None:
        cutoff = monotonic() - _TRANSPORT_LEASE_SECONDS
        expired = [frontend_id for frontend_id, seen in self._transport_seen.items() if seen < cutoff]
        incoming = incoming_id is not None and (incoming_id not in self._transport_seen or incoming_id in expired)
        overflow = max(0, len(self._transport_seen) - len(expired) - _MAX_TRANSPORTS + int(incoming))
        oldest = [
            frontend_id for frontend_id, _seen in sorted(self._transport_seen.items(), key=lambda item: item[1])
            if frontend_id not in expired
        ][:overflow]
        for frontend_id in [*expired, *oldest]:
            self._transport_seen.pop(frontend_id, None)
            transport = self._transports.pop(frontend_id, None)
            if transport is not None:
                transport.frontend_closed()

    def disconnect(self) -> None:
        '''Disconnect every frontend without removing its static artifact.

        Returns:
            None

        '''
        if self._released:
            return
        self._released = True
        self._handle = None
        self._records = {}
        for transport in tuple(self._transports.values()):
            transport.close()
        _retain_widget(self)


def display_widget(payload: Mapping[str, Any], html: str, records: Mapping[str, ExecutableResourceRecord], *,
        handle: DocumentViewHandle | ApplicationViewHandle | None = None) -> _DisplayWidget:
    '''Construct an AnyWidget adapter for one Bokeh notebook display.

    Args:
        payload:
            The versioned Bokeh display payload.
        html:
            The portable HTML fallback stored with the output.
        records:
            Resource records available to the frontend on demand.
        handle:
            The optional connected document or application owner.

    Returns:
        The AnyWidget display adapter.

    '''
    return _DisplayWidget(payload=dict(payload), html=html, records=records, handle=handle)
