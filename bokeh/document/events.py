#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide events that represent various changes to Bokeh Documents.

These events are used internally to signal changes to Documents. For
information about user-facing (e.g. UI or tool) events, see the reference
for :ref:`bokeh.events`.

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
    List,
    Set,
    Union,
    cast,
)

## External imports
if TYPE_CHECKING:
    import pandas as pd
else:
    from ..util.dependencies import import_optional
    pd = import_optional('pandas')

# Bokeh imports
from ..util.serialization import make_id
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
    from ..core.has_props import Setter
    from ..core.types import Unknown
    from ..model import Model
    from ..models.sources import ColumnarDataSource, DataDict
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
    Buffers = Union[List[BufferRef], None]

    Invoker = Callable[..., Any] # TODO

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

class DocumentPatchedEvent(DocumentChangedEvent):
    ''' A Base class for events that represent updating Bokeh Models and
    their properties.

    '''

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._document_patched`` if it exists.

        '''
        super().dispatch(receiver)
        if hasattr(receiver, '_document_patched'):
            cast(DocumentPatchedMixin, receiver)._document_patched(self)

    def generate(self, references: Set[Model], buffers: Buffers) -> DocumentPatched:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        *Sub-classes must implement this method.*

        Args:
            references (dict[str, Model]) :
                If the event requires references to certain models in order to
                function, they may be collected here.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

            buffers (set) :
                If the event needs to supply any additional Bokeh protocol
                buffers, they may be added to this set.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

        '''
        raise NotImplementedError()

class MessageSentEvent(DocumentPatchedEvent):
    """ """

    def __init__(self, document: Document, msg_type: str, msg_data: Union[Any, bytes],
            setter: Setter | None = None, callback_invoker: Invoker | None = None):
        super().__init__(document, setter, callback_invoker)
        self.msg_type = msg_type
        self.msg_data = msg_data

    def dispatch(self, receiver: Any) -> None:
        super().dispatch(receiver)
        if hasattr(receiver, "_document_message_sent"):
            cast(DocumentMessageSentMixin, receiver)._document_message_sent(self)

    def generate(self, references: Set[Model], buffers: Buffers) -> MessageSent:
        msg = MessageSent(
            kind="MessageSent",
            msg_type=self.msg_type,
            msg_data=None,
        )

        if not isinstance(self.msg_data, bytes):
            msg["msg_data"] = self.msg_data
        else:
            assert buffers is not None
            buffer_id = make_id()
            buf = (dict(id=buffer_id), self.msg_data)
            buffers.append(buf)

        return msg

class ModelChangedEvent(DocumentPatchedEvent):
    ''' A concrete event representing updating an attribute and value of a
    specific Bokeh Model.

    This is the "standard" way of updating most Bokeh model attributes. For
    special casing situations that can optimized (e.g. streaming, etc.), a
    ``hint`` may be supplied that overrides normal mechanisms.

    '''

    def __init__(self, document: Document, model: Model, attr: str, old: Unknown, new: Unknown,
            serializable_new: Unknown | None, hint: DocumentPatchedEvent | None = None,
            setter: Setter | None = None, callback_invoker: Invoker | None = None):
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            model (Model) :
                A Model to update

            attr (str) :
                The name of the attribute to update on the model.

            old (object) :
                The old value of the attribute

            new (object) :
                The new value of the attribute

            serializable_new (object) :
                A serialized (JSON) version of the new value. It may be
                ``None`` if a hint is supplied.

            hint (DocumentPatchedEvent, optional) :
                When appropriate, a secondary event may be supplied that
                modifies the normal update process. For example, in order
                to stream or patch data more efficiently than the standard
                update mechanism.

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
        if setter is None and isinstance(hint, (ColumnsStreamedEvent, ColumnsPatchedEvent)):
            setter = hint.setter
        super().__init__(document, setter, callback_invoker)
        self.model = model
        self.attr = attr
        self.old = old
        self.new = new
        self.serializable_new = serializable_new
        self.hint = hint

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

        if self.hint is not None and event.hint is not None:
            return self.hint.combine(event.hint)

        if (self.model == event.model) and (self.attr == event.attr):
            self.new = event.new
            self.serializable_new = event.serializable_new
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

    def generate(self, references: Set[Model], buffers: Buffers) -> ModelChanged:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        Args:
            references (dict[str, Model]) :
                If the event requires references to certain models in order to
                function, they may be collected here.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

            buffers (set) :
                If the event needs to supply any additional Bokeh protocol
                buffers, they may be added to this set.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

        '''
        from ..model import collect_models

        if self.hint is not None:
            return self.hint.generate(references, buffers)

        value = self.serializable_new

        # the new value is an object that may have
        # not-yet-in-the-remote-doc references, and may also
        # itself not be in the remote doc yet.  the remote may
        # already have some of the references, but
        # unfortunately we don't have an easy way to know
        # unless we were to check BEFORE the attr gets changed
        # (we need the old _all_models before setting the
        # property). So we have to send all the references the
        # remote could need, even though it could be inefficient.
        # If it turns out we need to fix this we could probably
        # do it by adding some complexity.
        value_refs = set(collect_models(value))

        # we know we don't want a whole new copy of the obj we're patching
        # unless it's also the new value
        if self.model != value:
            value_refs.discard(self.model)

        references.update(value_refs)

        return ModelChanged(
            kind  = "ModelChanged",
            model = self.model.ref,
            attr  = self.attr,
            new   = value,
            hint  = None,
        )

class ColumnDataChangedEvent(DocumentPatchedEvent):
    ''' A concrete event representing efficiently replacing *all*
    existing data for a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    def __init__(self, document: Document, column_source: ColumnarDataSource,
            cols: List[str] | None = None, setter: Setter | None = None, callback_invoker: Invoker | None = None):
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
        self.column_source = column_source
        self.cols = cols

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._column_data_changed`` if it exists.

        '''
        super().dispatch(receiver)
        if hasattr(receiver, '_column_data_changed'):
            cast(ColumnDataChangedMixin, receiver)._column_data_changed(self)

    def generate(self, references: Set[Model], buffers: Buffers) -> ColumnDataChanged:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'          : 'ColumnDataChanged'
                'column_source' : <reference to a CDS>
                'new'           : <new data to steam to column_source>
                'cols'          : <specific columns to update>
            }

        Args:
            references (dict[str, Model]) :
                If the event requires references to certain models in order to
                function, they may be collected here.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

            buffers (set) :
                If the event needs to supply any additional Bokeh protocol
                buffers, they may be added to this set.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.


        '''
        from ..util.serialization import transform_column_source_data

        data_dict = transform_column_source_data(self.column_source.data, buffers=buffers, cols=self.cols)

        return ColumnDataChanged(
            kind          = "ColumnDataChanged",
            column_source = self.column_source.ref,
            new           = data_dict,
            cols          = self.cols,
        )

class ColumnsStreamedEvent(DocumentPatchedEvent):
    ''' A concrete event representing efficiently streaming new data
    to a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    data: DataDict

    def __init__(self, document: Document, column_source: ColumnarDataSource, data: DataDict | pd.DataFrame,
            rollover: int | None, setter: Setter | None = None, callback_invoker: Invoker | None = None):
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            column_source (ColumnDataSource) :
                The data source to stream new data to.

            data (dict or DataFrame) :
                New data to stream.

                If a DataFrame, will be stored as ``{c: df[c] for c in df.columns}``

            rollover (int) :
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
        self.column_source = column_source

        if pd and isinstance(data, pd.DataFrame):
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

    def generate(self, references: Set[Model], buffers: Buffers) -> ColumnsStreamed:
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
            references (dict[str, Model]) :
                If the event requires references to certain models in order to
                function, they may be collected here.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

            buffers (set) :
                If the event needs to supply any additional Bokeh protocol
                buffers, they may be added to this set.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

        '''
        return ColumnsStreamed(
            kind          = "ColumnsStreamed",
            column_source = self.column_source.ref,
            data          = self.data,
            rollover      = self.rollover,
        )

class ColumnsPatchedEvent(DocumentPatchedEvent):
    ''' A concrete event representing efficiently applying data patches
    to a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    def __init__(self, document: Document, column_source: ColumnarDataSource, patches: Patches,
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
        self.column_source = column_source
        self.patches = patches

    def dispatch(self, receiver: Any) -> None:
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._columns_patched`` if it exists.

        '''
        super().dispatch(receiver)
        if hasattr(receiver, '_columns_patched'):
            cast(ColumnsPatchedMixin, receiver)._columns_patched(self)

    def generate(self, references: Set[Model], buffers: Buffers) -> ColumnsPatched:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'          : 'ColumnsPatched'
                'column_source' : <reference to a CDS>
                'patches'       : <patches to apply to column_source>
            }

        Args:
            references (dict[str, Model]) :
                If the event requires references to certain models in order to
                function, they may be collected here.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

            buffers (set) :
                If the event needs to supply any additional Bokeh protocol
                buffers, they may be added to this set.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

        '''
        return ColumnsPatched(
            kind          = "ColumnsPatched",
            column_source = self.column_source.ref,
            patches       = self.patches,
        )

class TitleChangedEvent(DocumentPatchedEvent):
    ''' A concrete event representing a change to the title of a Bokeh
    Document.

    '''

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

    def generate(self, references: Set[Model], buffers: Buffers) -> TitleChanged:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'  : 'TitleChanged'
                'title' : <new title to set>
            }

        Args:
            references (dict[str, Model]) :
                If the event requires references to certain models in order to
                function, they may be collected here.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

            buffers (set) :
                If the event needs to supply any additional Bokeh protocol
                buffers, they may be added to this set.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

        '''
        return TitleChanged(
            kind  = "TitleChanged",
            title = self.title,
        )

class RootAddedEvent(DocumentPatchedEvent):
    ''' A concrete event representing a change to add a new Model to a
    Document's collection of "root" models.

    '''

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

    def generate(self, references: Set[Model], buffers: Buffers) -> RootAdded:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'  : 'RootAdded'
                'title' : <reference to a Model>
            }

        Args:
            references (dict[str, Model]) :
                If the event requires references to certain models in order to
                function, they may be collected here.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

            buffers (set) :
                If the event needs to supply any additional Bokeh protocol
                buffers, they may be added to this set.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

        '''
        references.update(self.model.references())
        return RootAdded(
            kind  = "RootAdded",
            model = self.model.ref,
        )

class RootRemovedEvent(DocumentPatchedEvent):
    ''' A concrete event representing a change to remove an existing Model
    from a Document's collection of "root" models.

    '''

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

    def generate(self, references: Set[Model], buffers: Buffers) -> RootRemoved:
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'  : 'RootRemoved'
                'title' : <reference to a Model>
            }

        Args:
            references (dict[str, Model]) :
                If the event requires references to certain models in order to
                function, they may be collected here.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

            buffers (set) :
                If the event needs to supply any additional Bokeh protocol
                buffers, they may be added to this set.

                **This is an "out" parameter**. The values it contains will be
                modified in-place.

        '''
        return RootRemoved(
            kind  = "RootRemoved",
            model = self.model.ref,
        )

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
