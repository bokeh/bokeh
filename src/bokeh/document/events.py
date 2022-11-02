#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
        -> Sesssion callback generates JSON message from event object
        -> Session sends JSON message over websocket

But events may also be triggered from the client, and arrive as JSON messages
over the transport layer, which is why the JSON handling and Document API must
be separated. Consider the alternative sequence of events:

.. code-block::

    Session recieves JSON message over websocket
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
    List,
    Type,
    Union,
    cast,
)

# Bokeh imports
from ..core.serialization import Serializable, Serializer
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
    from typing_extensions import TypeAlias

    from ..core.has_props import Setter
    from ..model import Model
    from ..models.sources import DataDict
    from ..protocol.message import BufferRef
    from ..server.callbacks import SessionCallback
    from .document import Document
    from .json import Patches

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
    Buffers: TypeAlias = Union[List[BufferRef], None]

    Invoker: TypeAlias = Callable[..., Any] # TODO

class DocumentChangedMixin:
    def _document_changed(self, event: DocumentChangedEvent) -> None: ...
class DocumentPatchedMixin:
    def _document_patched(self, event: DocumentPatchedEvent) -> None: ...
class DocumentMessageSentMixin:
    def _document_message_sent(self, event: MessageSentEvent) -> None: ...
class DocumentModelChangedMixin:
    def _document_model_changed(self, event: ModelChangedEvent) -> None: ...
class ColumnDataChangedMixin:
    def _column_data_changed(self, event: ColumnDataChangedEvent) -> None: ...
class ColumnsStreamedMixin:
    def _columns_streamed(self, event: ColumnsStreamedEvent) -> None: ...
class ColumnsPatchedMixin:
    def _columns_patched(self, event: ColumnsPatchedEvent) -> None: ...
class SessionCallbackAddedMixin:
    def _session_callback_added(self, event: SessionCallbackAdded) -> None: ...
class SessionCallbackRemovedMixin:
    def _session_callback_removed(self, event: SessionCallbackRemoved) -> None: ...

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
        if hasattr(receiver, '_document_changed'):
            cast(DocumentChangedMixin, receiver)._document_changed(self)

class DocumentPatchedEvent(DocumentChangedEvent, Serializable):
    ''' A Base class for events that represent updating Bokeh Models and
    their properties.

    '''

    kind: ClassVar[str]

    _handlers: ClassVar[dict[str, Type[DocumentPatchedEvent]]] = {}

    def __init_subclass__(cls):
        cls._handlers[cls.kind] = cls

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._document_patched`` if it exists.

        '''
        super().dispatch(receiver)
        if hasattr(receiver, '_document_patched'):
            cast(DocumentPatchedMixin, receiver)._document_patched(self)

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
        event_kind = event_rep.pop("kind")
        event_cls = DocumentPatchedEvent._handlers.get(event_kind, None)
        if event_cls is None:
            raise RuntimeError(f"unknown patch event type '{event_kind!r}'")

        event = event_cls(document=doc, setter=setter, **event_rep)
        event_cls._handle_event(doc, event)

    @staticmethod
    def _handle_event(doc: Document, event: DocumentPatchedEvent) -> None:
        raise NotImplementedError()

class MessageSentEvent(DocumentPatchedEvent):
    '''

    '''

    kind = "MessageSent"

    def __init__(self, document: Document, msg_type: str, msg_data: Any | bytes,
            setter: Setter | None = None, callback_invoker: Invoker | None = None):
        super().__init__(document, setter, callback_invoker)
        self.msg_type = msg_type
        self.msg_data = msg_data

    def dispatch(self, receiver: Any) -> None:
        super().dispatch(receiver)
        if hasattr(receiver, "_document_message_sent"):
            cast(DocumentMessageSentMixin, receiver)._document_message_sent(self)

    def to_serializable(self, serializer: Serializer) -> MessageSent:
        return MessageSent(
            kind=self.kind,
            msg_type=self.msg_type,
            msg_data=serializer.encode(self.msg_data),
        )

    @staticmethod
    def _handle_event(doc: Document, event: MessageSentEvent) -> None:
        message_callbacks = doc.callbacks._message_callbacks.get(event.msg_type, [])
        for cb in message_callbacks:
            cb(event.msg_data)

class ModelChangedEvent(DocumentPatchedEvent):
    ''' A concrete event representing updating an attribute and value of a
    specific Bokeh Model.

    '''

    kind = "ModelChanged"

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
        if hasattr(receiver, '_document_model_changed'):
            cast(DocumentModelChangedMixin, receiver)._document_model_changed(self)

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

    @staticmethod
    def _handle_event(doc: Document, event: ModelChangedEvent) -> None:
        model = event.model
        attr = event.attr
        value = event.new
        model.set_from_json(attr, value, setter=event.setter)

class ColumnDataChangedEvent(DocumentPatchedEvent):
    ''' A concrete event representing efficiently replacing *all*
    existing data for a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    kind = "ColumnDataChanged"

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
        if hasattr(receiver, '_column_data_changed'):
            cast(ColumnDataChangedMixin, receiver)._column_data_changed(self)

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

    @staticmethod
    def _handle_event(doc: Document, event: ColumnDataChangedEvent) -> None:
        model = event.model
        attr = event.attr
        data = event.data
        model.set_from_json(attr, data, setter=event.setter)

class ColumnsStreamedEvent(DocumentPatchedEvent):
    ''' A concrete event representing efficiently streaming new data
    to a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    kind = "ColumnsStreamed"

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


        import pandas as pd
        if isinstance(data, pd.DataFrame):
            data = {c: data[c] for c in data.columns}

        self.data = data
        self.rollover = rollover

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._columns_streamed`` if it exists.

        '''
        super().dispatch(receiver)
        if hasattr(receiver, '_columns_streamed'):
            cast(ColumnsStreamedMixin, receiver)._columns_streamed(self)

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

    @staticmethod
    def _handle_event(doc: Document, event: ColumnsStreamedEvent) -> None:
        model = event.model
        attr = event.attr
        assert attr == "data"
        data = event.data
        rollover = event.rollover
        model._stream(data, rollover, event.setter)

class ColumnsPatchedEvent(DocumentPatchedEvent):
    ''' A concrete event representing efficiently applying data patches
    to a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    kind = "ColumnsPatched"

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
        if hasattr(receiver, '_columns_patched'):
            cast(ColumnsPatchedMixin, receiver)._columns_patched(self)

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

    @staticmethod
    def _handle_event(doc: Document, event: ColumnsPatchedEvent) -> None:
        model = event.model
        attr = event.attr
        assert attr == "data"
        patches = event.patches
        model.patch(patches, event.setter)

class TitleChangedEvent(DocumentPatchedEvent):
    ''' A concrete event representing a change to the title of a Bokeh
    Document.

    '''

    kind = "TitleChanged"

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

    @staticmethod
    def _handle_event(doc: Document, event: TitleChangedEvent) -> None:
        doc.set_title(event.title, event.setter)

class RootAddedEvent(DocumentPatchedEvent):
    ''' A concrete event representing a change to add a new Model to a
    Document's collection of "root" models.

    '''

    kind = "RootAdded"

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

    @staticmethod
    def _handle_event(doc: Document, event: RootAddedEvent) -> None:
        model = event.model
        doc.add_root(model, event.setter)

class RootRemovedEvent(DocumentPatchedEvent):
    ''' A concrete event representing a change to remove an existing Model
    from a Document's collection of "root" models.

    '''

    kind = "RootRemoved"

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
        if hasattr(receiver, '_session_callback_added'):
            cast(SessionCallbackAddedMixin, receiver)._session_callback_added(self)

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
        if hasattr(receiver, '_session_callback_removed'):
            cast(SessionCallbackRemovedMixin, receiver)._session_callback_removed(self)

DocumentChangeCallback = Callable[[DocumentChangedEvent], None]

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
