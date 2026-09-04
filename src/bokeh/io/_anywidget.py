#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''AnyWidget transport for connected notebook output.'''

from __future__ import annotations

# Standard library imports
from collections.abc import Mapping
from pathlib import Path
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    cast,
)

# External imports
import anywidget
import traitlets

if TYPE_CHECKING:
    from .notebook import ApplicationViewHandle, DocumentViewHandle

_ESM = Path(__file__).parents[1] / "jupyter" / "anywidget.js"


class _WidgetComm:
    def __init__(self, widget: _DisplayWidget) -> None:
        self._widget = widget
        self._on_close: Callable[[Any], None] | None = None
        self._on_msg: Callable[[dict[str, Any]], None] | None = None
        self._closed = False
        self.comm_id = widget.model_id

    @property
    def closed(self) -> bool:
        return self._closed

    def send(self, data: Any = None, buffers: list[bytes] | None = None) -> None:
        if self._closed:
            raise RuntimeError("The AnyWidget transport is closed")
        self._widget.send(data, buffers=buffers)

    def on_close(self, callback: Callable[[Any], None]) -> None:
        self._on_close = callback

    def on_msg(self, callback: Callable[[dict[str, Any]], None]) -> None:
        self._on_msg = callback

    def frontend_message(self, content: dict[str, Any]) -> None:
        if not self._closed and self._on_msg is not None:
            self._on_msg({"content": {"data": content}})

    def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        self._widget.close()

    def frontend_closed(self) -> None:
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

    def __init__(self, *, payload: dict[str, Any], html: str, records: dict[str, dict[str, Any]],
            handle: DocumentViewHandle | ApplicationViewHandle | None = None) -> None:
        super().__init__(payload=payload, html=html)
        self._records = records
        self._handle = handle
        self._transport = _WidgetComm(self)
        self._connected = False
        self.on_msg(self._receive)

    def _repr_mimebundle_(self, **kwargs: Any) -> Any:
        bundle = super()._repr_mimebundle_(**kwargs)
        if bundle is None:
            return None
        data, metadata = bundle
        data = dict(data)
        metadata = dict(metadata)
        # Keep the widget MIME as the active host renderer while preserving the
        # common artifact HTML for static reopen/export. The display payload in
        # metadata is also the Jupyter extension's non-rendering ownership tag.
        data.setdefault("text/html", self.html)
        from .jupyter import DISPLAY_MIME_TYPE
        metadata[DISPLAY_MIME_TYPE] = dict(self.payload)
        return data, metadata

    def _receive(self, _widget: Any, content: dict[str, Any], _buffers: list[Any]) -> None:
        kind = content.get("kind")
        if kind == "ready":
            if self._transport.closed:
                self._transport = _WidgetComm(self)
            self._connected = True
            if self._handle is not None:
                self._handle._connect(cast(Any, self._transport))
        elif kind == "request_resource":
            request_id = content.get("request_id")
            resource_id = content.get("resource_id")
            if isinstance(request_id, str) and request_id and isinstance(resource_id, str) and resource_id:
                record = self._records.get(resource_id)
                if record is not None:
                    self.send({"kind": "resource", "request_id": request_id, "record": record})
                    return
            self.send({
                "kind": "resource_error",
                "request_id": request_id,
                "code": "RESOURCE_RECORD_MISSING",
                "message": f"The shared BokehJS resource {resource_id!s} is unavailable.",
            })
        elif kind == "disposed":
            self._transport.frontend_closed()
            self._connected = False
        elif kind == "resync":
            self._transport.frontend_message(content)


def display_widget(payload: Mapping[str, Any], html: str, records: dict[str, dict[str, Any]], *,
        handle: DocumentViewHandle | ApplicationViewHandle | None = None) -> _DisplayWidget:
    return _DisplayWidget(payload=dict(payload), html=html, records=records, handle=handle)
