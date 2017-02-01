'''

'''
from __future__ import absolute_import

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
        super(ModelChangedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_columns_streamed'):
            receiver._columns_streamed(self)

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
        super(ModelChangedEvent, self).dispatch(receiver)
        if hasattr(receiver, '_columns_patched'):
            receiver._columns_patched(self)

class TitleChangedEvent(DocumentPatchedEvent):
    '''

    '''

    def __init__(self, document, title, setter=None):
        '''

        '''
        super(TitleChangedEvent, self).__init__(document, setter)
        self.title = title

class RootAddedEvent(DocumentPatchedEvent):
    '''

    '''

    def __init__(self, document, model, setter=None):
        '''

        '''
        super(RootAddedEvent, self).__init__(document, setter)
        self.model = model

class RootRemovedEvent(DocumentPatchedEvent):
    '''

    '''

    def __init__(self, document, model, setter=None):
        '''

        '''
        super(RootRemovedEvent, self).__init__(document, setter)
        self.model = model

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
