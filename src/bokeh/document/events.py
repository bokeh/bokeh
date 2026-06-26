#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide events that represent various changes to Bokeh Documents.

These events are used internally to signal changes to Documents. For
information about user-facing (e.g. UI or tool) events, see the reference
for :ref:`bokeh.events`.

These events are employed for incoming and outgoing websocket messages and
internally for triggering callbacks. For example, the sequence of events that
happens when a user calls a Document API or sets a property resulting in a
"patch event" to the Document:

.. code-block::

    user invokes Document API
        -> Document API triggers event objects
        -> registered callbacks are executed
        -> Session callback generates JSON message from event object
        -> Session sends JSON message over websocket

But events may also be triggered from the client, and arrive as JSON messages
over the transport layer, which is why the JSON handling and Document API must
be separated. Consider the alternative sequence of events:

.. code-block::

    Session receives JSON message over websocket
        -> Document calls event.handle_json
        -> handle_json invokes appropriate Document API
        -> Document API triggers event objects
        -> registered callbacks are executed
        -> Session callback suppresses outgoing event

As a final note, message "ping-pong" is avoided by recording a "setter" when
events objects are created. If the session callback notes the event setter is
itself, then no further action (e.g. sending an outgoing change event identical
to the incoming event it just processed) is taken.

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
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    ClassVar,
    Literal,
    Protocol,
    cast,
    runtime_checkable,
)

# Bokeh imports
from ..core.serialization import Serializable
from .json import (
    ColumnDataChanged,
    ColumnsPatched,
    ColumnsStreamed,
    DocumentPatched,
    MessageSent,
    ModelChanged,
    RootAdded,
    RootRemoved,
    TitleChanged,
)

if TYPE_CHECKING:
    import pandas as pd

    from ..core.has_props import Setter
    from ..core.serialization import Serializer
    from ..model import Model
    from ..models.sources import DataDict, Patches
    from ..protocol.message import BufferRef
    from ..server.callbacks import SessionCallback
    from .document import Document

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ColumnDataChangedEvent',
    'ColumnsStreamedEvent',
    'ColumnsPatchedEvent',
    'DocumentChangedEvent',
    'DocumentPatchedEvent',
    'ModelChangedEvent',
    'RootAddedEvent',
    'RootRemovedEvent',
    'SessionCallbackAdded',
    'SessionCallbackRemoved',
    'TitleChangedEvent',
    'MessageSentEvent',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

if TYPE_CHECKING:
    type Buffers = list[BufferRef] | None

    type Invoker = Callable[..., Any] # TODO
    type PatchEventHandler = Callable[[Document, Setter | None, dict[str, Any]], None]

type PatchEventKind = Literal[
    "MessageSent",
    "ModelChanged",
    "ColumnDataChanged",
    "ColumnsStreamed",
    "ColumnsPatched",
    "TitleChanged",
    "RootAdded",
    "RootRemoved",
]

@runtime_checkable
class DocumentChangedMixin(Protocol):
    def _document_changed(self, event: DocumentChangedEvent) -> None: ...
@runtime_checkable
class DocumentPatchedMixin(Protocol):
    def _document_patched(self, event: DocumentPatchedEvent) -> None: ...
@runtime_checkable
class DocumentMessageSentMixin(Protocol):
    def _document_message_sent(self, event: MessageSentEvent) -> None: ...
@runtime_checkable
class DocumentModelChangedMixin(Protocol):
    def _document_model_changed(self, event: ModelChangedEvent) -> None: ...
@runtime_checkable
class ColumnDataChangedMixin(Protocol):
    def _column_data_changed(self, event: ColumnDataChangedEvent) -> None: ...
@runtime_checkable
class ColumnsStreamedMixin(Protocol):
    def _columns_streamed(self, event: ColumnsStreamedEvent) -> None: ...
@runtime_checkable
class ColumnsPatchedMixin(Protocol):
    def _columns_patched(self, event: ColumnsPatchedEvent) -> None: ...
@runtime_checkable
class SessionCallbackAddedMixin(Protocol):
    def _session_callback_added(self, event: SessionCallbackAdded) -> None: ...
@runtime_checkable
class SessionCallbackRemovedMixin(Protocol):
    def _session_callback_removed(self, event: SessionCallbackRemoved) -> None: ...

@runtime_checkable
class StreamableDataSource(Protocol):
    def _stream(self, new_data: DataDict | pd.Series[Any] | pd.DataFrame,  # pyright: ignore[reportInvalidTypeArguments]
            rollover: int | None = None, setter: Setter | None = None) -> None: ...

@runtime_checkable
class PatchableDataSource(Protocol):
    def patch(self, patches: Patches, setter: Setter | None = None) -> None: ...

class DocumentChangedEvent:
    ''' Base class for all internal events representing a change to a
    Bokeh Document.

    '''

    document: Document
    setter: Setter | None
    callback_invoker: Invoker | None

    def __init__(self, document: Document, setter: Setter | None = None, callback_invoker: Invoker | None = None) -> None:
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.

            callback_invoker (callable, optional) :
                A callable that will invoke any Model callbacks that should
                be executed in response to the change that triggered this
                event. (default: None)

        '''
        self.document = document
        self.setter = setter
        self.callback_invoker = callback_invoker

    def combine(self, event: DocumentChangedEvent) -> bool:
        '''

        '''
        return False

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._document_changed`` if it exists.

        '''
        if isinstance(receiver, DocumentChangedMixin):
            receiver._document_changed(self)

class DocumentPatchedEvent(DocumentChangedEvent, Serializable):
    ''' A Base class for events that represent updating Bokeh Models and
    their properties.

    '''

    _handlers: ClassVar[dict[str, PatchEventHandler]] = {}

    def __init_subclass__(cls, *, kind: PatchEventKind) -> None:
        cls._handlers[kind] = cls._handle_json

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._document_patched`` if it exists.

        '''
        super().dispatch(receiver)
        if isinstance(receiver, DocumentPatchedMixin):
            receiver._document_patched(self)

    def to_serializable(self, serializer: Serializer) -> DocumentPatched:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        *Sub-classes must implement this method.*

        Args:
            serializer (Serializer):

        '''
        raise NotImplementedError()


    @staticmethod
    def handle_event(doc: Document, event_rep: DocumentPatched, setter: Setter | None) -> None:
        '''

        '''
        event_data = dict(event_rep)
        event_kind = event_data.pop("kind")
        if not isinstance(event_kind, str):
            raise RuntimeError(f"invalid patch event type '{event_kind!r}'")
        handler = DocumentPatchedEvent._handlers.get(event_kind, None)
        if handler is None:
            raise RuntimeError(f"unknown patch event type '{event_kind!r}'")

        handler(doc, setter, event_data)

    @classmethod
    def _handle_json(cls, doc: Document, setter: Setter | None, event_data: dict[str, Any]) -> None:
        raise NotImplementedError()

    @staticmethod
    def _handle_event(doc: Document, event: Any) -> None:
        raise NotImplementedError()

class MessageSentEvent(DocumentPatchedEvent, kind="MessageSent"):
    '''

    '''

    kind: ClassVar[Literal["MessageSent"]] = "MessageSent"

    def __init__(self, document: Document, msg_type: str, msg_data: Any | bytes,
            setter: Setter | None = None, callback_invoker: Invoker | None = None):
        super().__init__(document, setter, callback_invoker)
        self.msg_type = msg_type
        self.msg_data = msg_data

    def dispatch(self, receiver: Any) -> None:
        super().dispatch(receiver)
        if isinstance(receiver, DocumentMessageSentMixin):
            receiver._document_message_sent(self)

    def to_serializable(self, serializer: Serializer) -> MessageSent:
        return MessageSent(
            kind=self.kind,
            msg_type=self.msg_type,
            msg_data=serializer.encode(self.msg_data),
        )

    @classmethod
    def _handle_json(cls, doc: Document, setter: Setter | None, event_data: dict[str, Any]) -> None:
        event = cls(document=doc, setter=setter, msg_type=event_data["msg_type"], msg_data=event_data["msg_data"])
        cls._handle_event(doc, event)

    @staticmethod
    def _handle_event(doc: Document, event: MessageSentEvent) -> None:
        message_callbacks = doc.callbacks._message_callbacks.get(event.msg_type, [])
        for cb in message_callbacks:
            cb(event.msg_data)

class ModelChangedEvent(DocumentPatchedEvent, kind="ModelChanged"):
    ''' A concrete event representing updating an attribute and value of a
    specific Bokeh Model.

    '''

    kind: ClassVar[Literal["ModelChanged"]] = "ModelChanged"

    def __init__(self, document: Document, model: Model, attr: str, new: Any,
            setter: Setter | None = None, callback_invoker: Invoker | None = None):
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            model (Model) :
                A Model to update

            attr (str) :
                The name of the attribute to update on the model.

            new (object) :
                The new value of the attribute

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                See :class:`~bokeh.document.events.DocumentChangedEvent`
                for more details.

            callback_invoker (callable, optional) :
                A callable that will invoke any Model callbacks that should
                be executed in response to the change that triggered this
                event. (default: None)


        '''
        super().__init__(document, setter, callback_invoker)
        self.model = model
        self.attr = attr
        self.new = new

    def combine(self, event: DocumentChangedEvent) -> bool:
        '''

        '''
        if not isinstance(event, ModelChangedEvent):
            return False

        # If these are not true something weird is going on, maybe updates from
        # Python bokeh.client, don't try to combine
        if self.setter != event.setter:
            return False
        if self.document != event.document:
            return False

        if (self.model == event.model) and (self.attr == event.attr):
            self.new = event.new
            self.callback_invoker = event.callback_invoker
            return True

        return False

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._document_model_changed`` if it exists.

        '''
        super().dispatch(receiver)
        if isinstance(receiver, DocumentModelChangedMixin):
            receiver._document_model_changed(self)

    def to_serializable(self, serializer: Serializer) -> ModelChanged:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        Args:
            serializer (Serializer):

        '''
        return ModelChanged(
            kind  = self.kind,
            model = self.model.ref,
            attr  = self.attr,
            new   = serializer.encode(self.new),
        )

    @classmethod
    def _handle_json(cls, doc: Document, setter: Setter | None, event_data: dict[str, Any]) -> None:
        event = cls(document=doc, setter=setter, model=event_data["model"], attr=event_data["attr"], new=event_data["new"])
        cls._handle_event(doc, event)

    @staticmethod
    def _handle_event(doc: Document, event: ModelChangedEvent) -> None:
        model = event.model
        attr = event.attr
        value = event.new
        model.set_from_json(attr, value, setter=event.setter)

class ColumnDataChangedEvent(DocumentPatchedEvent, kind="ColumnDataChanged"):
    ''' A concrete event representing efficiently replacing *all*
    existing data for a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    kind: ClassVar[Literal["ColumnDataChanged"]] = "ColumnDataChanged"

    def __init__(self, document: Document, model: Model, attr: str, data: DataDict | None = None,
            cols: list[str] | None = None, setter: Setter | None = None, callback_invoker: Invoker | None = None):
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            column_source (ColumnDataSource) :

            cols (list[str]) :
                optional explicit list of column names to update. If None, all
                columns will be updated (default: None)

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                See :class:`~bokeh.document.events.DocumentChangedEvent`
                for more details.

            callback_invoker (callable, optional) :
                A callable that will invoke any Model callbacks that should
                be executed in response to the change that triggered this
                event. (default: None)


        '''
        super().__init__(document, setter, callback_invoker)
        self.model = model
        self.attr = attr
        self.data = data
        self.cols = cols

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._column_data_changed`` if it exists.

        '''
        super().dispatch(receiver)
        if isinstance(receiver, ColumnDataChangedMixin):
            receiver._column_data_changed(self)

    def to_serializable(self, serializer: Serializer) -> ColumnDataChanged:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'          : 'ColumnDataChanged'
                'column_source' : <reference to a CDS>
                'data'          : <new data to steam to column_source>
                'cols'          : <specific columns to update>
            }

        Args:
            serializer (Serializer):

        '''
        data = self.data if self.data is not None else getattr(self.model, self.attr)
        cols = self.cols

        if cols is not None:
            data = {col: value for col in cols if (value := data.get(col)) is not None}

        return ColumnDataChanged(
            kind  = self.kind,
            model = self.model.ref,
            attr  = self.attr,
            data  = serializer.encode(data),
            cols  = serializer.encode(cols),
        )

    @classmethod
    def _handle_json(cls, doc: Document, setter: Setter | None, event_data: dict[str, Any]) -> None:
        event = cls(document=doc, setter=setter, model=event_data["model"], attr=event_data["attr"], data=event_data["data"], cols=event_data["cols"])
        cls._handle_event(doc, event)

    @staticmethod
    def _handle_event(doc: Document, event: ColumnDataChangedEvent) -> None:
        model = event.model
        attr = event.attr
        data = event.data
        model.set_from_json(attr, data, setter=event.setter)

class ColumnsStreamedEvent(DocumentPatchedEvent, kind="ColumnsStreamed"):
    ''' A concrete event representing efficiently streaming new data
    to a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    kind: ClassVar[Literal["ColumnsStreamed"]] = "ColumnsStreamed"

    data: DataDict

    def __init__(self, document: Document, model: Model, attr: str, data: DataDict | pd.DataFrame,
            rollover: int | None = None, setter: Setter | None = None, callback_invoker: Invoker | None = None):
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            column_source (ColumnDataSource) :
                The data source to stream new data to.

            data (dict or DataFrame) :
                New data to stream.

                If a DataFrame, will be stored as ``{c: df[c] for c in df.columns}``

            rollover (int, optional) :
                A rollover limit. If the data source columns exceed this
                limit, earlier values will be discarded to maintain the
                column length under the limit.

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                See :class:`~bokeh.document.events.DocumentChangedEvent`
                for more details.

            callback_invoker (callable, optional) :
                A callable that will invoke any Model callbacks that should
                be executed in response to the change that triggered this
                event. (default: None)

        '''
        super().__init__(document, setter, callback_invoker)
        self.model = model
        self.attr = attr


        stream_data: DataDict
        if isinstance(data, dict):
            stream_data = data
        else:
            import pandas as pd
            assert isinstance(data, pd.DataFrame)
            stream_data = cast(Any, {c: data[c] for c in data.columns})

        self.data = stream_data
        self.rollover = rollover

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._columns_streamed`` if it exists.

        '''
        super().dispatch(receiver)
        if isinstance(receiver, ColumnsStreamedMixin):
            receiver._columns_streamed(self)

    def to_serializable(self, serializer: Serializer) -> ColumnsStreamed:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'          : 'ColumnsStreamed'
                'column_source' : <reference to a CDS>
                'data'          : <new data to steam to column_source>
                'rollover'      : <rollover limit>
            }

        Args:
            serializer (Serializer):

        '''
        return ColumnsStreamed(
            kind     = self.kind,
            model    = self.model.ref,
            attr     = self.attr,
            data     = serializer.encode(self.data),
            rollover = self.rollover,
        )

    @classmethod
    def _handle_json(cls, doc: Document, setter: Setter | None, event_data: dict[str, Any]) -> None:
        event = cls(document=doc, setter=setter, model=event_data["model"], attr=event_data["attr"], data=event_data["data"], rollover=event_data["rollover"])
        cls._handle_event(doc, event)

    @staticmethod
    def _handle_event(doc: Document, event: ColumnsStreamedEvent) -> None:
        model = event.model
        attr = event.attr
        assert attr == "data"
        data = event.data
        rollover = event.rollover
        if not isinstance(model, StreamableDataSource):
            raise RuntimeError(f"expected streamable data source, got {model!r}")
        model._stream(data, rollover, event.setter)

class ColumnsPatchedEvent(DocumentPatchedEvent, kind="ColumnsPatched"):
    ''' A concrete event representing efficiently applying data patches
    to a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    kind: ClassVar[Literal["ColumnsPatched"]] = "ColumnsPatched"

    def __init__(self, document: Document, model: Model, attr: str, patches: Patches,
            setter: Setter | None = None, callback_invoker: Invoker | None = None):
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            column_source (ColumnDataSource) :
                The data source to apply patches to.

            patches (list) :

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                See :class:`~bokeh.document.events.DocumentChangedEvent`
                for more details.

            callback_invoker (callable, optional) :
                A callable that will invoke any Model callbacks that should
                be executed in response to the change that triggered this
                event. (default: None)

        '''
        super().__init__(document, setter, callback_invoker)
        self.model = model
        self.attr = attr
        self.patches = patches

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._columns_patched`` if it exists.

        '''
        super().dispatch(receiver)
        if isinstance(receiver, ColumnsPatchedMixin):
            receiver._columns_patched(self)

    def to_serializable(self, serializer: Serializer) -> ColumnsPatched:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'          : 'ColumnsPatched'
                'column_source' : <reference to a CDS>
                'patches'       : <patches to apply to column_source>
            }

        Args:
            serializer (Serializer):

        '''
        return ColumnsPatched(
            kind    = self.kind,
            model   = self.model.ref,
            attr    = self.attr,
            patches = serializer.encode(self.patches),
        )

    @classmethod
    def _handle_json(cls, doc: Document, setter: Setter | None, event_data: dict[str, Any]) -> None:
        event = cls(document=doc, setter=setter, model=event_data["model"], attr=event_data["attr"], patches=event_data["patches"])
        cls._handle_event(doc, event)

    @staticmethod
    def _handle_event(doc: Document, event: ColumnsPatchedEvent) -> None:
        model = event.model
        attr = event.attr
        assert attr == "data"
        patches = event.patches
        if not isinstance(model, PatchableDataSource):
            raise RuntimeError(f"expected patchable data source, got {model!r}")
        model.patch(patches, event.setter)

class TitleChangedEvent(DocumentPatchedEvent, kind="TitleChanged"):
    ''' A concrete event representing a change to the title of a Bokeh
    Document.

    '''

    kind: ClassVar[Literal["TitleChanged"]] = "TitleChanged"

    def __init__(self, document: Document, title: str,
            setter: Setter | None = None, callback_invoker: Invoker | None = None):
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            title (str) :
                The new title to set on the Document

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                See :class:`~bokeh.document.events.DocumentChangedEvent`
                for more details.

            callback_invoker (callable, optional) :
                A callable that will invoke any Model callbacks that should
                be executed in response to the change that triggered this
                event. (default: None)


        '''
        super().__init__(document, setter, callback_invoker)
        self.title = title

    def combine(self, event: DocumentChangedEvent) -> bool:
        '''

        '''
        if not isinstance(event, TitleChangedEvent):
            return False

        # If these are not true something weird is going on, maybe updates from
        # Python bokeh.client, don't try to combine
        if self.setter != event.setter:
            return False
        if self.document != event.document:
            return False

        self.title = event.title
        self.callback_invoker = event.callback_invoker
        return True

    def to_serializable(self, serializer: Serializer) -> TitleChanged:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'  : 'TitleChanged'
                'title' : <new title to set>
            }

        Args:
            serializer (Serializer):

        '''
        return TitleChanged(
            kind  = self.kind,
            title = self.title,
        )

    @classmethod
    def _handle_json(cls, doc: Document, setter: Setter | None, event_data: dict[str, Any]) -> None:
        event = cls(document=doc, setter=setter, title=event_data["title"])
        cls._handle_event(doc, event)

    @staticmethod
    def _handle_event(doc: Document, event: TitleChangedEvent) -> None:
        doc.set_title(event.title, event.setter)

class RootAddedEvent(DocumentPatchedEvent, kind="RootAdded"):
    ''' A concrete event representing a change to add a new Model to a
    Document's collection of "root" models.

    '''

    kind: ClassVar[Literal["RootAdded"]] = "RootAdded"

    def __init__(self, document: Document, model: Model, setter: Setter | None = None, callback_invoker: Invoker | None = None) -> None:
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            model (Model) :
                The Bokeh Model to add as a Document root.

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                See :class:`~bokeh.document.events.DocumentChangedEvent`
                for more details.

            callback_invoker (callable, optional) :
                A callable that will invoke any Model callbacks that should
                be executed in response to the change that triggered this
                event. (default: None)

        '''
        super().__init__(document, setter, callback_invoker)
        self.model = model

    def to_serializable(self, serializer: Serializer) -> RootAdded:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'  : 'RootAdded'
                'title' : <reference to a Model>
            }

        Args:
            serializer (Serializer):

        '''
        return RootAdded(
            kind  = self.kind,
            model = serializer.encode(self.model),
        )

    @classmethod
    def _handle_json(cls, doc: Document, setter: Setter | None, event_data: dict[str, Any]) -> None:
        event = cls(document=doc, setter=setter, model=event_data["model"])
        cls._handle_event(doc, event)

    @staticmethod
    def _handle_event(doc: Document, event: RootAddedEvent) -> None:
        model = event.model
        doc.add_root(model, event.setter)

class RootRemovedEvent(DocumentPatchedEvent, kind="RootRemoved"):
    ''' A concrete event representing a change to remove an existing Model
    from a Document's collection of "root" models.

    '''

    kind: ClassVar[Literal["RootRemoved"]] = "RootRemoved"

    def __init__(self, document: Document, model: Model, setter: Setter | None = None, callback_invoker: Invoker | None = None) -> None:
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            model (Model) :
                The Bokeh Model to remove as a Document root.

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                See :class:`~bokeh.document.events.DocumentChangedEvent`
                for more details.

            callback_invoker (callable, optional) :
                A callable that will invoke any Model callbacks that should
                be executed in response to the change that triggered this
                event. (default: None)


        '''
        super().__init__(document, setter, callback_invoker)
        self.model = model

    def to_serializable(self, serializer: Serializer) -> RootRemoved:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'  : 'RootRemoved'
                'title' : <reference to a Model>
            }

        Args:
            serializer (Serializer):

        '''
        return RootRemoved(
            kind  = self.kind,
            model = self.model.ref,
        )

    @classmethod
    def _handle_json(cls, doc: Document, setter: Setter | None, event_data: dict[str, Any]) -> None:
        event = cls(document=doc, setter=setter, model=event_data["model"])
        cls._handle_event(doc, event)

    @staticmethod
    def _handle_event(doc: Document, event: RootRemovedEvent) -> None:
        model = event.model
        doc.remove_root(model, event.setter)

class SessionCallbackAdded(DocumentChangedEvent):
    ''' A concrete event representing a change to add a new callback (e.g.
    periodic, timeout, or "next tick") to a Document.

    '''

    def __init__(self, document: Document, callback: SessionCallback) -> None:
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            callback (SessionCallback) :
                The callback to add

        '''
        super().__init__(document)
        self.callback = callback

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._session_callback_added`` if
        it exists.

        '''
        super().dispatch(receiver)
        if isinstance(receiver, SessionCallbackAddedMixin):
            receiver._session_callback_added(self)

class SessionCallbackRemoved(DocumentChangedEvent):
    ''' A concrete event representing a change to remove an existing callback
    (e.g. periodic, timeout, or "next tick") from a Document.


    '''

    def __init__(self, document: Document, callback: SessionCallback) -> None:
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            callback (SessionCallback) :
                The callback to remove

        '''
        super().__init__(document)
        self.callback = callback

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._session_callback_removed`` if
        it exists.

        '''
        super().dispatch(receiver)
        if isinstance(receiver, SessionCallbackRemovedMixin):
            receiver._session_callback_removed(self)

DocumentChangeCallback = Callable[[DocumentChangedEvent], None]

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
