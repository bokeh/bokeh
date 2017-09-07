''' Provide events that represent various changes to Bokeh Documents.

These events are used internally to signal changes to Documents. For
information about user-facing (e.g. UI or tool) events, see the reference
for :ref:`bokeh.events`.

'''
from __future__ import absolute_import

class DocumentChangedEvent(object):
    ''' Base class for all internal events representing a change to a
    Bokeh Document.

    '''

    def __init__(self, document, setter=None):
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

        '''
        self.document = document
        self.setter = setter

    def dispatch(self, receiver):
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._document_changed`` if it exists.

        '''
        if hasattr(receiver, '_document_changed'):
            receiver._document_changed(self)

class DocumentPatchedEvent(DocumentChangedEvent):
    ''' A Base class for events that represent updating Bokeh Models and
    their properties.

    '''

    def dispatch(self, receiver):
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._document_patched`` if it exists.

        '''
        super(DocumentPatchedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_document_patched'):
            receiver._document_patched(self)

    def generate(self, references, buffers):
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

class ModelChangedEvent(DocumentPatchedEvent):
    ''' A concrete event representing updating an attribute and value of a
    specific Bokeh Model.

    This is the "standard" way of updating most Bokeh model attributes. For
    special casing situations that can optimized (e.g. streaming, etc.), a
    ``hint`` may be supplied that overrides normal mechanisms.

    '''

    def __init__(self, document, model, attr, old, new, serializable_new, hint=None, setter=None):
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

        '''
        if setter is None and isinstance(hint, (ColumnsStreamedEvent, ColumnsPatchedEvent)):
            setter = hint.setter
        super(ModelChangedEvent, self).__init__(document, setter)
        self.model = model
        self.attr = attr
        self.old = old
        self.new = new
        self.serializable_new = serializable_new
        self.hint = hint

    def dispatch(self, receiver):
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._document_model_dhanged`` if it
        exists.

        '''
        super(ModelChangedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_document_model_changed'):
            receiver._document_model_changed(self)

    def generate(self, references, buffers):
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

        return { 'kind'  : 'ModelChanged',
                 'model' : self.model.ref,
                 'attr'  : self.attr,
                 'new'   : value }

class ColumnDataChangedEvent(DocumentPatchedEvent):
    ''' A concrete event representing efficiently replacing *all*
    existing data for a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    def __init__(self, document, column_source, setter=None):
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            column_source (ColumnDataSource) :

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                See :class:`~bokeh.document.events.DocumentChangedEvent`
                for more details.

        '''
        super(ColumnDataChangedEvent, self).__init__(document, setter)
        self.column_source = column_source

    def dispatch(self, receiver):
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._column_data_changed`` if it exists.

        '''
        super(ColumnDataChangedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_column_data_changed)'):
            receiver._column_data_changed(self)

    def generate(self, references, buffers):
        ''' Create a JSON representation of this event suitable for sending
        to clients.

        .. code-block:: python

            {
                'kind'          : 'ColumnDataChanged'
                'column_source' : <reference to a CDS>
                'new'           : <new data to steam to column_source>
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

        return { 'kind'          : 'ColumnDataChanged',
                 'column_source' : self.column_source.ref,
                 'new'          : transform_column_source_data(self.column_source.data) }

class ColumnsStreamedEvent(DocumentPatchedEvent):
    ''' A concrete event representing efficiently streaming new data
    to a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    def __init__(self, document, column_source, data, rollover, setter=None):
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            column_source (ColumnDataSource) :
                The data source to stream new data to.

            data (dict) :

            rollover (int) :
                A rollover limit. If the data source columns exceed this
                limit, earlier values will be discarded to maintain the
                column length under the limit.

            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                See :class:`~bokeh.document.events.DocumentChangedEvent`
                for more details.

        '''
        super(ColumnsStreamedEvent, self).__init__(document, setter)
        self.column_source = column_source
        self.data = data
        self.rollover = rollover

    def dispatch(self, receiver):
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._columns_streamed`` if it exists.

        '''
        super(ColumnsStreamedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_columns_streamed'):
            receiver._columns_streamed(self)

    def generate(self, references, buffers):
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
        return { 'kind'          : 'ColumnsStreamed',
                 'column_source' : self.column_source.ref,
                 'data'          : self.data,
                 'rollover'      : self.rollover }

class ColumnsPatchedEvent(DocumentPatchedEvent):
    ''' A concrete event representing efficiently applying data patches
    to a :class:`~bokeh.models.sources.ColumnDataSource`

    '''

    def __init__(self, document, column_source, patches, setter=None):
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

        '''
        super(ColumnsPatchedEvent, self).__init__(document, setter)
        self.column_source = column_source
        self.patches = patches

    def dispatch(self, receiver):
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._columns_patched`` if it exists.

        '''
        super(ColumnsPatchedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_columns_patched'):
            receiver._columns_patched(self)

    def generate(self, references, buffers):
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
        return { 'kind'          : 'ColumnsPatched',
                 'column_source' : self.column_source.ref,
                 'patches'       : self.patches }

class TitleChangedEvent(DocumentPatchedEvent):
    ''' A concrete event representing a change to the title of a Bokeh
    Document.

    '''

    def __init__(self, document, title, setter=None):
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

        '''
        super(TitleChangedEvent, self).__init__(document, setter)
        self.title = title

    def generate(self, references, buffers):
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
        return { 'kind'  : 'TitleChanged',
                 'title' : self.title }

class RootAddedEvent(DocumentPatchedEvent):
    ''' A concrete event representing a change to add a new Model to a
    Document's collection of "root" models.

    '''

    def __init__(self, document, model, setter=None):
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

        '''
        super(RootAddedEvent, self).__init__(document, setter)
        self.model = model

    def generate(self, references, buffers):
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
        return { 'kind'  : 'RootAdded',
                 'model' : self.model.ref }

class RootRemovedEvent(DocumentPatchedEvent):
    ''' A concrete event representing a change to remove an existing Model
    from a Document's collection of "root" models.

    '''

    def __init__(self, document, model, setter=None):
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

        '''
        super(RootRemovedEvent, self).__init__(document, setter)
        self.model = model

    def generate(self, references, buffers):
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
        return { 'kind'  : 'RootRemoved',
                 'model' : self.model.ref }

class SessionCallbackAdded(DocumentChangedEvent):
    ''' A concrete event representing a change to add a new callback (e.g.
    periodic, timeout, or "next tick") to a Document.

    '''

    def __init__(self, document, callback):
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            callback (SessionCallback) :
                The callback to add

        '''
        super(SessionCallbackAdded, self).__init__(document)
        self.callback = callback

    def dispatch(self, receiver):
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._session_callback_added`` if
        it exists.

        '''
        super(SessionCallbackAdded, self).dispatch(receiver)
        if hasattr(receiver, '_session_callback_added'):
            receiver._session_callback_added(self)

class SessionCallbackRemoved(DocumentChangedEvent):
    ''' A concrete event representing a change to remove an existing callback
    (e.g. periodic, timeout, or "next tick") from a Document.


    '''

    def __init__(self, document, callback):
        '''

        Args:
            document (Document) :
                A Bokeh document that is to be updated.

            callback (SessionCallback) :
                The callback to remove

        '''
        super(SessionCallbackRemoved, self).__init__(document)
        self.callback = callback

    def dispatch(self, receiver):
        ''' Dispatch handling of this event to a receiver.

        This method will invoke ``receiver._session_callback_removed`` if
        it exists.

        '''
        super(SessionCallbackRemoved, self).dispatch(receiver)
        if hasattr(receiver, '_session_callback_removed'):
            receiver._session_callback_removed(self)
