'''

'''
from __future__ import absolute_import

from ..util.serialization import transform_column_source_data
from ..model import collect_models

class DocumentChangedEvent(object):
    '''

    '''

    def __init__(self, document, setter=None):
        '''

        '''
        self.document = document
        self.setter = setter

    def dispatch(self, receiver):
        '''

        '''
        if hasattr(receiver, '_document_changed'):
            receiver._document_changed(self)

class DocumentPatchedEvent(DocumentChangedEvent):
    '''

    '''

    def dispatch(self, receiver):
        '''

        '''
        super(DocumentPatchedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_document_patched'):
            receiver._document_patched(self)

    def generate(self, references, buffers):
        '''

        '''
        raise NotImplementedError()

class ModelChangedEvent(DocumentPatchedEvent):
    '''

    '''

    def __init__(self, document, model, attr, old, new, serializable_new, hint=None, setter=None):
        '''

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
        '''

        '''
        super(ModelChangedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_document_model_changed'):
            receiver._document_model_changed(self)

    def generate(self, references, buffers):
        '''

        '''
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
    '''

    '''

    def __init__(self, document, column_source, setter=None):
        '''

        '''
        super(ColumnDataChangedEvent, self).__init__(document, setter)
        self.column_source = column_source

    def dispatch(self, receiver):
        '''

        '''
        super(ColumnDataChangedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_column_data_changed)'):
            receiver._column_data_changed(self)

    def generate(self, references, buffers):
        '''

        '''
        return { 'kind'          : 'ColumnDataChanged',
                 'column_source' : self.column_source.ref,
                 'new'          : transform_column_source_data(self.column_source.data) }

class ColumnsStreamedEvent(DocumentPatchedEvent):
    '''

    '''

    def __init__(self, document, column_source, data, rollover, setter=None):
        '''

        '''
        super(ColumnsStreamedEvent, self).__init__(document, setter)
        self.column_source = column_source
        self.data = data
        self.rollover = rollover

    def dispatch(self, receiver):
        '''

        '''
        super(ColumnsStreamedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_columns_streamed'):
            receiver._columns_streamed(self)

    def generate(self, references, buffers):
        '''

        '''
        return { 'kind'          : 'ColumnsStreamed',
                 'column_source' : self.column_source.ref,
                 'data'          : self.data,
                 'rollover'      : self.rollover }

class ColumnsPatchedEvent(DocumentPatchedEvent):
    '''

    '''

    def __init__(self, document, column_source, patches, setter=None):
        '''

        '''
        super(ColumnsPatchedEvent, self).__init__(document, setter)
        self.column_source = column_source
        self.patches = patches

    def dispatch(self, receiver):
        '''

        '''
        super(ColumnsPatchedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_columns_patched'):
            receiver._columns_patched(self)

    def generate(self, references, buffers):
        return { 'kind'          : 'ColumnsPatched',
                 'column_source' : self.column_source.ref,
                 'patches'       : self.patches }

class TitleChangedEvent(DocumentPatchedEvent):
    '''

    '''

    def __init__(self, document, title, setter=None):
        '''

        '''
        super(TitleChangedEvent, self).__init__(document, setter)
        self.title = title

    def generate(self, references, buffers):
        return { 'kind'  : 'TitleChanged',
                 'title' : self.title }

class RootAddedEvent(DocumentPatchedEvent):
    '''

    '''

    def __init__(self, document, model, setter=None):
        '''

        '''
        super(RootAddedEvent, self).__init__(document, setter)
        self.model = model

    def generate(self, references, buffers):
        '''

        '''
        references.update(self.model.references())
        return { 'kind'  : 'RootAdded',
                 'model' : self.model.ref }

class RootRemovedEvent(DocumentPatchedEvent):
    '''

    '''

    def __init__(self, document, model, setter=None):
        '''

        '''
        super(RootRemovedEvent, self).__init__(document, setter)
        self.model = model

    def generate(self, references, buffers):
        '''

        '''
        return { 'kind'  : 'RootRemoved',
                 'model' : self.model.ref }

class SessionCallbackAdded(DocumentChangedEvent):
    '''

    '''

    def __init__(self, document, callback):
        '''

        '''
        super(SessionCallbackAdded, self).__init__(document)
        self.callback = callback

    def dispatch(self, receiver):
        '''

        '''
        super(SessionCallbackAdded, self).dispatch(receiver)
        if hasattr(receiver, '_session_callback_added'):
            receiver._session_callback_added(self)

class SessionCallbackRemoved(DocumentChangedEvent):
    '''

    '''

    def __init__(self, document, callback):
        '''

        '''
        super(SessionCallbackRemoved, self).__init__(document)
        self.callback = callback

    def dispatch(self, receiver):
        '''

        '''
        super(SessionCallbackRemoved, self).dispatch(receiver)
        if hasattr(receiver, '_session_callback_removed'):
            receiver._session_callback_removed(self)
